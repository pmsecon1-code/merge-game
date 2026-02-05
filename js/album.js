// ============================================
// album.js - 앨범 (사진 수집) 시스템
// ============================================

// --- 사진 뽑기 ---
function getRandomPhoto() {
    const roll = Math.random();
    let rarity;
    if (roll < 0.05) rarity = 'SR';
    else if (roll < 0.25) rarity = 'R';
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
                ? `<div class="text-[10px] text-gray-400 mt-1">중복! +${r.refund}🃏</div>`
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

    document.getElementById('photo-draw-overlay').style.display = 'flex';
    updateAlbumBarUI();

    results.forEach((r) => {
        if (!r.isDupe) checkThemeComplete(r.themeId);
    });

    saveGame();
}

function openPhotoDraw() {
    if (cards < ALBUM_CARD_COST) {
        showToast('카드가 부족해요!');
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
        showToast('📸 앨범이 초기화되었습니다!');
        updateAlbumBarUI();
        saveGame();
    }
}

// --- 앨범 뷰 ---
function openAlbum() {
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
    tabsEl.innerHTML = ALBUM_THEMES.map((t) => {
        const collected = t.photos.filter((p) => album.includes(`${t.id}_${p.id}`)).length;
        const isComplete = collected === t.photos.length;
        const isActive = t.id === currentAlbumTheme;
        return `<div class="album-tab ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}"
            onclick="switchAlbumTheme(${t.id})">${t.icon} ${collected}/${t.photos.length}</div>`;
    }).join('');
}

function switchAlbumTheme(idx) {
    currentAlbumTheme = idx;
    renderAlbumTabs();
    renderAlbumGrid(idx);
}

function renderAlbumGrid(idx) {
    const theme = ALBUM_THEMES[idx];
    const gridEl = document.getElementById('album-grid');
    const rewardEl = document.getElementById('album-theme-reward');
    const collected = theme.photos.filter((p) => album.includes(`${theme.id}_${p.id}`)).length;
    const isComplete = collected === theme.photos.length;

    gridEl.innerHTML = theme.photos
        .map((p) => {
            const key = `${theme.id}_${p.id}`;
            const has = album.includes(key);
            return `
            <div class="album-photo ${has ? 'collected' : 'locked'} rarity-${p.rarity}">
                <div class="photo-emoji">${has ? p.emoji : '❓'}</div>
                <div class="photo-name">${has ? p.name : '???'}</div>
                <div class="photo-rarity ${p.rarity}">${p.rarity}</div>
            </div>
        `;
        })
        .join('');

    if (isComplete) {
        rewardEl.innerHTML = `<span class="text-green-500 font-bold">✅ 완성!</span> +${ALBUM_COMPLETE_COINS}🪙`;
    } else {
        rewardEl.innerHTML = `완성 보상: ${ALBUM_COMPLETE_COINS}🪙 (${collected}/${theme.photos.length})`;
    }
}

function checkThemeComplete(themeIdx) {
    const theme = ALBUM_THEMES[themeIdx];
    const collected = theme.photos.filter((p) => album.includes(`${theme.id}_${p.id}`)).length;
    if (collected === theme.photos.length) {
        const rewardKey = `album_complete_${themeIdx}`;
        if (!album.includes(rewardKey)) {
            album.push(rewardKey);
            coins += ALBUM_COMPLETE_COINS;
            cumulativeCoins += ALBUM_COMPLETE_COINS;
            showMilestonePopup(`${theme.icon} ${theme.name} 완성!`, `${ALBUM_COMPLETE_COINS}🪙`);
        }
    }
}

function getAlbumProgress() {
    let total = 0;
    for (const theme of ALBUM_THEMES) {
        total += theme.photos.filter((p) => album.includes(`${theme.id}_${p.id}`)).length;
    }
    return total;
}

function getCompletedThemes() {
    let count = 0;
    for (const theme of ALBUM_THEMES) {
        const collected = theme.photos.filter((p) => album.includes(`${theme.id}_${p.id}`)).length;
        if (collected === theme.photos.length) count++;
    }
    return count;
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
    const completed = getCompletedThemes();
    const progressEl = document.getElementById('album-progress-text');
    const cardEl = document.getElementById('card-count');
    const drawBtn = document.getElementById('draw-btn');
    const timerEl = document.getElementById('album-timer');
    const themeEl = document.getElementById('album-theme-count');

    if (progressEl) progressEl.innerText = `${progress}/${totalPhotos}`;
    if (cardEl) cardEl.innerText = `🃏 ${cards}`;
    if (drawBtn) drawBtn.disabled = cards < ALBUM_CARD_COST;
    if (timerEl) timerEl.innerText = `⏱${formatAlbumTimer()}`;
    if (themeEl) themeEl.innerText = `🏆${completed}/${ALBUM_THEMES.length}`;
}
