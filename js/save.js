// ============================================
// save.js - 저장/로드/검증/마이그레이션
// ============================================

// --- 게임 데이터 직렬화 ---
function getGameData() {
    return {
        boardState,
        storageState,
        apartmentState,
        coins,
        cumulativeCoins,
        nextSpecialTarget,
        currentSetRescues,
        totalQuestsCompleted,
        diamonds,
        energy,
        recoveryCountdown,
        userLevel,
        questProgress,
        quests,
        questIdCounter,
        genLevels,
        shopItems,
        shopNextRefresh: shopNextRefresh - Date.now(),
        discoveredItems: [...discoveredItems],
        specialMissionCycles,
        pmType,
        pmProgress,
        energyPurchaseCount,
        energyPurchaseResetTime: energyPurchaseResetTime - Date.now(),
        isTutorialActive,
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
    if (d.apartmentState && Array.isArray(d.apartmentState) && d.apartmentState.length === APARTMENT_ROOMS) {
        apartmentState = d.apartmentState;
    } else if (d.apartmentState) {
        console.warn('[applyGameData] apartmentState 손상 감지, 기존 값 유지');
    }
    coins = d.coins ?? 0;
    cumulativeCoins = d.cumulativeCoins ?? 0;
    nextSpecialTarget = d.nextSpecialTarget ?? SPECIAL_QUEST_STEP;
    currentSetRescues = d.currentSetRescues ?? 0;
    totalQuestsCompleted = d.totalQuestsCompleted ?? 0;
    diamonds = d.diamonds ?? 0;

    // 오프라인 에너지 회복 (v4.3.0)
    energy = d.energy ?? MAX_ENERGY;
    recoveryCountdown = d.recoveryCountdown ?? RECOVERY_SEC;
    if (d.savedAt && energy < MAX_ENERGY) {
        const elapsed = Date.now() - d.savedAt;
        const recoveryMs = RECOVERY_SEC * 1000;
        const fullRecoveries = Math.floor(elapsed / recoveryMs);
        const remainingMs = elapsed % recoveryMs;

        if (fullRecoveries > 0) {
            energy = Math.min(MAX_ENERGY, energy + fullRecoveries);
            recoveryCountdown = Math.max(0, RECOVERY_SEC - Math.floor(remainingMs / 1000));
            console.log(`[Energy] 오프라인 회복: +${fullRecoveries} (현재: ${energy})`);
        }
    }
    userLevel = d.userLevel ?? 1;
    questProgress = d.questProgress ?? 0;
    quests = (d.quests || []).map((q) => ({ ...q, expiresAt: q.expiresAt || Date.now() + 10 * 60 * 1000 }));
    questIdCounter = d.questIdCounter ?? 0;
    genLevels = d.genLevels || { cat: 1, dog: 1 };
    shopItems = d.shopItems || shopItems;
    shopNextRefresh = Date.now() + (d.shopNextRefresh ?? SHOP_REFRESH_MS);
    discoveredItems = new Set(d.discoveredItems || []);
    specialMissionCycles = d.specialMissionCycles || [0, 0, 0];
    pmType = d.pmType ?? 0;
    pmProgress = d.pmProgress ?? 0;
    energyPurchaseCount = d.energyPurchaseCount ?? 0;
    energyPurchaseResetTime = Date.now() + (d.energyPurchaseResetTime ?? 3 * 60 * 60 * 1000);
    isTutorialActive = d.isTutorialActive ?? true;
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

    // 앨범 주기 초기화 (14일)
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
    if (genLevels.cat < 2 && (!boardState[30] || boardState[30].type !== 'upgrade_mission')) {
        boardState[30] = { type: 'upgrade_mission', target: 'cat', reqLevel: 2 };
    }
    if (genLevels.dog < 2 && (!boardState[31] || boardState[31].type !== 'upgrade_mission')) {
        boardState[31] = { type: 'upgrade_mission', target: 'dog', reqLevel: 2 };
    }
    const hasCatMax =
        boardState.some((b) => b && b.type === 'cat' && b.level >= 11) ||
        storageState.some((s) => s && s.type === 'cat' && s.level >= 11);
    if (!hasCatMax && (!boardState[32] || boardState[32].type !== 'animal_mission')) {
        boardState[32] = { type: 'animal_mission', target: 'cat', reqLevel: 11 };
    }
    const hasDogMax =
        boardState.some((b) => b && b.type === 'dog' && b.level >= 11) ||
        storageState.some((s) => s && s.type === 'dog' && s.level >= 11);
    if (!hasDogMax && (!boardState[33] || boardState[33].type !== 'animal_mission')) {
        boardState[33] = { type: 'animal_mission', target: 'dog', reqLevel: 11 };
    }
    if (totalQuestsCompleted < 100 && (!boardState[34] || boardState[34].type !== 'quest_count_mission')) {
        boardState[34] = { type: 'quest_count_mission', reqCount: 100 };
    }
}

// --- 저장 ---
function saveGame() {
    const data = getGameData();
    localStorage.setItem('mergeGame', JSON.stringify(data));

    if (currentUser) {
        pendingCloudData = data;
        clearTimeout(cloudSaveTimeout);
        cloudSaveTimeout = setTimeout(() => {
            if (pendingCloudData) {
                saveToCloud(pendingCloudData);
                pendingCloudData = null;
            }
        }, 500);
    }
}

async function saveGameNow() {
    const data = getGameData();
    localStorage.setItem('mergeGame', JSON.stringify(data));
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
        el.innerText = '💾⏳';
        el.className = 'text-[10px] text-yellow-500';
    } else if (status === 'saved') {
        el.innerText = '💾✓';
        el.className = 'text-[10px] text-green-500';
        setTimeout(() => {
            el.className = 'text-[10px] text-gray-400';
        }, 2000);
    } else if (status === 'error') {
        el.innerText = '💾✗';
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
    const sanitizedData = sanitizeForFirestore(data);
    updateSaveStatus('saving');
    cloudSavePromise = (async () => {
        try {
            await db.collection('saves').doc(currentUser.uid).set(sanitizedData);
            updateSaveStatus('saved');
        } catch (e) {
            console.error('Cloud save failed:', e);
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
        ['energy', 0, MAX_ENERGY],
        ['userLevel', 1, 999],
        ['cumulativeCoins', 0, 9999999],
        ['currentSetRescues', 0, 3],
        ['questProgress', 0, 100],
        ['pmProgress', 0, 200],
        ['cards', 0, 9999],
        ['raceWins', 0, 9999],
        ['raceLosses', 0, 9999],
        ['loginStreak', 0, 6],
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
        ['apartmentState', APARTMENT_ROOMS],
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
        if ((key === 'boardState' || key === 'storageState' || key === 'apartmentState') && data[key].length < maxLen) {
            errors.push(`${key}: 길이 부족 (${data[key].length}/${maxLen}) - null 패딩`);
            while (data[key].length < maxLen) data[key].push(null);
        }
        if (key !== 'quests' && key !== 'shopItems' && data[key].every((x) => x === null || x === undefined)) {
            errors.push(`${key}: 모든 요소가 null - 데이터 손상 의심`);
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
    genLevels = { cat: 1, dog: 1 };
    discoveredItems = new Set();
    specialMissionCycles = [0, 0, 0];
    pmType = 0;
    pmProgress = 0;
    currentSetRescues = 0;
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

    boardState[0] = { type: 'cat_generator' };
    boardState[4] = { type: 'dog_generator' };

    boardState[30] = { type: 'upgrade_mission', target: 'cat', reqLevel: 2 };
    boardState[31] = { type: 'upgrade_mission', target: 'dog', reqLevel: 2 };
    boardState[32] = { type: 'animal_mission', target: 'cat', reqLevel: 11 };
    boardState[33] = { type: 'animal_mission', target: 'dog', reqLevel: 11 };
    boardState[34] = { type: 'quest_count_mission', reqCount: 100 };

    initApartment();
    refreshShop();

    for (let i = 0; i < 6; i++) {
        generateNewQuest();
    }

    renderGrid('board', boardState, boardEl);
    renderGrid('storage', storageState, storageEl);
    renderShop();
    renderApartment();
    updateUI();
    updateTimerUI();
    updateQuestUI();
    updateSpecialQuestUI();
    updateRescueQuestUI();
    updateSpecialMissionUI();
    updatePmUI();
}
