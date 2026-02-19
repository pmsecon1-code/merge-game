// ============================================
// story.js - 시나리오 미션 시스템
// ============================================

// --- 해제 체크 ---
function checkStoryUnlock() {
    if (userLevel < STORY_UNLOCK_LEVEL) return;
    if (storyProgress.phase !== 'idle') return;
    // 이미 진행/완료한 적 있으면 스킵
    if (storyProgress.completed.length > 0 || storyProgress.currentEpisode > 0 || storyProgress.currentChapter > 0) return;
    // 첫 해제 → EP.1 시작
    startStoryEpisode();
}

// --- 현재 에피소드 데이터 ---
function getCurrentStoryEpisode() {
    const ch = STORY_CHAPTERS[storyProgress.currentChapter];
    if (!ch) return null;
    const ep = ch.episodes[storyProgress.currentEpisode];
    return ep || null;
}

// --- 에피소드 시작 (인트로 팝업) ---
function startStoryEpisode() {
    const ep = getCurrentStoryEpisode();
    if (!ep) return;
    const chTitle = STORY_CHAPTERS[storyProgress.currentChapter].title;
    const title = `EP.${ep.id + 1} "${ep.title}"`;
    showStoryPopup(ep.intro, ep.npc, `${chTitle} - ${title}`, () => {
        activateStoryQuest();
    });
}

// --- 퀘스트 활성화 ---
function activateStoryQuest() {
    const ep = getCurrentStoryEpisode();
    if (!ep) return;
    storyProgress.phase = 'quest';
    // 퀘스트 배열에 스토리 퀘스트 추가 (맨 앞)
    const storyQuest = {
        id: questIdCounter++,
        npc: '📖',
        reqs: ep.reqs.map(r => ({ ...r })),
        reward: 0,
        cardReward: 0,
        expiresAt: null,
        isStory: true,
        storyChapter: storyProgress.currentChapter,
        storyEpisode: storyProgress.currentEpisode,
    };
    quests.unshift(storyQuest);
    updateQuestUI();
    saveGame();
}

// --- 스토리 퀘스트 완료 ---
function completeStoryQuest() {
    const ep = getCurrentStoryEpisode();
    if (!ep) return;
    // 아웃트로 → 보스전
    const chTitle = STORY_CHAPTERS[storyProgress.currentChapter].title;
    const title = `EP.${ep.id + 1} "${ep.title}"`;
    showStoryPopup(ep.outro, ep.npc, `${chTitle} - ${title}`, () => {
        startBossBattle();
    });
}

// --- 보스전 시작 ---
function startBossBattle() {
    const ep = getCurrentStoryEpisode();
    if (!ep) return;
    storyProgress.phase = 'battle';
    storyProgress.bossHp = ep.bossHp;
    storyProgress.bossMaxHp = ep.bossHp;
    updateBossUI();
    document.getElementById('boss-overlay').style.display = 'flex';
    playSound('race_start');
    saveGame();
}

// --- 보스 데미지 ---
function dealBossDamage(mergeLevel) {
    if (storyProgress.phase !== 'battle') return;
    const dmg = mergeLevel * STORY_DMG_MULTIPLIER;
    storyProgress.bossHp = Math.max(0, storyProgress.bossHp - dmg);
    // 데미지 팝업
    const bossEl = document.getElementById('boss-overlay');
    if (bossEl) {
        const dmgEl = document.getElementById('boss-dmg-text');
        if (dmgEl) {
            dmgEl.textContent = `-${dmg}!`;
            dmgEl.classList.remove('boss-dmg-anim');
            void dmgEl.offsetWidth; // reflow
            dmgEl.classList.add('boss-dmg-anim');
        }
    }
    updateBossUI();
    if (storyProgress.bossHp <= 0) {
        setTimeout(() => defeatBoss(), 500);
    }
    saveGame();
}

// --- 보스 UI 갱신 ---
function updateBossUI() {
    const hpBar = document.getElementById('boss-hp-fill');
    const hpText = document.getElementById('boss-hp-text');
    const nameEl = document.getElementById('boss-name');
    const imgEl = document.getElementById('boss-img');
    if (!hpBar) return;
    const ep = getCurrentStoryEpisode();
    if (!ep) return;
    const pct = storyProgress.bossMaxHp > 0 ? (storyProgress.bossHp / storyProgress.bossMaxHp) * 100 : 0;
    hpBar.style.width = `${pct}%`;
    if (pct > 50) hpBar.style.background = '#22c55e';
    else if (pct > 25) hpBar.style.background = '#eab308';
    else hpBar.style.background = '#ef4444';
    if (hpText) hpText.textContent = `${storyProgress.bossHp}/${storyProgress.bossMaxHp} HP`;
    if (nameEl) nameEl.textContent = ep.bossName;
    if (imgEl) imgEl.src = ep.bossImg;
}

