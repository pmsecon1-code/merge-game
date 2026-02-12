// ============================================
// auth.js - Firebase 초기화 + 인증 + 세션 관리
// ============================================

console.log('[Script] Loading...');

// --- constants.js 로드 확인 ---
if (typeof BOARD_SIZE === 'undefined') {
    console.error('[Script] constants.js not loaded!');
    alert('게임 로드 실패: constants.js를 찾을 수 없습니다.');
}

// --- Firebase 초기화 ---
const firebaseConfig = {
    apiKey: 'AIzaSyCmca1GswvALHTh_PtNXCJ39VVlje3HUZY',
    authDomain: 'merge-game-7cf5f.firebaseapp.com',
    projectId: 'merge-game-7cf5f',
    storageBucket: 'merge-game-7cf5f.firebasestorage.app',
    messagingSenderId: '400056855947',
    appId: '1:400056855947:web:492180660615c92df6d38e',
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// --- 세션 관리 ---
function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function registerSession() {
    if (!currentUser) return;
    currentSessionId = generateSessionId();
    console.log('[Session] Registering session:', currentSessionId);
    try {
        await db
            .collection('sessions')
            .doc(currentUser.uid)
            .set({
                sessionId: currentSessionId,
                loginAt: Date.now(),
                device: navigator.userAgent.substring(0, 100),
            });
        console.log('[Session] Session registered successfully');
    } catch (e) {
        console.error('[Session] Registration failed:', e);
    }
}

function startSessionListener() {
    if (!currentUser || !currentSessionId) return;

    if (sessionUnsubscribe) {
        sessionUnsubscribe();
    }

    console.log('[Session] Starting realtime listener...');
    sessionUnsubscribe = db
        .collection('sessions')
        .doc(currentUser.uid)
        .onSnapshot(
            (doc) => {
                if (doc.exists && currentSessionId) {
                    const serverSessionId = doc.data().sessionId;
                    if (serverSessionId !== currentSessionId) {
                        console.log('[Session] Different session detected, logging out...');
                        showToast('다른 기기에서 로그인되어 로그아웃됩니다.');
                        if (sessionUnsubscribe) {
                            sessionUnsubscribe();
                            sessionUnsubscribe = null;
                        }
                        auth.signOut();
                    }
                }
            },
            (e) => {
                console.error('[Session] Listener error:', e);
            }
        );
}

function stopSessionListener() {
    if (sessionUnsubscribe) {
        sessionUnsubscribe();
        sessionUnsubscribe = null;
    }
}

// --- Google 로그인 ---
async function startGoogleLogin() {
    console.log('[Auth] startGoogleLogin called');
    document.getElementById('login-status').textContent = '로그인 처리 중...';
    document.getElementById('login-status').classList.remove('hidden');
    document.getElementById('google-login-btn').disabled = true;

    try {
        console.log('[Auth] Calling signInWithPopup...');
        const result = await auth.signInWithPopup(googleProvider);
        console.log('[Auth] Popup login success:', result.user.email);
    } catch (e) {
        console.error('[Auth] Login error:', e);
        alert('로그인 실패: ' + e.message);
        document.getElementById('login-status').textContent = '로그인 실패';
        document.getElementById('google-login-btn').disabled = false;
    }
}

async function handleGoogleLogin() {
    if (currentUser) {
        if (confirm('로그아웃 하시겠습니까?')) {
            await auth.signOut();
        }
    }
}

// --- 회원탈퇴 ---
async function deleteAccount() {
    if (!currentUser) return;
    if (!confirm('정말 탈퇴하시겠습니까?\n모든 게임 데이터가 삭제됩니다.')) return;
    if (!confirm('되돌릴 수 없습니다. 정말 삭제하시겠습니까?')) return;

    const uid = currentUser.uid;
    try {
        // Firestore 데이터 삭제
        await db.collection('saves').doc(uid).delete();
        await db.collection('sessions').doc(uid).delete();
        // raceCodes 삭제 (내 코드가 있으면)
        if (myRaceCode) {
            await db.collection('raceCodes').doc(myRaceCode).delete();
        }
        // Firebase Auth 계정 삭제
        await currentUser.delete();
        showToast('회원탈퇴가 완료되었습니다.');
        localStorage.clear();
        showLoginScreen();
    } catch (e) {
        if (e.code === 'auth/requires-recent-login') {
            showToast('보안을 위해 재로그인이 필요합니다.');
            try {
                await auth.signInWithPopup(googleProvider);
                // 재로그인 후 재시도
                const user = auth.currentUser;
                if (user) {
                    await db.collection('saves').doc(user.uid).delete();
                    await db.collection('sessions').doc(user.uid).delete();
                    if (myRaceCode) {
                        await db.collection('raceCodes').doc(myRaceCode).delete();
                    }
                    await user.delete();
                    showToast('회원탈퇴가 완료되었습니다.');
                    localStorage.clear();
                    showLoginScreen();
                }
            } catch (e2) {
                console.error('[Auth] Re-auth failed:', e2);
                showToast('탈퇴 실패: ' + e2.message);
            }
        } else {
            console.error('[Auth] Delete account failed:', e);
            showToast('탈퇴 실패: ' + e.message);
        }
    }
}

// --- 화면 전환 ---
function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('login-status').classList.add('hidden');
    document.getElementById('google-login-btn').disabled = false;
}

function showGameScreen() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
}
