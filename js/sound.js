// ============================================
// sound.js - 사운드 시스템 (효과음 + BGM)
// ============================================

// --- 초기화 ---
function initSound() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('[Sound] AudioContext created');
    } catch (e) {
        console.warn('[Sound] Web Audio API not supported:', e);
    }
    preloadAllSounds();
    updateSoundUI();
}

// --- iOS 첫 터치 unlock ---
function unlockAudio() {
    if (audioUnlocked) return;
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (musicEnabled) playBGM();
    audioUnlocked = true;
    console.log('[Sound] Audio unlocked');
}

// --- 합성음 생성/재생 ---
function createSynthSound(id) {
    if (!audioContext || !soundEnabled) return;
    if (audioContext.state === 'suspended') audioContext.resume();

    const now = audioContext.currentTime;

    switch (id) {
        case 'spawn': {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.connect(gain).connect(audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
        }
        case 'merge': {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(330, now);
            osc.frequency.exponentialRampToValueAtTime(660, now + 0.3);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain).connect(audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
        }
        case 'purchase': {
            const osc1 = audioContext.createOscillator();
            const osc2 = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc1.type = 'sine';
            osc1.frequency.value = 880;
            osc2.type = 'sine';
            osc2.frequency.value = 1320;
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioContext.destination);
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.15);
            osc2.stop(now + 0.15);
            break;
        }
        case 'error': {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = 110;
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.connect(gain).connect(audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.25);
            break;
        }
        case 'click': {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.value = 600;
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.connect(gain).connect(audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        }
        case 'dice_drop': {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.connect(gain).connect(audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
        }
        case 'dice_roll': {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            for (let t = 0; t < 0.5; t += 0.05) {
                osc.frequency.setValueAtTime(200 + Math.random() * 200, now + t);
            }
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.connect(gain).connect(audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.5);
            break;
        }
        case 'piggy_open': {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.4);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.connect(gain).connect(audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.4);
            break;
        }
        case 'daily_bonus': {
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const start = now + i * 0.12;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
                osc.connect(gain).connect(audioContext.destination);
                osc.start(start);
                osc.stop(start + 0.3);
            });
            break;
        }
        case 'milestone': {
            [659.25, 783.99, 1046.5].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const start = now + i * 0.1;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);
                osc.connect(gain).connect(audioContext.destination);
                osc.start(start);
                osc.stop(start + 0.25);
            });
            break;
        }
        case 'levelup': {
            // 승리 팡파레: C5-E5-G5-C6 아르페지오
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const start = now + i * 0.1;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.25, start + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.35);
                osc.connect(gain).connect(audioContext.destination);
                osc.start(start);
                osc.stop(start + 0.35);
            });
            break;
        }
        case 'quest_complete': {
            // 완료 차임: G4-C5 두 음
            [392, 523.25].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const start = now + i * 0.12;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.3, start + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);
                osc.connect(gain).connect(audioContext.destination);
                osc.start(start);
                osc.stop(start + 0.25);
            });
            break;
        }
        case 'lucky': {
            // 반짝임: 높은 음 빠른 아르페지오
            [1318.5, 1568, 1760, 2093].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const start = now + i * 0.06;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);
                osc.connect(gain).connect(audioContext.destination);
                osc.start(start);
                osc.stop(start + 0.2);
            });
            break;
        }
        case 'album_draw': {
            // 카드 뽑기: 스윕 + 딩
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain).connect(audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.3);
            // 딩
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.type = 'sine';
            osc2.frequency.value = 1568;
            gain2.gain.setValueAtTime(0, now + 0.15);
            gain2.gain.linearRampToValueAtTime(0.25, now + 0.18);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc2.connect(gain2).connect(audioContext.destination);
            osc2.start(now + 0.15);
            osc2.stop(now + 0.4);
            break;
        }
        case 'theme_complete': {
            // 테마 완성: 화려한 5음 팡파레
            [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const start = now + i * 0.08;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.25, start + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.4);
                osc.connect(gain).connect(audioContext.destination);
                osc.start(start);
                osc.stop(start + 0.4);
            });
            break;
        }
        case 'race_start': {
            // 출발 신호: 삐-삐-삐-삐~
            [440, 440, 440, 880].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'square';
                osc.frequency.value = freq;
                const dur = i === 3 ? 0.3 : 0.1;
                const start = now + i * 0.2;
                gain.gain.setValueAtTime(0.15, start);
                gain.gain.exponentialRampToValueAtTime(0.01, start + dur);
                osc.connect(gain).connect(audioContext.destination);
                osc.start(start);
                osc.stop(start + dur);
            });
            break;
        }
        case 'race_win': {
            // 승리: 밝은 장조 팡파레
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const start = now + i * 0.12;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.3, start + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.4);
                osc.connect(gain).connect(audioContext.destination);
                osc.start(start);
                osc.stop(start + 0.4);
            });
            break;
        }
        case 'race_lose': {
            // 패배: 하강 단조
            [392, 349.23, 293.66].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const start = now + i * 0.15;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.25, start + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.35);
                osc.connect(gain).connect(audioContext.destination);
                osc.start(start);
                osc.stop(start + 0.35);
            });
            break;
        }
    }
}

