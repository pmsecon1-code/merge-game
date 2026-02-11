// ============================================
// main.js - 초기화, 타이머, 이벤트, auth 콜백
// ============================================

// --- 초기화 함수 (UI 셋업) ---
function init() {
    boardEl = document.getElementById('game-board');
    storageEl = document.getElementById('storage-area');
    shopGrid = document.getElementById('shop-grid');
    coinEl = document.getElementById('coin-val');
    diamondEl = document.getElementById('diamond-val');
    energyEl = document.getElementById('energy-val');
    energyTimerEl = document.getElementById('energy-timer');
    levelEl = document.getElementById('level-val');
    questContainer = document.getElementById('quest-container');
    dailyMissionsContainer = document.getElementById('daily-missions-container');
    dailyResetTimer = document.getElementById('daily-reset-timer');
    shopTimerBadge = document.getElementById('shop-timer-badge');
    tutorialPointer = document.getElementById('tutorial-pointer');
    diceTripContainer = document.getElementById('dice-trip-wrapper');
    diceTripBoard = document.getElementById('dice-trip-board');

    createBoardCells();
    createStorageCells();
    createShopCells();

    startEnergyRecovery();
    startShopTimer();
    startCooldownTimer();
    startQuestTimer();
    startDailyMissionTimer();

    document.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);

    console.log('[Init] Game UI ready');
}

// --- 셀 생성 ---
function createBoardCells() {
    boardEl.innerHTML = '';
    for (let i = 0; i < BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.zone = 'board';
        cell.dataset.index = i;
        // onclick 제거 - handleDragEnd에서 클릭 처리
        boardEl.appendChild(cell);
    }
}

function createStorageCells() {
    storageEl.innerHTML = '';
    for (let i = 0; i < STORAGE_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.zone = 'storage';
        cell.dataset.index = i;
        // onclick 제거 - handleDragEnd에서 클릭 처리
        storageEl.appendChild(cell);
    }
}

function createShopCells() {
    shopGrid.innerHTML = '';
    for (let i = 0; i < SHOP_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'shop-cell';
        cell.dataset.index = i;
        shopGrid.appendChild(cell);
    }
}

// --- 타이머 ---
function startEnergyRecovery() {
    setInterval(() => {
        if (energy < MAX_ENERGY) {
            recoveryCountdown--;
            if (recoveryCountdown <= 0) {
                energy++;
                recoveryCountdown = RECOVERY_SEC;
                updateUI();
            }
            updateTimerUI();
        } else {
            recoveryCountdown = RECOVERY_SEC;
            updateTimerUI();
        }
    }, 1000);
}

function startCooldownTimer() {
    setInterval(() => {
        let needsUpdate = false;
        [...boardState, ...storageState].forEach((i) => {
            if (i && i.type.endsWith('_generator') && i.cooldown > 0 && i.cooldown <= Date.now()) {
                i.cooldown = 0;
                i.clicks = 0;
                needsUpdate = true;
            }
        });
        if (needsUpdate) {
            renderGrid('board', boardState, boardEl);
            renderGrid('storage', storageState, storageEl);
        }
        updateBottomBadges();
    }, 1000);
}

function startQuestTimer() {
    setInterval(() => {
        checkExpiredQuests();
        updateQuestUI();
        if (tutorialStep > 0) repositionTutorial();
    }, 1000);
}

function startDailyMissionTimer() {
    setInterval(() => {
        updateDailyMissionUI();
    }, 1000);
}

// --- redirect 결과 처리 ---
auth.getRedirectResult()
    .then((result) => {
        if (result.user) {
            console.log('[Auth] Redirect login success');
        }
    })
    .catch((e) => {
        console.error('[Auth] Redirect error:', e);
        document.getElementById('login-status').textContent = '로그인 실패. 다시 시도해주세요.';
        document.getElementById('google-login-btn').disabled = false;
    });

// --- 로그인 상태 변경 감지 ---
auth.onAuthStateChanged(async (user) => {
    console.log('[Auth] State changed:', user ? user.email : 'logged out');

    if (user) {
        try {
            currentUser = user;
            const name = user.displayName?.split(' ')[0] || '유저';
            document.getElementById('login-text').innerText = name.length > 3 ? name.substring(0, 3) : name;

            console.log('[Auth] Registering session...');
            await registerSession();
            console.log('[Auth] Session registered OK');

            startSessionListener();

            console.log('[Auth] Loading from cloud...');
            const loadResult = await loadFromCloud();
            console.log('[Auth] Cloud load result:', loadResult);

            if (loadResult.reason === 'error') {
                console.error('[Auth] Cloud load failed, trying localStorage fallback');
                const localData = localStorage.getItem('mergeGame');
                if (localData) {
                    try {
                        const parsed = JSON.parse(localData);
                        const validated = validateGameData(parsed);
                        applyGameData(validated);
                        showToast('⚠️ 오프라인 데이터 사용 중');
                    } catch (e) {
                        console.error('[Auth] LocalStorage parse failed:', e);
                        showToast('⚠️ 데이터 로드 실패. 새로고침 해주세요.');
                        return;
                    }
                } else {
                    showToast('⚠️ 데이터 로드 실패. 새로고침 해주세요.');
                    return;
                }
            } else if (loadResult.reason === 'no_data') {
                console.log('[Auth] No cloud data, initializing new game');
                initNewGame();
            }

            console.log('[Auth] Showing game screen...');
            showGameScreen();

            // 튜토리얼 진행 중이면 지연, 아니면 즉시 실행
            if (tutorialStep > 0) {
                setTimeout(() => startTutorial(), 300);
            } else {
                checkDailyBonus();
                initRace();
                showToast(`환영합니다, ${user.displayName}!`);
            }
        } catch (e) {
            console.error('[Auth] Login process error:', e);
            alert('로그인 처리 중 오류: ' + e.message);
        }
    } else {
        stopSessionListener();
        currentUser = null;
        currentSessionId = null;
        document.getElementById('login-text').innerText = '로그인';
        showLoginScreen();
    }
});

// --- 판매 확인 버튼 ---
document.getElementById('confirm-sell-btn').onclick = () => {
    if (sellTarget) {
        const p = sellTarget.item.level;
        coins += p;
        cumulativeCoins += p;
        addDailyProgress('coins', p);
        (sellTarget.zone === 'board' ? boardState : storageState)[sellTarget.index] = null;
        updateAll();
        showToast(`${p}코인 획득!`);
        closeOverlay('sell-popup');
        sellTarget = null;
    }
};

// --- 페이지 이벤트 ---
window.addEventListener('beforeunload', () => {
    const data = getGameData();
    localStorage.setItem('mergeGame', JSON.stringify(data));
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        saveGameNow();
    } else {
        // 포그라운드 복귀 시 오프라인 에너지 회복
        recoverOfflineEnergy();
        // 에너지 팝업 열려있으면 타이머 즉시 갱신
        if (document.getElementById('energy-popup').style.display === 'flex') {
            updateEnergyPopupTimer();
        }
    }
});

window.addEventListener('offline', () => {
    updateSaveStatus('offline');
    showToast('오프라인 상태입니다');
});

window.addEventListener('online', () => {
    showToast('온라인 복구! 저장 중...');
    saveGameNow();
});

// --- 리사이즈 시 튜토리얼 재배치 ---
window.addEventListener('resize', () => {
    syncSectionHeight();
    if (tutorialStep > 0) repositionTutorial();
});

// --- 게임 시작 ---
init();
