// ============================================
// scripts/migrate-dedup-special-quests.js
// 스페셜 퀘스트 중복 유저 일괄 수정 (v4.37.5)
// firebase-tools 저장 refresh_token으로 자동 갱신
//
// 실행: node scripts/migrate-dedup-special-quests.js [--dry-run]
// ============================================

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PROJECT_ID = 'merge-game-7cf5f';
const DRY_RUN = process.argv.includes('--dry-run');
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const CONFIG_PATH = join(homedir(), '.config', 'configstore', 'firebase-tools.json');

const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

// ============================================
// 토큰 갱신
// ============================================
async function getValidAccessToken() {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    const tokens = config.tokens;

    // 만료됐으면 refresh
    if (!tokens.access_token || tokens.expires_at < Date.now() + 30000) {
        console.log('[auth] 토큰 만료 → 갱신 중...');
        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokens.refresh_token,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
        }).toString();
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });
        const data = await res.json();
        if (!data.access_token) throw new Error(`토큰 갱신 실패: ${JSON.stringify(data)}`);

        tokens.access_token = data.access_token;
        tokens.expires_at = Date.now() + data.expires_in * 1000;
        config.tokens = tokens;
        writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
        console.log('[auth] 토큰 갱신 완료');
    }
    return tokens.access_token;
}

// ============================================
// Firestore REST API 헬퍼
// ============================================
async function fsGet(path, token) {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`);
    return res.json();
}

async function fsPatch(path, token, fields) {
    const fieldMask = Object.keys(fields).join(',');
    const res = await fetch(`${BASE_URL}${path}?updateMask.fieldPaths=${fieldMask}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
    });
    if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}: ${await res.text()}`);
    return res.json();
}

// ============================================
// Firestore 값 변환
// ============================================
function fromFsValue(val) {
    if (val.stringValue !== undefined) return val.stringValue;
    if (val.integerValue !== undefined) return Number(val.integerValue);
    if (val.doubleValue !== undefined) return val.doubleValue;
    if (val.booleanValue !== undefined) return val.booleanValue;
    if (val.nullValue !== undefined) return null;
    if (val.arrayValue !== undefined) return (val.arrayValue.values || []).map(fromFsValue);
    if (val.mapValue !== undefined) {
        const obj = {};
        for (const [k, v] of Object.entries(val.mapValue.fields || {})) obj[k] = fromFsValue(v);
        return obj;
    }
    return undefined;
}

function toFsValue(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number')
        return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) return { arrayValue: { values: val.map(toFsValue) } };
    if (typeof val === 'object') {
        const fields = {};
        for (const [k, v] of Object.entries(val)) fields[k] = toFsValue(v);
        return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
}

// ============================================
// 핵심 로직: quests 중복 스페셜 제거
// ============================================
function dedupSpecialQuests(quests) {
    let foundSpecial = false;
    const fixed = [];
    for (let i = quests.length - 1; i >= 0; i--) {
        if (quests[i]?.isSpecial) {
            if (foundSpecial) continue;
            foundSpecial = true;
        }
        fixed.unshift(quests[i]);
    }
    return { quests: fixed, changed: fixed.length !== quests.length };
}

// ============================================
// 페이지네이션으로 전체 saves 순회
// ============================================
async function* listAllSaves(token) {
    let pageToken = null;
    let total = 0;
    do {
        const url = `/saves?pageSize=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
        const data = await fsGet(url, token);
        for (const doc of data.documents || []) yield doc;
        total += (data.documents || []).length;
        process.stdout.write(`\r[scan] ${total}명 확인 중...`);
        pageToken = data.nextPageToken || null;
    } while (pageToken);
    console.log(`\r[scan] 전체 ${total}명 완료          `);
}

// ============================================
// 메인
// ============================================
async function main() {
    console.log(`[migrate] 프로젝트: ${PROJECT_ID} | DRY_RUN: ${DRY_RUN}`);

    const token = await getValidAccessToken();
    let affected = 0;
    let updated = 0;

    for await (const doc of listAllSaves(token)) {
        const questsField = doc.fields?.quests;
        if (!questsField?.arrayValue) continue;

        const quests = (questsField.arrayValue.values || []).map(fromFsValue);
        const specialCount = quests.filter((q) => q?.isSpecial).length;
        if (specialCount <= 1) continue;

        affected++;
        const { quests: fixed } = dedupSpecialQuests(quests);
        const docId = doc.name.split('/').pop();

        console.log(
            `  [대상] uid=${docId.slice(0, 8)}... 스페셜 ${specialCount}개 → ${fixed.length - (quests.length - fixed.length)}개 (${quests.length - fixed.length}개 제거)`
        );

        if (!DRY_RUN) {
            await fsPatch(`/saves/${docId}`, token, { quests: toFsValue(fixed) });
            updated++;
            console.log(`    ✓ 수정 완료`);
        }
    }

    console.log(`\n[migrate] 결과`);
    console.log(`  - 중복 대상: ${affected}명`);
    console.log(`  - 실제 수정: ${DRY_RUN ? '(dry-run, 미수정)' : updated + '명'}`);
}

main().catch((err) => {
    console.error('[migrate] 오류:', err.message || err);
    process.exit(1);
});
