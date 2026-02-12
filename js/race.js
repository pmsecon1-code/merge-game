// ============================================
// race.js - 레이스 시스템 (단순화 버전)
// ============================================

const RACE_GOAL = 7; // 퀘스트 7개 완료
const RACE_EXPIRE_MS = 60 * 60 * 1000; // 1시간 제한
const RACE_INVITE_EXPIRE_MS = 10 * 60 * 1000; // 초대 10분 만료
const RACE_REWARDS = {
    win: { coins: 150, diamonds: 5 },
    lose: { coins: 30, diamonds: 0 },
    draw: { coins: 80, diamonds: 3 },
    timeout: { coins: 30, diamonds: 0 },
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

// --- 코드로 초대 전송 (pending 상태로 생성) ---
async function joinRaceByCode(code) {
    if (!currentUser) {
        showToast('로그인이 필요합니다');
        return false;
    }
    if (currentRaceId) {
        showToast('이미 초대 중이거나 레이스 중입니다');
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

        // 3. 상대방이 레이스/초대 중인지 확인
        const opponentRace = await findActiveOrPendingRace(codeData.ownerUid);
        if (opponentRace) {
            const status = opponentRace.data().status;
            showToast(status === 'pending' ? '상대방이 다른 초대를 확인 중입니다' : '상대방이 레이스 중입니다');
            return false;
        }

        // 4. 내가 이미 레이스/초대 중인지 다시 확인 (동시성)
        const myRace = await findActiveOrPendingRace(currentUser.uid);
        if (myRace) {
            showToast('이미 초대 중이거나 레이스 중입니다');
            return false;
        }

        // 5. 초대 생성 (pending 상태)
        const raceRef = db.collection('races').doc();
        const now = Date.now();
        await raceRef.set({
            player1Uid: currentUser.uid, // 코드 입력한 사람 (초대자)
            player1Name: currentUser.displayName?.split(' ')[0] || '유저',
            player2Uid: codeData.ownerUid, // 코드 주인 (초대받는 사람)
            player2Name: codeData.ownerName,
            status: 'pending',
            inviteExpiresAt: now + RACE_INVITE_EXPIRE_MS, // 10분 후 만료
            createdAt: now,
        });

        currentRaceId = raceRef.id;
        stopPlayer2Listener(); // 초대 중에는 player2 리스너 불필요
        saveGame();
        startRaceListener(raceRef.id);
        showToast('초대를 보냈습니다');
        updateRaceUI();
        return true;
    } catch (e) {
        console.error('[Race] Invite failed:', e);
        showToast('초대 실패');
        return false;
    }
}

// --- 상대방의 active 또는 pending 레이스 찾기 ---
async function findActiveOrPendingRace(uid) {
    try {
        // player1로 참가 중인 active/pending 레이스
        const q1Active = await db
            .collection('races')
            .where('player1Uid', '==', uid)
            .where('status', '==', 'active')
            .limit(1)
            .get();
        if (!q1Active.empty) return q1Active.docs[0];

        const q1Pending = await db
            .collection('races')
            .where('player1Uid', '==', uid)
            .where('status', '==', 'pending')
            .limit(1)
            .get();
        if (!q1Pending.empty) return q1Pending.docs[0];

        // player2로 참가 중인 active/pending 레이스
        const q2Active = await db
            .collection('races')
            .where('player2Uid', '==', uid)
            .where('status', '==', 'active')
            .limit(1)
            .get();
        if (!q2Active.empty) return q2Active.docs[0];

        const q2Pending = await db
            .collection('races')
            .where('player2Uid', '==', uid)
            .where('status', '==', 'pending')
            .limit(1)
            .get();
        if (!q2Pending.empty) return q2Pending.docs[0];
    } catch (e) {
        console.error('[Race] findActiveOrPendingRace failed:', e);
    }
    return null;
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
                    startPlayer2Listener(); // 다음 레이스 감지용
                    return;
                }

                const data = doc.data();
                lastRaceData = data;

                // pending 상태 (초대 대기 중 - player1 시점)
                if (data.status === 'pending') {
                    updatePendingInviteUI(data);

                    // 만료 체크 (1초마다)
                    if (!raceTimerInterval) {
                        raceTimerInterval = setInterval(() => {
                            if (lastRaceData && lastRaceData.status === 'pending') {
                                updatePendingInviteUI(lastRaceData);
                                if (Date.now() >= lastRaceData.inviteExpiresAt) {
                                    expireInvite(raceId);
                                }
                            }
                        }, 1000);
                    }
                    return;
                }

                // 거절/만료/취소됨
                if (data.status === 'declined' || data.status === 'expired' || data.status === 'cancelled') {
                    const msg =
                        data.status === 'declined'
                            ? '초대가 거절되었습니다'
                            : data.status === 'cancelled'
                              ? '초대가 취소되었습니다'
                              : '응답 시간이 초과되었습니다';
                    showToast(msg);
                    currentRaceId = null;
                    stopRaceListener();
                    saveGame();
                    updateRaceUI();
                    startPlayer2Listener();
                    return;
                }

                // active 상태 (레이스 진행 중)
                if (data.status === 'active') {
                    // pending UI 숨기기 (pending → active 전환 시)
                    const pendingEl = document.getElementById('race-pending-status');
                    if (pendingEl) pendingEl.classList.add('hidden');

                    // pending 타이머 인터벌이 실행 중이면 클리어
                    if (raceTimerInterval) {
                        clearInterval(raceTimerInterval);
                        raceTimerInterval = null;
                    }

                    updateRaceUIFromData(data);

                    // 타이머 인터벌 시작 (1초마다 업데이트)
                    if (!raceTimerInterval) {
                        raceTimerInterval = setInterval(() => {
                            if (lastRaceData && lastRaceData.status === 'active') {
                                updateRaceUIFromData(lastRaceData);
                                const expiresAt = lastRaceData.expiresAt || lastRaceData.createdAt + RACE_EXPIRE_MS;
                                if (Date.now() >= expiresAt) {
                                    checkRaceTimeout(raceId, lastRaceData);
                                }
                            }
                        }, 1000);
                    }

                    // 시간 초과 체크
                    const expiresAt = data.expiresAt || data.createdAt + RACE_EXPIRE_MS;
                    if (Date.now() >= expiresAt) {
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
                startPlayer2Listener(); // 다음 레이스 감지용
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
            startPlayer2Listener(); // 다음 레이스 감지용
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

    // 최근 상대 저장
    const isPlayer1 = data.player1Uid === uid;
    const opponentUid = isPlayer1 ? data.player2Uid : data.player1Uid;
    const opponentName = isPlayer1 ? data.player2Name : data.player1Name;
    addRecentOpponent(opponentUid, opponentName);

    // 레이스 종료
    currentRaceId = null;
    stopRaceListener();
    saveGame();
    updateAll();
    updateRaceUI();
    startPlayer2Listener(); // 다음 레이스 감지용

    // 결과 팝업
    const resultText = result === 'win' ? '🏆 승리!' : result === 'lose' ? '😢 패배' : '🤝 무승부';
    const rewardText = `${reward.coins}🪙` + (reward.diamonds > 0 ? ` + ${reward.diamonds}💎` : '');
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

// --- 최근 상대 저장 ---
async function addRecentOpponent(opponentUid, opponentName) {
    if (!opponentUid || opponentUid === currentUser?.uid) return;

    try {
        // 상대방 코드 조회
        const codeQuery = await db
            .collection('raceCodes')
            .where('ownerUid', '==', opponentUid)
            .limit(1)
            .get();

        if (codeQuery.empty) return;

        const code = codeQuery.docs[0].id;

        // 기존 목록에서 같은 상대 제거
        recentRaceOpponents = recentRaceOpponents.filter((o) => o.code !== code);

        // 맨 앞에 추가 (최신순)
        recentRaceOpponents.unshift({ code, name: opponentName });

        // 최대 3명 유지
        if (recentRaceOpponents.length > 3) {
            recentRaceOpponents = recentRaceOpponents.slice(0, 3);
        }

        console.log('[Race] Recent opponents:', recentRaceOpponents);
    } catch (e) {
        console.error('[Race] Failed to add recent opponent:', e);
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
    const timerEl = document.getElementById('race-timer');
    const pendingEl = document.getElementById('race-pending-status');

    // 내 코드 표시
    if (myCodeEl && myRaceCode) {
        myCodeEl.innerText = myRaceCode;
    }

    // 레이스/초대 진행 중이 아닐 때
    if (!currentRaceId) {
        if (trackEl)
            trackEl.innerHTML = `<div class="text-gray-400 text-[10px] py-2">친구 코드를 입력해서 경쟁하세요! (승리 시 +${RACE_REWARDS.win.coins}🪙 +${RACE_REWARDS.win.diamonds}💎)</div>`;
        if (copyBtn) copyBtn.classList.remove('hidden');
        if (joinBtn) joinBtn.classList.remove('hidden');
        if (timerEl) timerEl.classList.add('hidden');
        if (pendingEl) pendingEl.classList.add('hidden');
        return;
    }

    // 레이스/초대 진행 중이면 코드 입력 버튼 숨김
    if (copyBtn) copyBtn.classList.remove('hidden'); // 복사는 항상 가능
    if (joinBtn) joinBtn.classList.add('hidden');
}

// --- UI: 레이스 데이터로 업데이트 ---
function updateRaceUIFromData(data) {
    const trackEl = document.getElementById('race-track');
    const timerEl = document.getElementById('race-timer');
    if (!trackEl || !currentUser) return;

    const isPlayer1 = data.player1Uid === currentUser.uid;
    const myProgress = isPlayer1 ? data.player1Progress : data.player2Progress;
    const oppName = isPlayer1 ? data.player2Name : data.player1Name;
    const oppProgress = isPlayer1 ? data.player2Progress : data.player1Progress;

    const myPercent = Math.min((myProgress / RACE_GOAL) * 85, 85);
    const oppPercent = Math.min((oppProgress / RACE_GOAL) * 85, 85);

    // 남은 시간 계산 (expiresAt 없으면 createdAt + 1시간)
    if (timerEl && data.status === 'active') {
        const expiresAt = data.expiresAt || (data.createdAt + RACE_EXPIRE_MS);
        const remaining = Math.max(0, expiresAt - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
        timerEl.classList.remove('hidden');
    }

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

// --- 팝업: 코드 입력 ---
function openRaceJoinPopup() {
    const popup = document.getElementById('race-join-popup');
    if (!popup) return;

    document.getElementById('race-code-input').value = '';
    document.getElementById('race-join-error').classList.add('hidden');

    // 최근 상대 렌더링
    const recentContainer = document.getElementById('recent-opponents');
    const recentList = document.getElementById('recent-opponents-list');
    if (recentContainer && recentList) {
        if (recentRaceOpponents.length > 0) {
            recentContainer.classList.remove('hidden');
            recentList.innerHTML = recentRaceOpponents
                .map(
                    (o) => `
                <div class="flex items-center justify-between bg-cyan-50 px-3 py-2 rounded-lg border border-cyan-200">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-bold text-cyan-700">${o.name}</span>
                        <span class="text-xs text-cyan-400 font-mono">${o.code}</span>
                    </div>
                    <button onclick="quickJoinRace('${o.code}')"
                        class="text-xs bg-cyan-500 text-white px-2 py-1 rounded font-bold hover:bg-cyan-600">
                        초대
                    </button>
                </div>
            `
                )
                .join('');
        } else {
            recentContainer.classList.add('hidden');
        }
    }

    popup.style.display = 'flex';
}

// --- 퀵 조인 (최근 상대) ---
async function quickJoinRace(code) {
    const success = await joinRaceByCode(code);
    if (success) {
        closeOverlay('race-join-popup');
    }
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
            startPlayer2Listener(); // 다음 레이스 감지용
            return;
        }

        const data = raceDoc.data();

        // 거절/만료/취소된 레이스면 리셋
        if (['declined', 'expired', 'cancelled'].includes(data.status)) {
            console.log('[Race] Race was', data.status, ', resetting');
            currentRaceId = null;
            saveGame();
            startPlayer2Listener();
            return;
        }

        // 완료된 레이스인데 보상 이미 받았으면 리셋
        if (data.status === 'completed') {
            if (data.rewardClaimed && data.rewardClaimed[currentUser.uid]) {
                console.log('[Race] Race completed and claimed, resetting');
                currentRaceId = null;
                saveGame();
                startPlayer2Listener();
                return;
            }
            console.log('[Race] Unclaimed reward, starting listener');
        }

        // pending 상태인데 내가 player2면 팝업 표시
        if (data.status === 'pending' && data.player2Uid === currentUser.uid) {
            console.log('[Race] Pending invite found, showing popup');
            showRaceInvitePopup(currentRaceId, data);
            currentRaceId = null; // player2는 수락 전까지 currentRaceId 없음
            saveGame();
            return;
        }

        // 유효한 레이스면 리스너 시작
        startRaceListener(currentRaceId);
    } catch (e) {
        console.error('[Race] Validation failed:', e);
        currentRaceId = null;
        saveGame();
        startPlayer2Listener(); // 다음 레이스 감지용
    }
}

// --- player2로 pending 초대 감시 (내 코드로 초대받음) ---
let player2Unsubscribe = null;

function startPlayer2Listener() {
    stopPlayer2Listener();
    if (!currentUser) return;

    // player2Uid가 나인 pending 초대 감시
    player2Unsubscribe = db
        .collection('races')
        .where('player2Uid', '==', currentUser.uid)
        .where('status', '==', 'pending')
        .onSnapshot(
            (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const raceId = change.doc.id;
                        const data = change.doc.data();
                        // 이미 같은 초대면 무시
                        if (pendingInviteId === raceId) return;
                        // 이미 레이스 중이면 무시
                        if (currentRaceId) {
                            console.log('[Race] Already in race, ignoring invite');
                            return;
                        }
                        console.log('[Race] Received invite:', raceId);
                        showRaceInvitePopup(raceId, data);
                    } else if (change.type === 'removed') {
                        // 초대 문서 삭제됨
                        if (pendingInviteId === change.doc.id) {
                            closeRaceInvitePopup();
                        }
                    } else if (change.type === 'modified') {
                        // 초대가 취소/만료/수락됨
                        if (pendingInviteId === change.doc.id) {
                            const data = change.doc.data();
                            if (data && data.status !== 'pending') {
                                closeRaceInvitePopup();
                            }
                        }
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

// --- 초대 팝업 표시 (player2) ---
function showRaceInvitePopup(raceId, data) {
    // 이미 만료된 초대면 무시
    if (Date.now() > data.inviteExpiresAt) {
        console.log('[Race] Ignoring expired invite:', raceId);
        return;
    }

    pendingInviteId = raceId;
    pendingInviteData = data;

    const popup = document.getElementById('race-invite-popup');
    const fromName = document.getElementById('invite-from-name');
    if (!popup || !fromName) return;

    fromName.textContent = data.player1Name || '???';
    popup.style.display = 'flex';

    // 초대 타이머 시작
    startInviteTimer(data.inviteExpiresAt);
}

// --- 초대 팝업 닫기 ---
function closeRaceInvitePopup() {
    const popup = document.getElementById('race-invite-popup');
    if (popup) popup.style.display = 'none';

    stopInviteTimer();
    pendingInviteId = null;
    pendingInviteData = null;
}

// --- 초대 타이머 시작 ---
function startInviteTimer(expiresAt) {
    stopInviteTimer();
    const timerEl = document.getElementById('invite-timer');
    if (!timerEl) return;

    const updateTimer = () => {
        const remaining = Math.max(0, expiresAt - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (remaining <= 0) {
            stopInviteTimer();
            closeRaceInvitePopup();
            showToast('초대 시간이 만료되었습니다');
        }
    };

    updateTimer();
    inviteTimerInterval = setInterval(updateTimer, 1000);
}

// --- 초대 타이머 중지 ---
function stopInviteTimer() {
    if (inviteTimerInterval) {
        clearInterval(inviteTimerInterval);
        inviteTimerInterval = null;
    }
}

// --- 초대 수락 (player2) ---
async function acceptRaceInvite() {
    if (!pendingInviteId || !currentUser) return;

    const raceId = pendingInviteId;

    try {
        const now = Date.now();
        await db.runTransaction(async (transaction) => {
            const raceRef = db.collection('races').doc(raceId);
            const raceSnap = await transaction.get(raceRef);

            if (!raceSnap.exists) {
                throw new Error('초대가 삭제되었습니다');
            }

            const data = raceSnap.data();
            if (data.status !== 'pending') {
                const msg =
                    data.status === 'cancelled'
                        ? '취소된 초대입니다'
                        : data.status === 'expired'
                          ? '만료된 초대입니다'
                          : '이미 처리된 초대입니다';
                throw new Error(msg);
            }
            if (now > data.inviteExpiresAt) {
                throw new Error('만료된 초대입니다');
            }

            transaction.update(raceRef, {
                status: 'active',
                player1Progress: 0,
                player2Progress: 0,
                winnerUid: null,
                rewardClaimed: {},
                expiresAt: now + RACE_EXPIRE_MS,
            });
        });

        currentRaceId = raceId;
        closeRaceInvitePopup();
        stopPlayer2Listener();
        startRaceListener(raceId);
        saveGame();
        showToast('레이스 시작!');
        updateRaceUI();
    } catch (e) {
        console.error('[Race] Accept invite failed:', e);
        showToast(e.message || '수락 실패');
        closeRaceInvitePopup();
    }
}

// --- 초대 거절 (player2) ---
async function declineRaceInvite() {
    if (!pendingInviteId) return;

    const raceId = pendingInviteId;

    try {
        await db.runTransaction(async (transaction) => {
            const raceRef = db.collection('races').doc(raceId);
            const raceSnap = await transaction.get(raceRef);

            if (!raceSnap.exists) {
                throw new Error('초대가 삭제되었습니다');
            }

            const data = raceSnap.data();
            if (data.status !== 'pending') {
                throw new Error('이미 처리된 초대입니다');
            }

            transaction.update(raceRef, { status: 'declined' });
        });
        closeRaceInvitePopup();
        showToast('초대를 거절했습니다');
    } catch (e) {
        console.error('[Race] Decline invite failed:', e);
        showToast(e.message || '거절 실패');
        closeRaceInvitePopup();
    }
}

// --- 초대 취소 (player1) ---
async function cancelPendingInvite() {
    if (!currentRaceId || !currentUser) return;

    const raceId = currentRaceId;

    try {
        await db.runTransaction(async (transaction) => {
            const raceRef = db.collection('races').doc(raceId);
            const raceSnap = await transaction.get(raceRef);

            if (!raceSnap.exists) {
                throw new Error('초대가 삭제되었습니다');
            }

            const data = raceSnap.data();
            if (data.player1Uid !== currentUser.uid) {
                throw new Error('권한이 없습니다');
            }
            if (data.status !== 'pending') {
                throw new Error(data.status === 'active' ? '이미 레이스가 시작되었습니다' : '이미 처리된 초대입니다');
            }

            transaction.update(raceRef, { status: 'cancelled' });
        });
        showToast('초대를 취소했습니다');
    } catch (e) {
        console.error('[Race] Cancel invite failed:', e);
        showToast(e.message || '취소 실패');
    }
}

// --- 초대 만료 처리 ---
async function expireInvite(raceId) {
    try {
        await db.collection('races').doc(raceId).update({
            status: 'expired',
        });
        console.log('[Race] Invite expired:', raceId);
    } catch (e) {
        console.error('[Race] Expire invite failed:', e);
    }
}

// --- UI: 대기 중 상태 표시 (player1) ---
function updatePendingInviteUI(data) {
    const pendingEl = document.getElementById('race-pending-status');
    const timerEl = document.getElementById('race-pending-timer');
    const trackEl = document.getElementById('race-track');
    const joinBtn = document.getElementById('race-join-btn');
    const raceTimerEl = document.getElementById('race-timer');

    if (pendingEl) pendingEl.classList.remove('hidden');
    if (joinBtn) joinBtn.classList.add('hidden');
    if (raceTimerEl) raceTimerEl.classList.add('hidden');

    // 타이머 업데이트
    if (timerEl && data.inviteExpiresAt) {
        const remaining = Math.max(0, data.inviteExpiresAt - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // 트랙에 대기 메시지 표시
    if (trackEl) {
        trackEl.innerHTML = `
            <div class="text-center py-2">
                <div class="text-orange-500 text-sm font-bold mb-1">📨 ${data.player2Name || '상대방'}에게 초대 전송됨</div>
                <div class="text-gray-400 text-[10px]">상대방의 응답을 기다리는 중...</div>
            </div>
        `;
    }
}

// --- 초기화 ---
async function initRace() {
    await getOrCreateMyCode();
    if (currentRaceId) {
        await validateCurrentRace();
    }
    // 레이스 중 아니면 player2 리스너 시작 (validateCurrentRace에서 클리어됐을 수도 있음)
    if (!currentRaceId) {
        startPlayer2Listener();
    }
    updateRaceUI();
}
