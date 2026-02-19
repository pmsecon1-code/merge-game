// ============================================
// story.js - 스토리 이미지 갤러리 시스템
// ============================================

// --- 다음 해제 가능 이미지 조회 ---
function getNextStoryImage() {
    return STORY_IMAGES.find(img =>
        !storyProgress.unlockedImages.includes(img.id) &&
        storyProgress.activeQuestId !== img.id
    ) || null;
}

// --- 레벨 체크 → 퀘스트 자동 활성 ---
function checkStoryQuests() {
    if (storyProgress.activeQuestId !== null) return; // 이미 활성 퀘스트 있음
    if (quests.some(q => q.isStory)) return; // 퀘스트 배열에 이미 있음
    const next = getNextStoryImage();
    if (!next) return; // 모든 이미지 해제됨
    if (userLevel < next.reqLevel) return; // 레벨 부족
    activateImageQuest(next);
}

// --- 이미지 퀘스트 생성 ---
function activateImageQuest(img) {
    // 퀘스트 10개 상한 → 가장 오래된 일반 퀘스트 제거
    while (quests.length >= 10) {
        const oldIdx = quests.findIndex(q => !q.isSpecial && !q.isStory);
        if (oldIdx === -1) break;
        quests.splice(oldIdx, 1);
    }
    storyProgress.activeQuestId = img.id;
    const storyQuest = {
        id: questIdCounter++,
        npc: '📖',
        reqs: img.reqs.map(r => ({ ...r })),
        reward: 0,
        cardReward: 0,
        expiresAt: null,
        isStory: true,
        storyImageId: img.id,
    };
    quests.unshift(storyQuest);
    updateQuestUI();
    saveGame();
}

// --- 이미지 퀘스트 완료 ---
function completeImageQuest(imageId) {
    const img = STORY_IMAGES.find(i => i.id === imageId);
    if (!img) return;

    // 이미지 해제
    if (!storyProgress.unlockedImages.includes(imageId)) {
        storyProgress.unlockedImages.push(imageId);
    }
    storyProgress.activeQuestId = null;

    // 보상
    if (img.reward.coins) addCoins(img.reward.coins);
    playSound('quest_complete');

    // 슬라이드쇼 (이미지 1장)
    showStoryPopup(
        [{ img: img.img, text: img.text }],
        'images/cats/cat1.png',
        `EP.${img.ep} "${img.title}"`,
        () => {
            // EP 마지막 이미지면 보스 스폰
            if (img.isLastInEp) {
                spawnBossOnBoard(img.ep);
            }
            showToast(`${img.reward.coins || 0}${ICON.coin} 획득!`);
            // 다음 퀘스트 체크
            checkStoryQuests();
        }
    );
    saveGame();
}

// --- 보스 보드 스폰 ---
function spawnBossOnBoard(epNumber) {
    const hp = STORY_BOSS_HP_BASE * epNumber;
    const bossData = { bossId: epNumber, hp: hp, maxHp: hp, boardIdx: -1 };

    // 빈 칸 찾기 (7행 미션 제외, i < 30)
    const emptyIdx = boardState.findIndex((x, i) => x === null && i < 30);
    if (emptyIdx !== -1) {
        boardState[emptyIdx] = { type: 'boss', bossId: epNumber };
        bossData.boardIdx = emptyIdx;
        storyProgress.bosses.push(bossData);
        const imgData = STORY_IMAGES.find(i => i.ep === epNumber && i.isLastInEp);
        playSound('race_start');
        showToast(`${imgData?.bossName || '보스'} 출현!`);
    } else {
        // 보드 가득 → 대기
        storyProgress.pendingBoss = epNumber;
        storyProgress.bosses.push(bossData);
        showToast('보드 가득! 빈 칸이 생기면 보스 출현');
    }
    saveGame();
}

// --- 보드 가득 시 재시도 ---
function trySpawnPendingBoss() {
    if (storyProgress.pendingBoss === null) return;
    const ep = storyProgress.pendingBoss;
    const emptyIdx = boardState.findIndex((x, i) => x === null && i < 30);
    if (emptyIdx !== -1) {
        boardState[emptyIdx] = { type: 'boss', bossId: ep };
        // bosses에서 해당 보스 boardIdx 갱신
        const boss = storyProgress.bosses.find(b => b.bossId === ep && b.boardIdx === -1);
        if (boss) boss.boardIdx = emptyIdx;
        storyProgress.pendingBoss = null;
        const imgData = STORY_IMAGES.find(i => i.ep === ep && i.isLastInEp);
        playSound('race_start');
        showToast(`${imgData?.bossName || '보스'} 출현!`);
    }
}

