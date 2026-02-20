// ============================================
// save.js - 저장/로드/검증/마이그레이션
// ============================================

// 마지막 저장 시간 (포그라운드 복귀 시 사용)
let lastSavedAt = Date.now();

// --- 게임 데이터 직렬화 ---
function getGameData() {
    return {
        boardState,
        storageState,
        coins,
        cumulativeCoins,
        totalQuestsCompleted,
        diamonds,
        energy,
        energyRecoverAt,
        userLevel,
        questProgress,
        quests,
        questIdCounter,
        genLevels,
        shopItems,
        shopNextRefresh: shopNextRefresh - Date.now(),
        discoveredItems: [...discoveredItems],
        currentSpecialIndex,
        dailyMissions: { ...dailyMissions },
        energyPurchaseCount,
        energyPurchaseResetTime: energyPurchaseResetTime - Date.now(),
        tutorialStep,
        firstEnergyRewardGiven,
        cards,
        album: [...album],
        albumResetTime: albumResetTime - Date.now(),
        lastDailyBonusDate,
        loginStreak,
        currentRaceId,
        myRaceCode,
        raceWins,
        raceLosses,
        recentRaceOpponents,
        // 주사위 여행
        diceTripPosition,
        diceCount,
        visitedSteps: [...visitedSteps],
        // 사운드 설정
        soundEnabled,
        musicEnabled,
        // 스토리 갤러리
        storyProgress: {
            unlockedImages: [...storyProgress.unlockedImages],
            activeQuestId: storyProgress.activeQuestId,
            bosses: storyProgress.bosses.map(b => ({ ...b })),
            pendingBoss: storyProgress.pendingBoss,
        },
        savedAt: Date.now(),
    };
}

