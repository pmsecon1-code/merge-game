// ============================================
// album.js - 앨범 (사진 수집) 시스템
// ============================================

function getThemeCollectedCount(themeIdx) {
    const theme = ALBUM_THEMES[themeIdx];
    return theme.photos.filter((p) => album.includes(`${theme.id}_${p.id}`)).length;
}

// --- 사진 뽑기 ---
function getRandomPhoto() {
    const roll = Math.random();
    let rarity;
    if (roll < 0.08) rarity = 'SR';
    else if (roll < 0.28) rarity = 'R';
    else rarity = 'N';

    const candidates = [];
    for (const theme of ALBUM_THEMES) {
        for (const photo of theme.photos) {
            if (photo.rarity === rarity) {
                candidates.push({ themeId: theme.id, photo });
            }
        }
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function processDrawResult(result) {
    const key = `${result.themeId}_${result.photo.id}`;
    if (album.includes(key)) {
        const refund = ALBUM_DUPE_REWARD[result.photo.rarity];
        cards += refund;
        return { isDupe: true, refund };
    }
    album.push(key);
    return { isDupe: false };
}

function drawPhotos() {
    cards -= ALBUM_CARD_COST;

    const results = [];
    for (let i = 0; i < ALBUM_DRAW_COUNT; i++) {
        const pick = getRandomPhoto();
        const outcome = processDrawResult(pick);
        results.push({ ...pick, ...outcome });
    }

    const container = document.getElementById('draw-results');
    container.innerHTML = results
        .map((r) => {
            const rarityLabel = { N: '', R: '\u2605', SR: '\u2605\u2605' }[r.photo.rarity];
            const dupeText = r.isDupe
                ? `<div class="text-[10px] text-gray-400 mt-1">중복! +${r.refund}${ICON.card}</div>`
                : '<div class="text-[10px] text-green-500 mt-1 font-bold">NEW!</div>';
            return `
            <div class="draw-card ${r.isDupe ? 'dupe' : 'new'} rarity-${r.photo.rarity}">
                <div class="text-3xl">${r.photo.emoji}</div>
                <div class="text-xs font-bold mt-1">${r.photo.name}</div>
                <div class="photo-rarity ${r.photo.rarity}">${rarityLabel}${r.photo.rarity}</div>
                ${dupeText}
            </div>
        `;
        })
        .join('');

    playSound('album_draw');
    openOverlay('photo-draw-overlay');
    setTimeout(() => closePhotoDraw(), DICE_RESULT_POPUP_MS);
    updateAlbumBarUI();

    results.forEach((r) => {
        if (!r.isDupe) checkThemeComplete(r.themeId);
    });

    checkAlbumAllComplete();
    saveGame();
}

function openPhotoDraw() {
    if (cards < ALBUM_CARD_COST) {
        showError(`카드가 부족해요! (${cards}/${ALBUM_CARD_COST})`);
        return;
    }
    drawPhotos();
}

function closePhotoDraw() {
    closeOverlay('photo-draw-overlay');
}

// --- 앨범 주기 초기화 체크 ---
function checkAlbumReset() {
    if (Date.now() >= albumResetTime) {
        cards = 0;
        album = [];
        albumResetTime = Date.now() + ALBUM_CYCLE_MS;
        showToast(`${ICON.camera} 앨범이 초기화되었습니다!`);
        updateAlbumBarUI();
        saveGame();
    }
}

// --- 앨범 뷰 ---
function openAlbum() {
    playSound('click');
    checkAlbumReset();
    document.getElementById('album-modal').classList.add('show');
    renderAlbumTabs();
    renderAlbumGrid(currentAlbumTheme);
}

function closeAlbum() {
    document.getElementById('album-modal').classList.remove('show');
}

function renderAlbumTabs() {
    const tabsEl = document.getElementById('album-tabs');
    tabsEl.innerHTML = ALBUM_THEMES.map((t, ti) => {
        const collected = getThemeCollectedCount(ti);
        const isComplete = collected === t.photos.length;
        const isActive = t.id === currentAlbumTheme;
        return `<div class="album-tab ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}"
            onclick="switchAlbumTheme(${t.id})">${t.icon} ${collected}/${t.photos.length}</div>`;
    }).join('');
}

function switchAlbumTheme(idx) {
    playSound('click');
    currentAlbumTheme = idx;
    renderAlbumTabs();
    renderAlbumGrid(idx);
}

function renderAlbumGrid(idx) {
    const theme = ALBUM_THEMES[idx];
    const gridEl = document.getElementById('album-grid');
    const rewardEl = document.getElementById('album-theme-reward');
    const collected = getThemeCollectedCount(idx);
    const isComplete = collected === theme.photos.length;

    let html = '<div class="grid grid-cols-3 gap-2">';
    for (const p of theme.photos) {
        const key = `${theme.id}_${p.id}`;
        const has = album.includes(key);
        html += `
            <div class="album-photo ${has ? 'collected' : 'locked'} rarity-${p.rarity}">
                <div class="photo-emoji">${has ? p.emoji : '❓'}</div>
                <div class="photo-name">${has ? p.name : '???'}</div>
                <div class="photo-rarity ${p.rarity}">${p.rarity}</div>
            </div>`;
    }
    html += '</div>';
    gridEl.innerHTML = html;

    if (isComplete) {
        rewardEl.innerHTML = `<span class="text-green-500 font-bold">${ICON.check} 완성!</span> +${ALBUM_COMPLETE_COINS}${ICON.coin}`;
    } else {
        rewardEl.innerHTML = `완성 시 +${ALBUM_COMPLETE_COINS}${ICON.coin} (${collected}/${theme.photos.length})`;
    }
}

function checkThemeComplete(themeIdx) {
    const theme = ALBUM_THEMES[themeIdx];
    if (getThemeCollectedCount(themeIdx) === theme.photos.length) {
        const rewardKey = `album_complete_${themeIdx}`;
        if (!album.includes(rewardKey)) {
            album.push(rewardKey);
            addCoins(ALBUM_COMPLETE_COINS);
            playSound('theme_complete');
            showMilestonePopup(`${theme.icon} ${theme.name} 완성!`, `${ALBUM_COMPLETE_COINS}${ICON.coin}`);
        }
    }
}

function checkAlbumAllComplete() {
    const totalPhotos = ALBUM_THEMES.reduce((s, t) => s + t.photos.length, 0);
    if (getAlbumProgress() === totalPhotos) {
        playSound('theme_complete');
        diamonds += ALBUM_ALL_COMPLETE_DIAMONDS;
        // 테마 완성 팝업이 먼저 보이도록 딜레이
        setTimeout(() => {
            showMilestonePopup(`${ICON.camera} 앨범 완성! 새 주기 시작`, `${ALBUM_ALL_COMPLETE_DIAMONDS}${ICON.diamond}`);
        }, MILESTONE_POPUP_MS + 500);
        cards = 0;
        album = [];
        albumResetTime = Date.now() + ALBUM_CYCLE_MS;
        updateAlbumBarUI();
    }
}

function getAlbumProgress() {
    let total = 0;
    for (let i = 0; i < ALBUM_THEMES.length; i++) {
        total += getThemeCollectedCount(i);
    }
    return total;
}

function formatAlbumTimer() {
    const remaining = albumResetTime - Date.now();
    if (remaining <= 0) return '초기화!';
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${mins}분`;
    return `${mins}분`;
}

// --- UI 업데이트 ---
function updateAlbumBarUI() {
    checkAlbumReset();
    const progress = getAlbumProgress();
    const totalPhotos = ALBUM_THEMES.reduce((s, t) => s + t.photos.length, 0);
    const progressEl = document.getElementById('album-progress-text');
    const timerEl = document.getElementById('album-timer');
    const photoBar = document.getElementById('album-photo-bar');
    const cardValEl = document.getElementById('card-val');

    if (progressEl) progressEl.innerText = `${progress}/${totalPhotos}`;
    if (timerEl) timerEl.innerHTML = `${ICON.timer}${formatAlbumTimer()}`;
    if (photoBar) photoBar.style.width = `${Math.min((progress / totalPhotos) * 100, 100)}%`;
    if (cardValEl) cardValEl.innerText = cards;

    // 테마 미니 그리드
    const themeGrid = document.getElementById('album-theme-grid');
    if (themeGrid) {
        const icons = ['🐱','🐶','🐦','🐟','🦎','🍰','🧸','🚑','🌟'];
        let html = '';
        ALBUM_THEMES.forEach((theme, i) => {
            const collected = getThemeCollectedCount(i);
            const total = theme.photos.length;
            const complete = collected === total;
            html += `<div class="album-theme-chip${complete ? ' complete' : ''}" onclick="openAlbum();switchAlbumTheme(${i})">
                <span class="chip-icon">${icons[i]}</span>
                <span class="chip-progress">${collected}/${total}</span>
            </div>`;
        });
        themeGrid.innerHTML = html;
    }
}