// --- 보스 데미지 (합성 레벨 비례) ---
function dealBoardBossDamage(mergeLevel) {
    const aliveBosses = storyProgress.bosses.filter(b => b.hp > 0 && b.boardIdx >= 0);
    if (aliveBosses.length === 0) return;

    const dmg = Math.max(1, mergeLevel || 1);
    for (const boss of aliveBosses) {
        boss.hp = Math.max(0, boss.hp - dmg);
        // 데미지 이펙트
        if (boss.boardIdx >= 0) {
            const cell = boardEl.children[boss.boardIdx];
            if (cell) showFloatText(cell, `-${dmg}`, '#ef4444');
        }
        if (boss.hp <= 0) {
            setTimeout(() => defeatBoardBoss(boss), 300);
        }
    }
    saveGame();
}

// --- 보스 격파 ---
function defeatBoardBoss(boss) {
    const ep = boss.bossId;
    const imgData = STORY_IMAGES.find(i => i.ep === ep && i.isLastInEp);

    // 보드에서 제거
    if (boss.boardIdx >= 0 && boardState[boss.boardIdx]?.type === 'boss') {
        boardState[boss.boardIdx] = null;
    }
    // bosses 배열에서 제거
    const idx = storyProgress.bosses.indexOf(boss);
    if (idx !== -1) storyProgress.bosses.splice(idx, 1);

    // 보상: EP번호 × 50코인
    const reward = ep * 50;
    addCoins(reward);
    playSound('milestone');
    showMilestonePopup(
        `${imgData?.bossName || '보스'} 격파!`,
        `+${reward}${ICON.coin}`
    );
    renderGrid('board', boardState, boardEl);
    saveGame();
}

// --- 보스 셀 렌더링 ---
function createBossItem(item, bossData, imgData) {
    const d = document.createElement('div');
    d.className = 'item boss-board-item';
    const pct = bossData ? (bossData.hp / bossData.maxHp) * 100 : 100;
    let hpColor = '#22c55e';
    if (pct <= 25) hpColor = '#ef4444';
    else if (pct <= 50) hpColor = '#eab308';
    d.innerHTML = `
        <div class="bg-circle" style="background-color:#fee2e2"></div>
        <img src="${imgData?.bossImg || 'images/story/boss_shadow.png'}" style="width:80%;height:80%;object-fit:contain;position:relative;z-index:1">
        <div class="boss-mini-hp">
            <div class="boss-mini-hp-fill" style="width:${pct}%;background:${hpColor}"></div>
        </div>
        <div class="text-[6px] text-red-600 font-bold" style="position:absolute;bottom:1px;width:100%;text-align:center;z-index:2">${bossData ? `${bossData.hp}/${bossData.maxHp}` : '?'}</div>
    `;
    return d;
}

// --- 보스 정보 팝업 ---
function showBossInfoPopup(bossData, imgData) {
    playSound('click');
    const name = imgData?.bossName || '보스';
    const bossImg = imgData?.bossImg || 'images/story/boss_shadow.png';
    const pct = Math.round((bossData.hp / bossData.maxHp) * 100);
    let hpColor = '#22c55e';
    if (pct <= 25) hpColor = '#ef4444';
    else if (pct <= 50) hpColor = '#eab308';

    const popup = document.getElementById('boss-info-popup');
    if (!popup) return;
    popup.querySelector('.boss-info-name').textContent = name;
    popup.querySelector('.boss-info-img').src = bossImg;
    popup.querySelector('.boss-info-hp-text').textContent = `${bossData.hp} / ${bossData.maxHp}`;
    const fill = popup.querySelector('.boss-info-hp-fill');
    fill.style.width = `${pct}%`;
    fill.style.background = hpColor;
    openOverlay('boss-info-popup');
}

function closeBossInfoPopup() {
    closeOverlay('boss-info-popup');
}