function applyGameData(d) {
    // 배열 데이터 검증 후 적용 (손상된 경우 기존 값 유지)
    if (d.boardState && Array.isArray(d.boardState) && d.boardState.length === BOARD_SIZE) {
        boardState = d.boardState;
    } else if (d.boardState) {
        console.warn('[applyGameData] boardState 손상 감지, 기존 값 유지');
    }
    if (d.storageState && Array.isArray(d.storageState) && d.storageState.length === STORAGE_SIZE) {
        storageState = d.storageState;
    } else if (d.storageState) {
        console.warn('[applyGameData] storageState 손상 감지, 기존 값 유지');
    }
    coins = d.coins ?? 0;
    cumulativeCoins = d.cumulativeCoins ?? 0;
    totalQuestsCompleted = d.totalQuestsCompleted ?? 0;
    diamonds = d.diamonds ?? 0;

    energy = d.energy ?? MAX_ENERGY;
    // 마이그레이션: recoveryCountdown → energyRecoverAt
    if (d.energyRecoverAt) {
        energyRecoverAt = d.energyRecoverAt;
    } else {
        // 구버전: savedAt + 남은 카운트다운으로 절대 시간 복원
        const cd = d.recoveryCountdown ?? RECOVERY_SEC;
        energyRecoverAt = (d.savedAt || Date.now()) + cd * 1000;
    }
    userLevel = d.userLevel ?? 1;
    questProgress = d.questProgress ?? 0;
    const specialNpcImgs = ['images/birds/bird1.png', 'images/fish/fish1.png', 'images/reptiles/reptile1.png'];
    quests = (d.quests || []).map((q) => ({
        ...q,
        npc: q.npc && q.npc.startsWith('images/') ? q.npc
            : q.isSpecial ? specialNpcImgs[q.specialIndex ?? 0]
            : NPC_AVATARS[Math.floor(Math.random() * NPC_AVATARS.length)],
        expiresAt: q.isSpecial ? null : (q.expiresAt || Date.now() + 10 * 60 * 1000),
    }));
    // 스토리 퀘스트 요구조건을 최신 이미지 데이터로 갱신
    quests.forEach((q) => {
        if (q.isStory && q.storyImageId !== undefined) {
            const img = STORY_IMAGES.find(si => si.id === q.storyImageId);
            if (img) q.reqs = img.reqs.map(r => ({ ...r }));
        }
    });
    questIdCounter = d.questIdCounter ?? 0;
    const gl = d.genLevels || {};
    genLevels = { cat: gl.cat || 1, dog: gl.dog || 1, bird: gl.bird || 1, fish: gl.fish || 1, reptile: gl.reptile || 1 };
    shopItems = d.shopItems || shopItems;
    const savedShopRemaining = d.shopNextRefresh ?? SHOP_REFRESH_MS;
    shopNextRefresh = Date.now() + savedShopRemaining;
    if (savedShopRemaining <= 0) refreshShop();
    discoveredItems = new Set(d.discoveredItems || []);
    // 스페셜 퀘스트 순환 인덱스 (마이그레이션)
    if (d.currentSpecialIndex !== undefined) {
        currentSpecialIndex = d.currentSpecialIndex;
    } else if (d.specialMissionCycles) {
        const total = d.specialMissionCycles.reduce((a, b) => a + b, 0);
        currentSpecialIndex = total % 3;
    } else {
        currentSpecialIndex = 0;
    }
    // 현재 퀘스트와 무관한 스페셜 타입 정리 (항상 실행)
    const spTypes = ['bird', 'fish', 'reptile'];
    const activeType = spTypes[currentSpecialIndex];
    for (const rType of spTypes) {
        if (rType === activeType) continue;
        for (let i = 0; i < BOARD_SIZE; i++) {
            if (boardState[i] && (boardState[i].type === rType || boardState[i].type === `${rType}_generator`))
                boardState[i] = null;
        }
        for (let i = 0; i < STORAGE_SIZE; i++) {
            if (storageState[i] && (storageState[i].type === rType || storageState[i].type === `${rType}_generator`))
                storageState[i] = null;
        }
        for (let i = 0; i < SHOP_SIZE; i++) {
            if (shopItems[i] && shopItems[i].type && shopItems[i].type.includes(rType))
                shopItems[i] = generateRandomShopItem(getActiveTypes());
        }
    }
    // 스페셜 퀘스트 없으면 추가 (10개 상한 준수)
    if (!quests.some((q) => q.isSpecial) && quests.length < 10) {
        const sp = generateSpecialQuest();
        if (sp) quests.push(sp);
    }
    // 일일 미션 로드 (마이그레이션 포함)
    if (d.dailyMissions) {
        dailyMissions = {
            tier: d.dailyMissions.tier ?? 0,
            merge: d.dailyMissions.merge ?? 0,
            spawn: d.dailyMissions.spawn ?? 0,
            coins: d.dailyMissions.coins ?? 0,
            claimed: d.dailyMissions.claimed || [false, false, false],
            bonusClaimed: d.dailyMissions.bonusClaimed ?? false,
            lastResetDate: d.dailyMissions.lastResetDate || '',
        };
        // v4.19.1 마이그레이션: tier 없는 구버전에서 이미 claimed 상태인 경우
        if (dailyMissions.tier < 3 && dailyMissions.claimed.every(c => c)) {
            if (dailyMissions.bonusClaimed) {
                dailyMissions.tier = 3;
            } else {
                dailyMissions.tier = Math.min(dailyMissions.tier + 1, 3);
                if (dailyMissions.tier < 3) {
                    dailyMissions.merge = 0;
                    dailyMissions.spawn = 0;
                    dailyMissions.coins = 0;
                    dailyMissions.claimed = [false, false, false];
                }
            }
        }
    } else {
        // 기존 데이터 마이그레이션: pmProgress, cumulativeCoins 무시하고 새로 시작
        dailyMissions = {
            tier: 0,
            merge: 0,
            spawn: 0,
            coins: 0,
            claimed: [false, false, false],
            bonusClaimed: false,
            lastResetDate: '',
        };
    }
    energyPurchaseCount = d.energyPurchaseCount ?? 0;
    // 에너지 구매 가격 리셋: 항상 다음 KST 자정 기준
    energyPurchaseResetTime = Date.now() + getMsUntilKSTMidnight();
    // 저장→로드 사이 자정이 지났으면 구매 횟수 초기화
    const savedEnergyResetMs = d.energyPurchaseResetTime ?? 0;
    if (d.savedAt && d.savedAt + savedEnergyResetMs <= Date.now()) {
        energyPurchaseCount = 0;
    }
    // 튜토리얼 마이그레이션 (isTutorialActive → tutorialStep)
    if (d.tutorialStep !== undefined) {
        tutorialStep = d.tutorialStep;
    } else if (d.isTutorialActive === false) {
        tutorialStep = 0; // 기존 유저: 튜토리얼 완료
    } else {
        tutorialStep = 1; // 새 유저: 튜토리얼 시작
    }
    firstEnergyRewardGiven = d.firstEnergyRewardGiven ?? false;
    cards = d.cards ?? 0;
    album = d.album || [];
    albumResetTime = Date.now() + (d.albumResetTime ?? ALBUM_CYCLE_MS);
    lastDailyBonusDate = d.lastDailyBonusDate || '';
    loginStreak = d.loginStreak ?? 0;
    currentRaceId = d.currentRaceId || null;
    myRaceCode = d.myRaceCode || null;
    raceWins = d.raceWins ?? 0;
    raceLosses = d.raceLosses ?? 0;
    recentRaceOpponents = d.recentRaceOpponents || [];

    // 주사위 여행
    diceTripPosition = d.diceTripPosition ?? 0;
    diceCount = d.diceCount ?? 0;
    visitedSteps = d.visitedSteps && Array.isArray(d.visitedSteps) ? d.visitedSteps : [0];

    // 사운드 설정 로드
    if (d.soundEnabled !== undefined) soundEnabled = d.soundEnabled;
    if (d.musicEnabled !== undefined) musicEnabled = d.musicEnabled;
    updateSoundUI();
    if (!musicEnabled) stopBGM();

    // 스토리 갤러리 로드
    if (d.storyProgress && d.storyProgress.unlockedImages) {
        const sp = d.storyProgress;
        storyProgress = {
            unlockedImages: sp.unlockedImages || [],
            activeQuestId: sp.activeQuestId ?? null,
            bosses: (sp.bosses || []).map(b => ({ ...b })),
            pendingBoss: sp.pendingBoss ?? null,
        };
        // 보드에 보스 아이템 복원 확인
        for (const boss of storyProgress.bosses) {
            if (boss.boardIdx >= 0 && boss.hp > 0) {
                if (!boardState[boss.boardIdx] || boardState[boss.boardIdx].type !== 'boss') {
                    boardState[boss.boardIdx] = { type: 'boss', bossId: boss.bossId };
                }
            }
        }
    } else {
        // 구버전 또는 데이터 없음 → 빈 초기값
        storyProgress = { unlockedImages: [], activeQuestId: null, bosses: [], pendingBoss: null };
        // 구버전 스토리 퀘스트 제거
        quests = quests.filter(q => !q.isStory);
    }

    // 전설 퀘스트 아이템 정리 (v4.17.0 삭제 마이그레이션)
    for (let i = 0; i < BOARD_SIZE; i++) {
        if (boardState[i] && (boardState[i].type === 'legendary' || boardState[i].type === 'legendary_generator')) {
            boardState[i] = null;
        }
    }
    for (let i = 0; i < STORAGE_SIZE; i++) {
        if (storageState[i] && storageState[i].type === 'legendary') {
            storageState[i] = null;
        }
    }
    // 완주 상태 복구 (전설 퀘스트 없이 완주 위치에 있는 경우 리셋)
    if (diceTripPosition >= DICE_TRIP_SIZE - 1) {
        diceTripPosition = 0;
        visitedSteps = [0];
        diceCount = 0;
    }

    // 앨범 주기 초기화 (21일)
    if (Date.now() >= albumResetTime) {
        console.log('[Album] 주기 초기화!');
        cards = 0;
        album = [];
        albumResetTime = Date.now() + ALBUM_CYCLE_MS;
    }

    // 7행 미션 복구 (v4.1.6 마이그레이션)
    migrateRow7Missions();
    // 장난감 생성기 마이그레이션 (v4.2.6)
    if (userLevel >= 5 && !boardState.some((x) => x && x.type === 'toy_generator')) {
        const e = boardState.findIndex((x) => x === null);
        if (e !== -1) boardState[e] = { type: 'toy_generator', clicks: 0, cooldown: 0 };
    }
}

