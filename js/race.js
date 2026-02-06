// ============================================
// race.js - 데일리 레이스 시스템
// ============================================

const RACE_GOAL = 15; // 퀘스트 15개 완료
const RACE_MAX_PER_DAY = 3; // 하루 3회 제한
const RACE_CODE_EXPIRE_MS = 10 * 60 * 1000; // 초대 코드 10분 만료
const RACE_REWARDS = {
    win: { coins: 500, diamonds: 20 },
    lose: { coins: 100, diamonds: 0 },
    draw: { coins: 300, diamonds: 10 },
};

// --- 초대 코드 생성 ---
function generateRaceCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 문자 제외
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// --- 레이스 생성 + 코드 발급 ---
async function createRaceWithCode() {
    if (!currentUser) {
        showToast('로그인이 필요합니다');
        return null;
    }
    if (!canJoinRace()) {
        showToast(`오늘 레이스 ${RACE_MAX_PER_DAY}회 완료!`);
        return null;
    }
    if (currentRaceId) {
        showToast('이미 진행 중인 레이스가 있습니다');
        return null;
    }

    const code = generateRaceCode();
    const now = Date.now();
    const midnight = getNextMidnightUTC();

    try {
        // 레이스 문서 생성
        const raceRef = db.collection('races').doc();
        const raceData = {
            hostUid: currentUser.uid,
            hostName: currentUser.displayName?.split(' ')[0] || '유저',
            guestUid: null,
            guestName: null,
            status: 'pending',
            hostProgress: 0,
            guestProgress: 0,
            winnerUid: null,
            rewardClaimed: {},
            createdAt: now,
            expiresAt: midnight,
        };
        await raceRef.set(raceData);

        // 초대 코드 문서 생성
        await db.collection('raceCodes').doc(code).set({
            raceId: raceRef.id,
            hostUid: currentUser.uid,
            hostName: raceData.hostName,
            createdAt: now,
            expiresAt: now + RACE_CODE_EXPIRE_MS,
        });

        currentRaceId = raceRef.id;
        saveGame();

        console.log('[Race] Created race:', raceRef.id, 'code:', code);
        return code;
    } catch (e) {
        console.error('[Race] Create failed:', e);
        showToast('레이스 생성 실패');
        return null;
    }
}

// --- 코드로 레이스 참가 ---
async function joinRaceByCode(code) {
    if (!currentUser) {
        showToast('로그인이 필요합니다');
        return false;
    }
    if (!canJoinRace()) {
        showToast(`오늘 레이스 ${RACE_MAX_PER_DAY}회 완료!`);
        return false;
    }
    if (currentRaceId) {
        showToast('이미 진행 중인 레이스가 있습니다');
        return false;
    }

    const upperCode = code.toUpperCase().trim();
    if (upperCode.length !== 6) {
        showToast('6자리 코드를 입력하세요');
        return false;
    }

    try {
        const codeDoc = await db.collection('raceCodes').doc(upperCode).get();
        if (!codeDoc.exists) {
            showToast('유효하지 않은 코드');
            return false;
        }

        const codeData = codeDoc.data();
        if (Date.now() > codeData.expiresAt) {
            showToast('만료된 코드');
            await db.collection('raceCodes').doc(upperCode).delete();
            return false;
        }
        if (codeData.hostUid === currentUser.uid) {
            showToast('자신의 코드는 사용 불가');
            return false;
        }

        // 레이스 문서 확인
        const raceDoc = await db.collection('races').doc(codeData.raceId).get();
        if (!raceDoc.exists || raceDoc.data().status !== 'pending') {
            showToast('이미 시작된 레이스');
            return false;
        }

        // 레이스 참가 (guest 등록 + 상태 변경)
        await db.collection('races').doc(codeData.raceId).update({
            guestUid: currentUser.uid,
            guestName: currentUser.displayName?.split(' ')[0] || '유저',
            status: 'active',
        });

        // 코드 삭제
        await db.collection('raceCodes').doc(upperCode).delete();

        currentRaceId = codeData.raceId;
        todayRaceCount++;
        lastRaceDate = new Date().toISOString().slice(0, 10);
        saveGame();

        startRaceListener(codeData.raceId);
        showToast('레이스 참가 완료!');
        updateRaceUI();
        return true;
    } catch (e) {
        console.error('[Race] Join failed:', e);
        showToast('참가 실패');
        return false;
    }
}

// --- 클립보드 복사 ---
async function copyRaceCode(code) {
    try {
        await navigator.clipboard.writeText(code);
        showToast('코드 복사됨!');
    } catch {
        // fallback
        const input = document.createElement('input');
        input.value = code;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('코드 복사됨!');
    }
}