// --- 프리로드 (전부 합성음이므로 빈 함수) ---
function preloadAllSounds() {}

// --- 통합 재생 API ---
function playSound(id) {
    if (!soundEnabled) return;
    createSynthSound(id);
}

// --- BGM (Web Audio 합성 루프) ---
let bgmTimer = null;

function playBGM() {
    if (!musicEnabled || !audioContext || bgmTimer) return;
    if (audioContext.state === 'suspended') audioContext.resume();

    // C 페ン타토닉 뮤직박스 (8th note, 0=쉼표)
    const melody = [
        523.25, 0, 659.25, 0, 783.99, 0, 880, 0,
        783.99, 0, 659.25, 0, 587.33, 0, 523.25, 0,
        587.33, 0, 783.99, 0, 880, 0, 1046.5, 0,
        880, 0, 783.99, 0, 659.25, 0, 0, 0,
    ];
    const bassNotes = [130.81, 146.83, 164.81, 130.81]; // C3 D3 E3 C3
    let step = 0;

    bgmTimer = setInterval(() => {
        if (!audioContext || !musicEnabled) { stopBGM(); return; }
        const now = audioContext.currentTime;
        const freq = melody[step % melody.length];

        // 멜로디
        if (freq > 0) {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.06, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.connect(gain).connect(audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        }

        // 베이스 (8스텝마다 = 1마디)
        if (step % 8 === 0) {
            const bass = audioContext.createOscillator();
            const bGain = audioContext.createGain();
            bass.type = 'sine';
            bass.frequency.value = bassNotes[Math.floor(step / 8) % bassNotes.length];
            bGain.gain.setValueAtTime(0.04, now);
            bGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
            bass.connect(bGain).connect(audioContext.destination);
            bass.start(now);
            bass.stop(now + 1.2);
        }

        step++;
    }, 220);
}

function stopBGM() {
    if (bgmTimer) {
        clearInterval(bgmTimer);
        bgmTimer = null;
    }
}

// --- 토글 ---
function toggleSound() {
    soundEnabled = !soundEnabled;
    updateSoundUI();
    saveGame();
}

function toggleMusic() {
    musicEnabled = !musicEnabled;
    if (musicEnabled) playBGM();
    else stopBGM();
    updateSoundUI();
    saveGame();
}

// --- UI 업데이트 ---
function updateSoundUI() {
    const soundBtn = document.getElementById('sound-toggle-btn');
    const musicBtn = document.getElementById('music-toggle-btn');
    if (soundBtn) {
        soundBtn.textContent = soundEnabled ? '\uD83D\uDD0A' : '\uD83D\uDD07';
        soundBtn.classList.toggle('sound-disabled', !soundEnabled);
    }
    if (musicBtn) {
        musicBtn.textContent = '\uD83C\uDFB5';
        musicBtn.classList.toggle('sound-disabled', !musicEnabled);
    }
}