// --- 7행 미션 마이그레이션 ---
function migrateRow7Missions() {
    // null = 미션 완료 후 해제된 칸 → 건드리지 않음
    // 다른 아이템이 있을 때만 미션으로 교체 (구버전 마이그레이션)
    if (genLevels.cat < 2 && boardState[30] !== null && boardState[30]?.type !== 'upgrade_mission') {
        boardState[30] = { type: 'upgrade_mission', target: 'cat', reqLevel: 2 };
    }
    if (genLevels.dog < 2 && boardState[31] !== null && boardState[31]?.type !== 'upgrade_mission') {
        boardState[31] = { type: 'upgrade_mission', target: 'dog', reqLevel: 2 };
    }
    // discoveredItems에 Lv.11 기록 있으면 이미 완료 → 미션 생성 안 함
    if (!discoveredItems.has('cat_11')) {
        if (boardState[32] !== null && boardState[32]?.type !== 'animal_mission') {
            const hasCatMax =
                boardState.some((b) => b && b.type === 'cat' && b.level >= 11) ||
                storageState.some((s) => s && s.type === 'cat' && s.level >= 11);
            if (!hasCatMax) {
                boardState[32] = { type: 'animal_mission', target: 'cat', reqLevel: 11 };
            }
        }
    } else if (boardState[32]?.type === 'animal_mission') {
        boardState[32] = null;
    }
    if (!discoveredItems.has('dog_11')) {
        if (boardState[33] !== null && boardState[33]?.type !== 'animal_mission') {
            const hasDogMax =
                boardState.some((b) => b && b.type === 'dog' && b.level >= 11) ||
                storageState.some((s) => s && s.type === 'dog' && s.level >= 11);
            if (!hasDogMax) {
                boardState[33] = { type: 'animal_mission', target: 'dog', reqLevel: 11 };
            }
        }
    } else if (boardState[33]?.type === 'animal_mission') {
        boardState[33] = null;
    }
    if (totalQuestsCompleted < QUEST_COUNT_MISSION_GOAL && boardState[34] !== null && boardState[34]?.type !== 'quest_count_mission') {
        boardState[34] = { type: 'quest_count_mission', reqCount: QUEST_COUNT_MISSION_GOAL };
    }
}