// --- 보스 격파 ---
function defeatBoss() {
    const ep = getCurrentStoryEpisode();
    if (!ep) return;
    document.getElementById('boss-overlay').style.display = 'none';
    storyProgress.phase = 'idle';
    const key = `${storyProgress.currentChapter}_${storyProgress.currentEpisode}`;
    if (!storyProgress.completed.includes(key)) {
        storyProgress.completed.push(key);
    }
    // 보상
    giveStoryReward(ep);
    playSound('milestone');
    // 다음 에피소드 체크
    const ch = STORY_CHAPTERS[storyProgress.currentChapter];
    if (storyProgress.currentEpisode < ch.episodes.length - 1) {
        storyProgress.currentEpisode++;
        saveGame();
        // 다음 에피소드 자동 시작
        setTimeout(() => startStoryEpisode(), 1500);
    } else {
        // 챕터 완료
        completeStoryChapter();
    }
}

// --- 보상 지급 ---
function giveStoryReward(ep) {
    const r = ep.reward;
    if (r.coins) addCoins(r.coins);
    showMilestonePopup(`EP.${ep.id + 1} "${ep.title}" 클리어!`, `${r.coins || 0}${ICON.coin}`);
    updateUI();
}

// --- 챕터 완료 ---
function completeStoryChapter() {
    const chIdx = storyProgress.currentChapter;
    if (!storyProgress.chaptersCompleted.includes(chIdx)) {
        storyProgress.chaptersCompleted.push(chIdx);
    }
    // 다음 챕터가 있으면 이동 (현재 Ch.1만)
    if (storyProgress.currentChapter < STORY_CHAPTERS.length - 1) {
        storyProgress.currentChapter++;
        storyProgress.currentEpisode = 0;
    }
    saveGame();
    showMilestonePopup(
        `${STORY_CHAPTERS[chIdx].title} 완주!`,
        'Chapter 완료!'
    );
}

// --- 스토리 팝업 ---
function showStoryPopup(texts, npcImg, title, onClose) {
    const popup = document.getElementById('story-popup');
    const titleEl = document.getElementById('story-popup-title');
    const textEl = document.getElementById('story-popup-text');
    const npcEl = document.getElementById('story-popup-npc');
    const closeBtn = document.getElementById('story-popup-close');
    if (!popup) return;
    titleEl.textContent = title;
    textEl.innerHTML = texts.map(line => line === '' ? '<br>' : `<p>${line}</p>`).join('');
    npcEl.src = npcImg;
    popup.style.display = 'flex';
    closeBtn.onclick = () => {
        popup.style.display = 'none';
        if (onClose) onClose();
    };
}

function closeStoryPopup() {
    document.getElementById('story-popup').style.display = 'none';
}

// --- 챕터 목록 모달 ---
function openStoryChapterList() {
    playSound('click');
    renderStoryChapterList();
    document.getElementById('story-chapter-modal').classList.add('show');
}

function renderStoryChapterList() {
    const container = document.getElementById('story-chapter-list');
    if (!container) return;
    let html = '';
    STORY_CHAPTERS.forEach((ch, ci) => {
        const chDone = storyProgress.chaptersCompleted.includes(ci);
        html += `<div class="story-chapter-header">${chDone ? ICON.check : '📖'} Ch.${ci + 1}: ${ch.title}</div>`;
        ch.episodes.forEach((ep, ei) => {
            const key = `${ci}_${ei}`;
            const done = storyProgress.completed.includes(key);
            const current = storyProgress.currentChapter === ci && storyProgress.currentEpisode === ei && !done;
            const locked = !done && !current;
            html += `<div class="story-episode-item ${done ? 'done' : current ? 'current' : 'locked'}">
                <span class="text-[10px] font-bold">${done ? ICON.check : current ? '▶' : ICON.lock} EP.${ei + 1}</span>
                <span class="text-[10px] ${locked ? 'text-gray-400' : ''}">${locked ? '???' : ep.title}</span>
            </div>`;
        });
    });
    container.innerHTML = html;
}

// --- 스토리 UI 업데이트 ---
function updateStoryUI() {
    // 퀘스트 헤더 진행도
    const headerEl = document.getElementById('story-header-info');
    if (headerEl) {
        if (userLevel >= STORY_UNLOCK_LEVEL) {
            const ch = STORY_CHAPTERS[storyProgress.currentChapter];
            const allDone = storyProgress.chaptersCompleted.includes(storyProgress.currentChapter)
                && storyProgress.currentChapter >= STORY_CHAPTERS.length - 1;
            if (allDone) {
                headerEl.textContent = '완료!';
            } else if (ch) {
                headerEl.textContent = `EP.${storyProgress.currentEpisode + 1}/${ch.episodes.length}`;
            }
            headerEl.parentElement.style.display = '';
        } else {
            headerEl.parentElement.style.display = 'none';
        }
    }
    // 보스 오버레이
    const bossOverlay = document.getElementById('boss-overlay');
    if (bossOverlay) {
        if (storyProgress.phase === 'battle') {
            bossOverlay.style.display = 'flex';
            updateBossUI();
        } else {
            bossOverlay.style.display = 'none';
        }
    }
}