// --- 스토리 팝업 (슬라이드쇼) ---
function showStoryPopup(slides, npcImg, title, onClose) {
    const popup = document.getElementById('story-popup');
    if (!popup) return;
    storySlides = slides;
    storySlideIdx = 0;
    storySlideOnClose = onClose;
    document.getElementById('story-popup-title').textContent = title;
    document.getElementById('story-popup-npc').src = npcImg;
    popup.style.display = 'flex';
    document.getElementById('story-popup-close').style.display = 'none';
    showStorySlide(0);
}

function showStorySlide(idx) {
    const slide = storySlides[idx];
    if (!slide) return;
    const imgEl = document.getElementById('story-slide-img');
    const textEl = document.getElementById('story-slide-text');
    const dotsEl = document.getElementById('story-slide-dots');
    const closeBtn = document.getElementById('story-popup-close');
    imgEl.src = slide.img;
    textEl.textContent = slide.text;
    let dots = '';
    for (let i = 0; i < storySlides.length; i++) {
        dots += `<span class="story-dot${i === idx ? ' active' : ''}"></span>`;
    }
    dotsEl.innerHTML = dots;
    if (idx >= storySlides.length - 1) {
        closeBtn.style.display = '';
        closeBtn.onclick = () => {
            document.getElementById('story-popup').style.display = 'none';
            if (storySlideOnClose) storySlideOnClose();
        };
    } else {
        closeBtn.style.display = 'none';
    }
}

function advanceStorySlide() {
    if (storySlideIdx < storySlides.length - 1) {
        storySlideIdx++;
        showStorySlide(storySlideIdx);
    }
}

function closeStoryPopup() {
    document.getElementById('story-popup').style.display = 'none';
}

// --- 갤러리 모달 ---
function openStoryGallery() {
    playSound('click');
    renderStoryGallery();
    document.getElementById('story-gallery-modal').classList.add('show');
}

function renderStoryGallery() {
    const container = document.getElementById('story-gallery-list');
    if (!container) return;
    let html = '';
    // EP별 그룹핑
    const eps = {};
    STORY_IMAGES.forEach(img => {
        if (!eps[img.ep]) eps[img.ep] = { title: img.title, images: [] };
        eps[img.ep].images.push(img);
    });
    for (const [ep, data] of Object.entries(eps)) {
        const epImages = data.images;
        const unlockedCount = epImages.filter(i => storyProgress.unlockedImages.includes(i.id)).length;
        html += `<div class="story-ep-header">EP.${ep} "${data.title}" (${unlockedCount}/${epImages.length})</div>`;
        html += '<div class="story-gallery-grid">';
        epImages.forEach(img => {
            const unlocked = storyProgress.unlockedImages.includes(img.id);
            html += `<div class="gallery-image ${unlocked ? '' : 'locked'}" onclick="${unlocked ? `viewStoryImage(${img.id})` : ''}">
                <img src="${unlocked ? img.img : 'images/icons/lock.png'}" style="width:100%;height:100%;object-fit:${unlocked ? 'cover' : 'contain'};${unlocked ? '' : 'opacity:0.3;padding:8px'}">
            </div>`;
        });
        html += '</div>';
    }
    container.innerHTML = html;
}

// --- 해제된 이미지 보기 ---
function viewStoryImage(imageId) {
    const img = STORY_IMAGES.find(i => i.id === imageId);
    if (!img) return;
    // 갤러리 모달 닫기 (z-index 2500 > story-popup 2000)
    document.getElementById('story-gallery-modal').classList.remove('show');
    showStoryPopup(
        [{ img: img.img, text: img.text }],
        'images/cats/cat1.png',
        `EP.${img.ep} "${img.title}"`,
        null
    );
}

// --- 스토리 UI 업데이트 ---
function updateStoryUI() {
    const headerEl = document.getElementById('story-header-info');
    if (headerEl) {
        if (userLevel >= STORY_UNLOCK_LEVEL) {
            const total = STORY_IMAGES.length;
            const unlocked = storyProgress.unlockedImages.length;
            headerEl.textContent = `${unlocked}/${total}`;
            headerEl.parentElement.style.display = '';
        } else {
            headerEl.parentElement.style.display = 'none';
        }
    }
}