// --- 저장 ---
function saveGame() {
    const data = getGameData();
    localStorage.setItem('mergeGame', JSON.stringify(data));
    lastSavedAt = Date.now();  // 포그라운드 복귀 시 회복 계산용

    if (currentUser) {
        pendingCloudData = data;
        clearTimeout(cloudSaveTimeout);
        cloudSaveTimeout = setTimeout(() => {
            if (pendingCloudData) {
                saveToCloud(pendingCloudData);
                pendingCloudData = null;
            }
        }, CLOUD_SAVE_DEBOUNCE_MS);
    }
}

async function saveGameNow() {
    const data = getGameData();
    localStorage.setItem('mergeGame', JSON.stringify(data));
    lastSavedAt = Date.now();  // 포그라운드 복귀 시 회복 계산용
    if (currentUser) {
        clearTimeout(cloudSaveTimeout);
        pendingCloudData = null;
        await saveToCloud(data);
    }
}

function updateSaveStatus(status) {
    const el = document.getElementById('save-status');
    if (!el) return;
    el.classList.remove('hidden');
    if (status === 'saving') {
        el.innerHTML = `${ICON.save}${ICON.timer}`;
        el.className = 'text-[10px] text-yellow-500';
    } else if (status === 'saved') {
        el.innerHTML = `${ICON.save}${ICON.check}`;
        el.className = 'text-[10px] text-green-500';
        setTimeout(() => {
            el.className = 'text-[10px] text-gray-400';
        }, 2000);
    } else if (status === 'error') {
        el.innerHTML = `${ICON.save}✗`;
        el.className = 'text-[10px] text-red-500';
    } else if (status === 'offline') {
        el.innerText = '📴';
        el.className = 'text-[10px] text-red-500';
    }
}