// --- 레이스 리스너 시작 ---
function startRaceListener(raceId) {
    stopRaceListener();
    if (!raceId) return;

    raceUnsubscribe = db
        .collection('races')
        .doc(raceId)
        .onSnapshot(
            (doc) => {
                if (!doc.exists) {
                    console.log('[Race] Race deleted');
                    currentRaceId = null;
                    stopRaceListener();
                    updateRaceUI();
                    return;
                }

                const data = doc.data();
                updateRaceUIFromData(data);

                // 승리 체크
                if (data.status === 'active') {
                    if (data.hostProgress >= RACE_GOAL || data.guestProgress >= RACE_GOAL) {
                        checkRaceWinner(raceId, data);
                    }
                }

                // 완료 상태면 결과 표시
                if (data.status === 'completed' && data.winnerUid) {
                    showRaceResult(data);
                }
            },
            (err) => {
                console.error('[Race] Listener error:', err);
            }
        );
}

// --- 레이스 리스너 중지 ---
function stopRaceListener() {
    if (raceUnsubscribe) {
        raceUnsubscribe();
        raceUnsubscribe = null;
    }
}

// --- 퀘스트 완료 시 진행도 업데이트 ---
async function updateRaceProgress() {
    if (!currentRaceId || !currentUser) return;

    try {
        const raceDoc = await db.collection('races').doc(currentRaceId).get();
        if (!raceDoc.exists) return;

        const data = raceDoc.data();
        if (data.status !== 'active') return;

        const isHost = data.hostUid === currentUser.uid;
        const field = isHost ? 'hostProgress' : 'guestProgress';
        const currentProgress = isHost ? data.hostProgress : data.guestProgress;

        if (currentProgress >= RACE_GOAL) return;

        await db
            .collection('races')
            .doc(currentRaceId)
            .update({
                [field]: currentProgress + 1,
            });

        console.log('[Race] Progress updated:', currentProgress + 1);
    } catch (e) {
        console.error('[Race] Progress update failed:', e);
    }
}

// --- 승리자 판정 ---
async function checkRaceWinner(raceId, data) {
    if (!currentUser) return;

    // 이미 완료됨
    if (data.status === 'completed') return;

    // 호스트가 판정 담당 (중복 방지)
    if (data.hostUid !== currentUser.uid) return;

    let winnerUid = null;
    if (data.hostProgress >= RACE_GOAL && data.guestProgress >= RACE_GOAL) {
        winnerUid = 'draw';
    } else if (data.hostProgress >= RACE_GOAL) {
        winnerUid = data.hostUid;
    } else if (data.guestProgress >= RACE_GOAL) {
        winnerUid = data.guestUid;
    }

    if (!winnerUid) return;

    try {
        await db.collection('races').doc(raceId).update({
            status: 'completed',
            winnerUid: winnerUid,
        });
        console.log('[Race] Winner declared:', winnerUid);
    } catch (e) {
        console.error('[Race] Winner declaration failed:', e);
    }
}

// --- 결과 표시 + 보상 지급 ---
function showRaceResult(data) {
    if (!currentUser) return;

    const uid = currentUser.uid;
    const isHost = data.hostUid === uid;
    const myProgress = isHost ? data.hostProgress : data.guestProgress;
    const oppProgress = isHost ? data.guestProgress : data.hostProgress;
    const oppName = isHost ? data.guestName : data.hostName;

    // 이미 보상 받음
    if (data.rewardClaimed && data.rewardClaimed[uid]) {
        updateRaceUI();
        return;
    }

    let result, reward;
    if (data.winnerUid === 'draw') {
        result = 'draw';
        reward = RACE_REWARDS.draw;
    } else if (data.winnerUid === uid) {
        result = 'win';
        reward = RACE_REWARDS.win;
        raceWins++;
    } else {
        result = 'lose';
        reward = RACE_REWARDS.lose;
        raceLosses++;
    }

    // 보상 지급
    coins += reward.coins;
    cumulativeCoins += reward.coins;
    diamonds += reward.diamonds;

    // 보상 수령 표시
    claimRaceReward(data);

    // 레이스 종료
    currentRaceId = null;
    todayRaceCount++;
    stopRaceListener();
    saveGame();
    updateAll();
    updateRaceUI();

    // 결과 팝업
    const resultText = result === 'win' ? '🏆 승리!' : result === 'lose' ? '😢 패배' : '🤝 무승부';
    const rewardText = `${reward.coins}🪙` + (reward.diamonds > 0 ? ` ${reward.diamonds}💎` : '');
    showMilestonePopup(resultText, rewardText);
}

// --- 보상 수령 기록 ---
async function claimRaceReward(data) {
    if (!currentUser || !currentRaceId) return;

    try {
        await db
            .collection('races')
            .doc(currentRaceId)
            .update({
                [`rewardClaimed.${currentUser.uid}`]: true,
            });
    } catch (e) {
        console.error('[Race] Claim reward failed:', e);
    }
}

// --- 참가 가능 여부 ---
function canJoinRace() {
    const today = new Date().toISOString().slice(0, 10);
    if (lastRaceDate !== today) {
        return true;
    }
    return todayRaceCount < RACE_MAX_PER_DAY;
}

// --- 다음 자정 (UTC) ---
function getNextMidnightUTC() {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    return tomorrow.getTime();
}

