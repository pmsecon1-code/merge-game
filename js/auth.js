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