function sanitizeForFirestore(data) {
    if (Array.isArray(data)) {
        return data.map((item) => (item === undefined ? null : sanitizeForFirestore(item)));
    } else if (data && typeof data === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = value === undefined ? null : sanitizeForFirestore(value);
        }
        return result;
    }
    // NaN → 0 (Firestore rules에서 NaN >= 0 = false → 저장 실패 방지)
    if (typeof data === 'number' && isNaN(data)) return 0;
    return data;
}

// --- 저장 전 범위 클램핑 (Firestore rules 거부 방지) ---
function clampSaveData(data) {
    // 숫자 범위 클램핑
    const numClamps = [
        ['coins', 0, 9999999],
        ['diamonds', 0, 99999],
        ['energy', 0, 999],
        ['userLevel', 1, 999],
        ['cumulativeCoins', 0, 9999999],
        ['questProgress', 0, 100],
        ['cards', 0, 9999],
        ['diceTripPosition', 0, 50],
        ['diceCount', 0, 999],
        ['tutorialStep', 0, 4],
    ];
    for (const [key, min, max] of numClamps) {
        if (data[key] !== undefined) {
            const v = data[key];
            if (typeof v !== 'number' || isNaN(v)) {
                console.warn(`[clampSaveData] ${key} = ${v} (NaN/비숫자) → ${min}`);
                data[key] = min;
            } else if (v < min || v > max) {
                console.warn(`[clampSaveData] ${key} = ${v} (범위 초과 ${min}~${max})`);
                data[key] = Math.max(min, Math.min(max, v));
            }
        }
    }
    // 배열 크기 클램핑 (Firestore rules 제한)
    const arrClamps = [
        ['boardState', 35],
        ['storageState', STORAGE_SIZE],
        ['quests', 10],
        ['shopItems', 10],
        ['discoveredItems', 100],
        ['album', 100],
        ['visitedSteps', 50],
    ];
    for (const [key, max] of arrClamps) {
        if (Array.isArray(data[key]) && data[key].length > max) {
            console.warn(`[clampSaveData] ${key}.length = ${data[key].length} → ${max}로 잘림`);
            data[key] = data[key].slice(0, max);
        }
    }
    // storyProgress 하위 배열 클램핑
    if (data.storyProgress && typeof data.storyProgress === 'object') {
        const sp = data.storyProgress;
        if (Array.isArray(sp.unlockedImages) && sp.unlockedImages.length > 30) {
            console.warn(`[clampSaveData] storyProgress.unlockedImages.length = ${sp.unlockedImages.length} → 30`);
            sp.unlockedImages = sp.unlockedImages.slice(0, 30);
        }
        if (Array.isArray(sp.bosses) && sp.bosses.length > 10) {
            console.warn(`[clampSaveData] storyProgress.bosses.length = ${sp.bosses.length} → 10`);
            sp.bosses = sp.bosses.slice(0, 10);
        }
    }
    return data;
}

function isValidSaveData(data) {
    if (!data.boardState || !Array.isArray(data.boardState)) return false;
    if (data.boardState.length !== BOARD_SIZE) return false;
    const hasGenerator = data.boardState.some((x) => x && x.type && x.type.includes('generator'));
    if (!hasGenerator) {
        console.warn('[saveToCloud] 생성기 없음 - 저장 차단');
        return false;
    }
    return true;
}