// --- 레이스 리셋 체크 ---
function checkRaceReset() {
    const today = new Date().toISOString().slice(0, 10);
    if (lastRaceDate !== today) {
        lastRaceDate = today;
        todayRaceCount = 0;
        currentRaceId = null;
        stopRaceListener();
        saveGame();
    }
}

// --- UI: 레이스바 업데이트 ---
function updateRaceUI() {
    const raceBar = document.getElementById('race-bar');
    if (!raceBar) return;

    const timerEl = document.getElementById('race-timer');
    const trackEl = document.getElementById('race-track');
    const inviteBtn = document.getElementById('race-invite-btn');
    const countEl = document.getElementById('race-count');

    // 남은 횟수
    const remaining = RACE_MAX_PER_DAY - todayRaceCount;
    if (countEl) countEl.innerText = `${remaining}/${RACE_MAX_PER_DAY}`;

    // 자정까지 시간
    if (timerEl) {
        const ms = getNextMidnightUTC() - Date.now();
        timerEl.innerText = formatRaceTimer(ms);
    }

    // 레이스 진행 중이 아닐 때
    if (!currentRaceId) {
        if (trackEl) trackEl.innerHTML = '<div class="text-gray-400 text-[10px] py-2">친구를 초대해서 경쟁하세요!</div>';
        if (inviteBtn) inviteBtn.classList.remove('hidden');
        return;
    }

    // 레이스 진행 중이면 리스너가 UI 업데이트
    if (inviteBtn) inviteBtn.classList.add('hidden');
}

// --- UI: 레이스 데이터로 업데이트 ---
function updateRaceUIFromData(data) {
    const trackEl = document.getElementById('race-track');
    if (!trackEl || !currentUser) return;

    const isHost = data.hostUid === currentUser.uid;
    const myName = isHost ? data.hostName : data.guestName || '나';
    const myProgress = isHost ? data.hostProgress : data.guestProgress;
    const oppName = isHost ? data.guestName : data.hostName;
    const oppProgress = isHost ? data.guestProgress : data.hostProgress;

    if (data.status === 'pending') {
        trackEl.innerHTML = `<div class="text-fuchsia-500 text-[10px] py-2 animate-pulse">상대방 대기 중...</div>`;
        return;
    }

    const myPercent = Math.min((myProgress / RACE_GOAL) * 85, 85);
    const oppPercent = Math.min((oppProgress / RACE_GOAL) * 85, 85);

    trackEl.innerHTML = `
        <div class="race-lane">
            <span class="race-label">나</span>
            <div class="race-road">
                <div class="race-car" style="left: ${myPercent}%">🚗</div>
                <div class="race-finish">🏁</div>
            </div>
            <span class="race-progress">${myProgress}/${RACE_GOAL}</span>
        </div>
        <div class="race-lane">
            <span class="race-label">${oppName || '상대'}</span>
            <div class="race-road">
                <div class="race-car" style="left: ${oppPercent}%">🚙</div>
                <div class="race-finish">🏁</div>
            </div>
            <span class="race-progress">${oppProgress}/${RACE_GOAL}</span>
        </div>
    `;
}

// --- 타이머 포맷 ---
function formatRaceTimer(ms) {
    if (ms <= 0) return '00:00:00';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// --- 팝업: 초대 코드 생성 ---
async function openRaceInvitePopup() {
    const popup = document.getElementById('race-invite-popup');
    const codeEl = document.getElementById('race-code-display');
    const errorEl = document.getElementById('race-invite-error');

    if (!popup) return;

    errorEl.classList.add('hidden');
    codeEl.innerText = '생성 중...';
    popup.style.display = 'flex';

    const code = await createRaceWithCode();
    if (code) {
        codeEl.innerText = code;
        // 호스트도 레이스 카운트 증가
        todayRaceCount++;
        lastRaceDate = new Date().toISOString().slice(0, 10);
        startRaceListener(currentRaceId);
        updateRaceUI();
        saveGame();
    } else {
        errorEl.classList.remove('hidden');
        codeEl.innerText = '------';
    }
}

// --- 팝업: 코드 입력 ---
function openRaceJoinPopup() {
    const popup = document.getElementById('race-join-popup');
    if (!popup) return;

    document.getElementById('race-code-input').value = '';
    document.getElementById('race-join-error').classList.add('hidden');
    popup.style.display = 'flex';
}

// --- 참가 버튼 ---
async function submitRaceCode() {
    const input = document.getElementById('race-code-input');
    const errorEl = document.getElementById('race-join-error');

    if (!input) return;

    errorEl.classList.add('hidden');
    const success = await joinRaceByCode(input.value);

    if (success) {
        closeOverlay('race-join-popup');
    } else {
        errorEl.classList.remove('hidden');
    }
}

// --- 레이스 타이머 (1초마다) ---
function startRaceTimer() {
    setInterval(() => {
        checkRaceReset();
        updateRaceUI();
    }, 1000);
}

// --- 초기화 시 현재 레이스 복구 ---
function initRace() {
    checkRaceReset();
    if (currentRaceId) {
        startRaceListener(currentRaceId);
    }
    startRaceTimer();
    updateRaceUI();
}
