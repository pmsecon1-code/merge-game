// ============================================
// race.js - 레이스 시스템 (단순화 버전)
// ============================================

const RACE_GOAL = 10; // 퀘스트 10개 완료
const RACE_EXPIRE_MS = 60 * 60 * 1000; // 1시간 제한
const RACE_REWARDS = {
    win: { coins: 500, diamonds: 20 },
    lose: { coins: 100, diamonds: 0 },
    draw: { coins: 300, diamonds: 10 },
    timeout: { coins: 200, diamonds: 0 }, // 시간 초과 보상
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

// --- 내 영구 코드 생성/조회 ---
async function getOrCreateMyCode() {
    if (!currentUser) return null;
    if (myRaceCode) return myRaceCode;

    // 기존 코드 조회
    try {
        const existing = await db
            .collection('raceCodes')
            .where('ownerUid', '==', currentUser.uid)
            .limit(1)
            .get();

        if (!existing.empty) {
            myRaceCode = existing.docs[0].id;
            saveGame();
            return myRaceCode;
        }
    } catch (e) {
        console.error('[Race] Failed to query existing code:', e);
    }

    // 새 코드 생성
    myRaceCode = generateRaceCode();
    try {
        await db.collection('raceCodes').doc(myRaceCode).set({
            ownerUid: currentUser.uid,
            ownerName: currentUser.displayName?.split(' ')[0] || '유저',
            createdAt: Date.now(),
        });
        saveGame();
        console.log('[Race] Created my code:', myRaceCode);
    } catch (e) {
        console.error('[Race] Failed to create code:', e);
        myRaceCode = null;
    }
    return myRaceCode;
}

// --- 상대방의 active 레이스 찾기 ---
async function findActiveRace(uid) {
    // player1 또는 player2로 참가 중인 active 레이스 찾기
    try {
        const q1 = await db
            .collection('races')
            .where('player1Uid', '==', uid)
            .where('status', '==', 'active')
            .limit(1)
            .get();
        if (!q1.empty) return q1.docs[0];

        const q2 = await db
            .collection('races')
            .where('player2Uid', '==', uid)
            .where('status', '==', 'active')
            .limit(1)
            .get();
        if (!q2.empty) return q2.docs[0];
    } catch (e) {
        console.error('[Race] findActiveRace failed:', e);
    }
    return null;
}

// --- 코드로 레이스 참가 (즉시 시작) ---
async function joinRaceByCode(code) {
    if (!currentUser) {
        showToast('로그인이 필요합니다');
        return false;
    }
    if (currentRaceId) {
        showToast('이미 레이스 중입니다');
        return false;
    }

    const upperCode = code.toUpperCase().trim();
    if (upperCode.length !== 6) {
        showToast('6자리 코드를 입력하세요');
        return false;
    }

    try {
        // 1. 코드 조회
        const codeDoc = await db.collection('raceCodes').doc(upperCode).get();
        if (!codeDoc.exists) {
            showToast('유효하지 않은 코드');
            return false;
        }

        const codeData = codeDoc.data();

        // 2. 자기 코드 방지
        if (codeData.ownerUid === currentUser.uid) {
            showToast('자신의 코드는 사용 불가');
            return false;
        }

        // 3. 상대방이 레이스 중인지 확인
        const opponentRace = await findActiveRace(codeData.ownerUid);
        if (opponentRace) {
            showToast('상대방이 레이스 중입니다');
            return false;
        }

        // 4. 내가 이미 레이스 중인지 다시 확인 (동시성)
        const myRace = await findActiveRace(currentUser.uid);
        if (myRace) {
            showToast('이미 레이스 중입니다');
            return false;
        }

        // 5. 레이스 즉시 생성 + 시작
        const raceRef = db.collection('races').doc();
        const now = Date.now();
        await raceRef.set({
            player1Uid: currentUser.uid, // 코드 입력한 사람
            player1Name: currentUser.displayName?.split(' ')[0] || '유저',
            player2Uid: codeData.ownerUid, // 코드 주인
            player2Name: codeData.ownerName,
            player1Progress: 0,
            player2Progress: 0,
            status: 'active',
            winnerUid: null,
            rewardClaimed: {},
            createdAt: now,
            expiresAt: now + RACE_EXPIRE_MS, // 1시간 후 만료
        });

        currentRaceId = raceRef.id;
        stopPlayer2Listener(); // 레이스 중에는 player2 리스너 불필요
        saveGame();
        startRaceListener(raceRef.id);
        showToast('레이스 시작!');
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
let raceTimerInterval = null;
let lastRaceData = null;

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
                    saveGame();
                    updateRaceUI();
                    return;
                }

                const data = doc.data();
                lastRaceData = data;
                updateRaceUIFromData(data);

                // 타이머 인터벌 시작 (1초마다 업데이트)
                if (data.status === 'active' && !raceTimerInterval) {
                    raceTimerInterval = setInterval(() => {
                        if (lastRaceData && lastRaceData.status === 'active') {
                            updateRaceUIFromData(lastRaceData);
                            // 시간 초과 체크
                            if (lastRaceData.expiresAt && Date.now() >= lastRaceData.expiresAt) {
                                checkRaceTimeout(raceId, lastRaceData);
                            }
                        }
                    }, 1000);
                }

                // 승리 체크
                if (data.status === 'active') {
                    // 시간 초과 체크
                    if (data.expiresAt && Date.now() >= data.expiresAt) {
                        checkRaceTimeout(raceId, data);
                    } else if (data.player1Progress >= RACE_GOAL || data.player2Progress >= RACE_GOAL) {
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
                currentRaceId = null;
                stopRaceListener();
                saveGame();
                updateRaceUI();
            }
        );
}

// --- 레이스 리스너 중지 ---
function stopRaceListener() {
    if (raceUnsubscribe) {
        raceUnsubscribe();
        raceUnsubscribe = null;
    }
    if (raceTimerInterval) {
        clearInterval(raceTimerInterval);
        raceTimerInterval = null;
    }
    lastRaceData = null;
}

// --- 퀘스트 완료 시 진행도 업데이트 ---
async function updateRaceProgress() {
    if (!currentRaceId || !currentUser) return;

    try {
        const raceDoc = await db.collection('races').doc(currentRaceId).get();
        if (!raceDoc.exists) {
            currentRaceId = null;
            saveGame();
            return;
        }

        const data = raceDoc.data();
        if (data.status !== 'active') return;

        const isPlayer1 = data.player1Uid === currentUser.uid;
        const field = isPlayer1 ? 'player1Progress' : 'player2Progress';
        const currentProgress = isPlayer1 ? data.player1Progress : data.player2Progress;

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
    if (data.status === 'completed') return;

    let winnerUid = null;
    if (data.player1Progress >= RACE_GOAL && data.player2Progress >= RACE_GOAL) {
        winnerUid = 'draw';
    } else if (data.player1Progress >= RACE_GOAL) {
        winnerUid = data.player1Uid;
    } else if (data.player2Progress >= RACE_GOAL) {
        winnerUid = data.player2Uid;
    }

    if (!winnerUid) return;

    try {
        await db.runTransaction(async (transaction) => {
            const raceRef = db.collection('races').doc(raceId);
            const raceSnap = await transaction.get(raceRef);
            if (!raceSnap.exists || raceSnap.data().status === 'completed') {
                return;
            }
            transaction.update(raceRef, {
                status: 'completed',
                winnerUid: winnerUid,
            });
        });
        console.log('[Race] Winner declared:', winnerUid);
    } catch (e) {
        if (e.code !== 'aborted') {
            console.error('[Race] Winner declaration failed:', e);
        }
    }
}

// --- 시간 초과 처리 ---
async function checkRaceTimeout(raceId, data) {
    if (!currentUser) return;
    if (data.status === 'completed') return;

    // 진행도 많은 쪽 승리, 동점이면 무승부
    let winnerUid;
    if (data.player1Progress > data.player2Progress) {
        winnerUid = data.player1Uid;
    } else if (data.player2Progress > data.player1Progress) {
        winnerUid = data.player2Uid;
    } else {
        winnerUid = 'timeout_draw'; // 시간 초과 무승부
    }

    try {
        await db.runTransaction(async (transaction) => {
            const raceRef = db.collection('races').doc(raceId);
            const raceSnap = await transaction.get(raceRef);
            if (!raceSnap.exists || raceSnap.data().status === 'completed') {
                return;
            }
            transaction.update(raceRef, {
                status: 'completed',
                winnerUid: winnerUid,
                timedOut: true,
            });
        });
        console.log('[Race] Timeout winner:', winnerUid);
    } catch (e) {
        if (e.code !== 'aborted') {
            console.error('[Race] Timeout handling failed:', e);
        }
    }
}

// --- 결과 표시 + 보상 지급 ---
function showRaceResult(data) {
    if (!currentUser) return;

    const uid = currentUser.uid;

    // 이미 보상 받음
    if (data.rewardClaimed && data.rewardClaimed[uid]) {
        if (currentRaceId) {
            currentRaceId = null;
            stopRaceListener();
            saveGame();
            updateRaceUI();
            startPlayer2Listener(); // 다음 레이스 감지용
        }
        return;
    }

    let result, reward;
    const isTimeout = data.timedOut === true;

    if (data.winnerUid === 'timeout_draw') {
        // 시간 초과 무승부
        result = 'timeout_draw';
        reward = RACE_REWARDS.timeout;
    } else if (isTimeout) {
        // 시간 초과 승패
        if (data.winnerUid === uid) {
            result = 'timeout_win';
            reward = RACE_REWARDS.timeout;
            raceWins++;
        } else {
            result = 'timeout_lose';
            reward = RACE_REWARDS.timeout;
            raceLosses++;
        }
    } else if (data.winnerUid === 'draw') {
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
    claimRaceReward();

    // 레이스 종료
    currentRaceId = null;
    stopRaceListener();
    saveGame();
    updateAll();
    updateRaceUI();
    startPlayer2Listener(); // 다음 레이스 감지용

    // 결과 팝업
    const resultText = result === 'win' ? '🏆 승리!' : result === 'lose' ? '😢 패배' : '🤝 무승부';
    const rewardText = `${reward.coins}🪙` + (reward.diamonds > 0 ? ` ${reward.diamonds}💎` : '');
    showMilestonePopup(resultText, rewardText);
}

// --- 보상 수령 기록 ---
async function claimRaceReward() {
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

// --- UI: 레이스바 업데이트 ---
function updateRaceUI() {
    const raceBar = document.getElementById('race-bar');
    if (!raceBar) return;

    const trackEl = document.getElementById('race-track');
    const myCodeEl = document.getElementById('my-race-code');
    const copyBtn = document.getElementById('race-copy-btn');
    const joinBtn = document.getElementById('race-join-btn');

    // 내 코드 표시
    if (myCodeEl && myRaceCode) {
        myCodeEl.innerText = myRaceCode;
    }

    // 레이스 진행 중이 아닐 때
    if (!currentRaceId) {
        if (trackEl)
            trackEl.innerHTML = '<div class="text-gray-400 text-[10px] py-2">친구 코드를 입력해서 경쟁하세요!</div>';
        if (copyBtn) copyBtn.classList.remove('hidden');
        if (joinBtn) joinBtn.classList.remove('hidden');
        return;
    }

    // 레이스 진행 중이면 코드 입력 버튼 숨김
    if (copyBtn) copyBtn.classList.remove('hidden'); // 복사는 항상 가능
    if (joinBtn) joinBtn.classList.add('hidden');
}

// --- UI: 레이스 데이터로 업데이트 ---
function updateRaceUIFromData(data) {
    const trackEl = document.getElementById('race-track');
    if (!trackEl || !currentUser) return;

    const isPlayer1 = data.player1Uid === currentUser.uid;
    const myProgress = isPlayer1 ? data.player1Progress : data.player2Progress;
    const oppName = isPlayer1 ? data.player2Name : data.player1Name;
    const oppProgress = isPlayer1 ? data.player2Progress : data.player1Progress;

    const myPercent = Math.min((myProgress / RACE_GOAL) * 85, 85);
    const oppPercent = Math.min((oppProgress / RACE_GOAL) * 85, 85);

    // 남은 시간 계산
    let timerHtml = '';
    if (data.expiresAt && data.status === 'active') {
        const remaining = Math.max(0, data.expiresAt - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        timerHtml = `<div class="race-timer">⏱️ ${timerText}</div>`;
    }

    trackEl.innerHTML = `
        ${timerHtml}
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

// --- 레이스 유효성 검증 (시작 시) ---
async function validateCurrentRace() {
    if (!currentRaceId || !currentUser) return;

    try {
        const raceDoc = await db.collection('races').doc(currentRaceId).get();
        if (!raceDoc.exists) {
            console.log('[Race] Race not found, resetting');
            currentRaceId = null;
            saveGame();
            return;
        }

        const data = raceDoc.data();

        // 완료된 레이스인데 보상 이미 받았으면 리셋
        if (data.status === 'completed') {
            if (data.rewardClaimed && data.rewardClaimed[currentUser.uid]) {
                console.log('[Race] Race completed and claimed, resetting');
                currentRaceId = null;
                saveGame();
                return;
            }
            console.log('[Race] Unclaimed reward, starting listener');
        }

        // 유효한 레이스면 리스너 시작
        startRaceListener(currentRaceId);
    } catch (e) {
        console.error('[Race] Validation failed:', e);
        currentRaceId = null;
        saveGame();
    }
}

// --- player2로 참여한 레이스 감시 (내 코드로 시작된 레이스) ---
let player2Unsubscribe = null;

function startPlayer2Listener() {
    stopPlayer2Listener();
    if (!currentUser) return;

    // player2Uid가 나인 active 레이스 감시
    player2Unsubscribe = db
        .collection('races')
        .where('player2Uid', '==', currentUser.uid)
        .where('status', '==', 'active')
        .onSnapshot(
            (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added' && !currentRaceId) {
                        // 새 레이스 발견! (누군가 내 코드 입력)
                        const raceId = change.doc.id;
                        console.log('[Race] Someone started race with my code:', raceId);
                        currentRaceId = raceId;
                        saveGame();
                        startRaceListener(raceId);
                        showToast('레이스 시작!');
                        updateRaceUI();
                    }
                });
            },
            (err) => {
                console.error('[Race] Player2 listener error:', err);
            }
        );
}

function stopPlayer2Listener() {
    if (player2Unsubscribe) {
        player2Unsubscribe();
        player2Unsubscribe = null;
    }
}

// --- 초기화 ---
async function initRace() {
    await getOrCreateMyCode();
    if (currentRaceId) {
        await validateCurrentRace();
    } else {
        // 레이스 중 아니면 player2 리스너 시작 (누군가 내 코드 입력 감지)
        startPlayer2Listener();
    }
    updateRaceUI();
}