// --- Firestore rules 미러 진단 (save 실패 시 원인 특정) ---
function diagnoseSaveData(data) {
    const checks = [
        ['hasAll keys', ['coins','diamonds','energy','userLevel','savedAt'].every(k => k in data)],
        ['coins (num 0~9999999)', typeof data.coins === 'number' && data.coins >= 0 && data.coins <= 9999999],
        ['diamonds (num 0~99999)', typeof data.diamonds === 'number' && data.diamonds >= 0 && data.diamonds <= 99999],
        ['energy (num 0~999)', typeof data.energy === 'number' && data.energy >= 0 && data.energy <= 999],
        ['userLevel (num 1~999)', typeof data.userLevel === 'number' && data.userLevel >= 1 && data.userLevel <= 999],
        ['cumulativeCoins (num)', typeof data.cumulativeCoins === 'number' && data.cumulativeCoins >= 0 && data.cumulativeCoins <= 9999999],
        ['questProgress (num 0~100)', typeof data.questProgress === 'number' && data.questProgress >= 0 && data.questProgress <= 100],
        ['boardState (arr ≤35)', Array.isArray(data.boardState) && data.boardState.length <= 35],
        ['storageState (arr ≤10)', Array.isArray(data.storageState) && data.storageState.length <= 10],
        ['quests (arr ≤10)', Array.isArray(data.quests) && data.quests.length <= 10],
        ['shopItems (arr ≤10)', Array.isArray(data.shopItems) && data.shopItems.length <= 10],
        ['discoveredItems (arr ≤100)', Array.isArray(data.discoveredItems) && data.discoveredItems.length <= 100],
        ['cards (num 0~9999)', typeof data.cards === 'number' && data.cards >= 0 && data.cards <= 9999],
        ['album (arr ≤100)', Array.isArray(data.album) && data.album.length <= 100],
        ['diceTripPosition (num 0~50)', typeof data.diceTripPosition === 'number' && data.diceTripPosition >= 0 && data.diceTripPosition <= 50],
        ['diceCount (num 0~999)', typeof data.diceCount === 'number' && data.diceCount >= 0 && data.diceCount <= 999],
        ['visitedSteps (arr ≤50)', Array.isArray(data.visitedSteps) && data.visitedSteps.length <= 50],
        ['currentSpecialIndex', !('currentSpecialIndex' in data) || (typeof data.currentSpecialIndex === 'number' && data.currentSpecialIndex >= 0 && data.currentSpecialIndex <= 2)],
        ['tutorialStep (num 0~4)', typeof data.tutorialStep === 'number' && data.tutorialStep >= 0 && data.tutorialStep <= 4],
        ['soundEnabled (bool?)', !('soundEnabled' in data) || typeof data.soundEnabled === 'boolean'],
        ['musicEnabled (bool?)', !('musicEnabled' in data) || typeof data.musicEnabled === 'boolean'],
        ['storyProgress (map?)', !('storyProgress' in data) || (typeof data.storyProgress === 'object' && data.storyProgress !== null && !Array.isArray(data.storyProgress))],
        ['savedAt (≤ now+60s)', typeof data.savedAt === 'number' && data.savedAt <= Date.now() + 120000],
    ];
    const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
    if (failures.length > 0) {
        console.error('[diagnoseSaveData] 실패 항목:', failures);
        for (const f of failures) {
            const key = f.split(' ')[0];
            if (key in data) console.error(`  ${key}:`, typeof data[key], Array.isArray(data[key]) ? `len=${data[key].length}` : data[key]);
        }
    }
    return failures;
}

async function saveToCloud(data) {
    if (!currentUser) return;
    if (!navigator.onLine) {
        updateSaveStatus('offline');
        return;
    }
    if (!isValidSaveData(data)) {
        console.error('[saveToCloud] 무효한 데이터 - 저장 차단됨', data);
        updateSaveStatus('error');
        return;
    }
    if (cloudSavePromise) {
        await cloudSavePromise;
    }
    clampSaveData(data);
    const sanitizedData = sanitizeForFirestore(data);
    updateSaveStatus('saving');
    cloudSavePromise = (async () => {
        try {
            await db.collection('saves').doc(currentUser.uid).set(sanitizedData);
            updateSaveStatus('saved');
        } catch (e) {
            console.error('Cloud save failed:', e);
            diagnoseSaveData(sanitizedData);
            try {
                await db.collection('saves').doc(currentUser.uid).set(sanitizedData);
                updateSaveStatus('saved');
            } catch (e2) {
                console.error('Cloud save retry failed:', e2);
                updateSaveStatus('error');
                showToast('클라우드 저장 실패');
            }
        } finally {
            cloudSavePromise = null;
        }
    })();
    return cloudSavePromise;
}

// --- 로드 ---
async function loadFromCloud() {
    console.log('[Cloud] Loading from cloud...');
    if (!currentUser) return { success: false, reason: 'no_user' };
    try {
        const doc = await db.collection('saves').doc(currentUser.uid).get();
        if (doc.exists) {
            console.log('[Cloud] Data found, applying...');
            const cloudData = doc.data();
            const validatedData = validateGameData(cloudData);
            applyGameData(validatedData);
            localStorage.setItem('mergeGame', JSON.stringify(validatedData));
            updateAll();
            return { success: true, reason: 'loaded' };
        }
        console.log('[Cloud] No data found');
        return { success: false, reason: 'no_data' };
    } catch (e) {
        console.error('[Cloud] Load failed:', e);
        return { success: false, reason: 'error', error: e };
    }
}

// --- 데이터 검증 ---
function validateGameData(data) {
    const errors = [];

    const numChecks = [
        ['coins', 0, 9999999],
        ['diamonds', 0, 99999],
        ['energy', 0, 999],  // 주사위 보상으로 100 초과 가능
        ['userLevel', 1, 999],
        ['cumulativeCoins', 0, 9999999],
        ['questProgress', 0, 100],
        ['cards', 0, 9999],
        ['raceWins', 0, 9999],
        ['raceLosses', 0, 9999],
        ['loginStreak', 0, 6],
        ['diceTripPosition', 0, DICE_TRIP_SIZE],
        ['diceCount', 0, 999],
        ['tutorialStep', 0, 4],
        ['currentSpecialIndex', 0, 2],
    ];

    for (const [key, min, max] of numChecks) {
        if (data[key] !== undefined) {
            if (typeof data[key] !== 'number' || data[key] < min || data[key] > max) {
                errors.push(`${key}: 범위 초과 (${data[key]})`);
                data[key] = Math.max(min, Math.min(max, Number(data[key]) || min));
            }
        }
    }

    const arrChecks = [
        ['boardState', BOARD_SIZE],
        ['storageState', STORAGE_SIZE],
        ['quests', 10],
        ['shopItems', SHOP_SIZE],
        ['album', 100], // 사진 81개 + 테마 완성 마커 9개 + 여유
    ];

    for (const [key, maxLen] of arrChecks) {
        if (!data[key] || !Array.isArray(data[key])) {
            errors.push(`${key}: 배열 없음/오류 - 기본값 사용`);
            data[key] = null;
            continue;
        }
        if (data[key].length > maxLen) {
            errors.push(`${key}: 길이 초과`);
            data[key] = data[key].slice(0, maxLen);
        }
        if ((key === 'boardState' || key === 'storageState') && data[key].length < maxLen) {
            errors.push(`${key}: 길이 부족 (${data[key].length}/${maxLen}) - null 패딩`);
            while (data[key].length < maxLen) data[key].push(null);
        }
        if (key !== 'quests' && key !== 'shopItems' && key !== 'storageState' && key !== 'album' && data[key].every((x) => x === null || x === undefined)) {
            errors.push(`${key}: 모든 요소가 null - 데이터 손상 의심`);
        }
    }

    // 스토리 갤러리 검증
    if (data.storyProgress) {
        const sp = data.storyProgress;
        if (sp.unlockedImages && Array.isArray(sp.unlockedImages) && sp.unlockedImages.length > 30) {
            errors.push('storyProgress.unlockedImages: 길이 초과');
            sp.unlockedImages = sp.unlockedImages.slice(0, 30);
        }
        if (sp.bosses && Array.isArray(sp.bosses) && sp.bosses.length > 10) {
            errors.push('storyProgress.bosses: 길이 초과');
            sp.bosses = sp.bosses.slice(0, 10);
        }
    }

    if (data.savedAt && data.savedAt > Date.now() + 60000) {
        errors.push('savedAt: 미래 시간');
        data.savedAt = Date.now();
    }

    if (errors.length > 0) {
        console.warn('데이터 검증 경고:', errors);
    }

    return data;
}

// --- 새 게임 초기화 ---
function initNewGame() {
    console.log('[Game] Initializing new game...');

    boardState = new Array(BOARD_SIZE).fill(null);
    storageState = new Array(STORAGE_SIZE).fill(null);
    for (let i = 0; i < STORAGE_SIZE; i++) storageState[i] = { type: 'locked_storage', cost: (i + 1) * 5 };

    coins = 0;
    cumulativeCoins = 0;
    diamonds = 0;
    energy = MAX_ENERGY;
    userLevel = 1;
    questProgress = 0;
    quests = [];
    genLevels = { cat: 1, dog: 1, bird: 1, fish: 1, reptile: 1 };
    discoveredItems = new Set();
    currentSpecialIndex = 0;
    dailyMissions = {
        tier: 0,
        merge: 0,
        spawn: 0,
        coins: 0,
        claimed: [false, false, false],
        bonusClaimed: false,
        lastResetDate: '',
    };
    cards = 0;
    album = [];
    albumResetTime = Date.now() + ALBUM_CYCLE_MS;
    lastDailyBonusDate = '';
    loginStreak = 0;
    currentRaceId = null;
    myRaceCode = null;
    raceWins = 0;
    raceLosses = 0;
    recentRaceOpponents = [];

    // 주사위 여행 초기화
    diceTripPosition = 0;
    diceCount = 0;
    visitedSteps = [0];

    // 스토리 갤러리 초기화
    storyProgress = { unlockedImages: [], activeQuestId: null, bosses: [], pendingBoss: null };

    boardState[0] = { type: 'cat_generator' };
    boardState[4] = { type: 'dog_generator' };

    boardState[30] = { type: 'upgrade_mission', target: 'cat', reqLevel: 2 };
    boardState[31] = { type: 'upgrade_mission', target: 'dog', reqLevel: 2 };
    boardState[32] = { type: 'animal_mission', target: 'cat', reqLevel: 11 };
    boardState[33] = { type: 'animal_mission', target: 'dog', reqLevel: 11 };
    boardState[34] = { type: 'quest_count_mission', reqCount: QUEST_COUNT_MISSION_GOAL };

    refreshShop();

    // 첫 퀘스트: 튜토리얼용 Lv.2 cat 고정
    quests.push({
        id: questIdCounter++,
        npc: NPC_AVATARS[0],
        reqs: [{ type: 'cat', level: 2 }],
        reward: 20,
        cardReward: 0,
        expiresAt: Date.now() + 60 * 60 * 1000, // 1시간
    });
    for (let i = 1; i < 6; i++) {
        generateNewQuest();
    }

    renderGrid('board', boardState, boardEl);
    renderGrid('storage', storageState, storageEl);
    renderShop();
    updateUI();
    updateTimerUI();
    updateQuestUI();
    updateDailyMissionUI();
    updateDiceTripUI();
}
