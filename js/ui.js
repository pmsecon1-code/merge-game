// ============================================
// ui.js - 렌더링, 이펙트, 드래그, 도감
// ============================================

// --- 그리드 렌더링 ---
function renderGrid(zone, state, cont) {
    const cells = cont.querySelectorAll('.cell');
    cells.forEach((c, i) => {
        if (dragData && dragData.zone === zone && dragData.index === i) return;
        c.className = 'cell';
        c.innerHTML = '';
        const item = state[i];
        if (item) {
            if (item.type === 'locked_board') {
                c.classList.add('locked');
                c.innerHTML = `<div class="opacity-50"><img src="images/icons/lock.png" class="icon icon-md"></div><div class="text-[8px] font-bold text-gray-500">${UNLOCK_COST_BOARD}${ICON.coin}</div>`;
            } else if (item.type === 'locked_storage') {
                c.classList.add('storage-locked');
                c.innerHTML = `<div><img src="images/icons/lock.png" class="icon icon-md"></div><div class="mt-1"><img src="images/icons/tv.png" class="icon icon-sm"></div>`;
            } else if (item.type === 'upgrade_mission') {
                const done = genLevels[item.target] >= item.reqLevel;
                const name = item.target === 'cat' ? '캣타워' : '개집';
                c.classList.add('upgrade-mission-cell');
                if (done) c.classList.add('done');
                c.innerHTML = `<div>${done ? '✅' : '<img src="images/icons/target.png" class="icon icon-md">'}</div><div class="text-[8px] font-bold text-center">${name}<br>Lv.${item.reqLevel}</div>`;
                c.dataset.missionTarget = item.target;
            } else if (item.type === 'animal_mission') {
                const list = item.target === 'cat' ? CATS : DOGS;
                const targetData = list[item.reqLevel - 1];
                const done =
                    boardState.some((b) => b && b.type === item.target && b.level >= item.reqLevel) ||
                    storageState.some((s) => s && s.type === item.target && s.level >= item.reqLevel);
                c.classList.add('upgrade-mission-cell');
                if (done) c.classList.add('done');
                const missionVisual = done ? '✅' : (targetData.img ? `<img src="${targetData.img}" style="width:1.2rem;height:1.2rem;object-fit:contain">` : targetData.emoji);
                c.innerHTML = `<div class="text-lg">${missionVisual}</div><div class="text-[8px] font-bold text-center">${targetData.name}<br>만들기</div>`;
            } else if (item.type === 'quest_count_mission') {
                const done = totalQuestsCompleted >= item.reqCount;
                c.classList.add('upgrade-mission-cell');
                if (done) c.classList.add('done');
                c.innerHTML = `<div class="text-lg">${done ? '✅' : '📋'}</div><div class="text-[8px] font-bold text-center">퀘스트<br>${totalQuestsCompleted}/${item.reqCount}</div>`;
            } else c.appendChild(createItem(item, zone, i));
        }
    });
}

function createItem(item, zone, index) {
    if (item.type.includes('generator')) {
        const d = document.createElement('div');
        d.className = 'cage-generator';
        let emoji = '📦',
            label = '케이지',
            type = item.type.replace('_generator', '');
        const spawnerImg = `images/spawners/spawner_${type}.png`;
        let specialUI = '';
        if (['bird', 'fish', 'reptile', 'toy'].includes(type)) {
            const rem = GENERATOR_MAX_CLICKS - (item.clicks || 0);
            if (item.cooldown > Date.now())
                specialUI = `<div class="cooldown-overlay"><span>💤</span><span>${Math.ceil((item.cooldown - Date.now()) / 1000)}s</span></div>`;
            else specialUI = `<div class="usage-badge">${rem}/6</div>`;
        }
        const genColors = { cat: ['#fff1f2','#f472b6'], dog: ['#fef3c7','#fbbf24'], bird: ['#e0f2fe','#38bdf8'], fish: ['#ccfbf1','#2dd4bf'], reptile: ['#dcfce7','#4ade80'], toy: ['#f3e8ff','#a78bfa'] };
        const [bg, accent] = genColors[type] || ['#f1f5f9','#64748b'];
        if (type === 'cat') {
            label = `캣타워 (Lv.${genLevels.cat})`;
        } else if (type === 'dog') {
            label = `개집 (Lv.${genLevels.dog})`;
        } else if (type === 'bird') {
            label = '새장';
        } else if (type === 'fish') {
            label = '어항';
        } else if (type === 'reptile') {
            label = '사육장';
        } else if (type === 'toy') {
            label = '장난감 생성기';
        }
        d.style.background = bg;
        d.style.borderColor = accent;
        d.style.boxShadow = `0 3px 0 ${accent}`;
        const visual = `<img src="${spawnerImg}" style="width:80%;height:80%;object-fit:contain">`;
        const helpDisplay = tutorialStep > 0 ? ' style="display:none"' : '';
        d.innerHTML = `${specialUI}<div class="animal-inside">${visual}</div><div class="cage-label" style="background:${accent}">${label}</div><div class="help-btn"${helpDisplay} data-gen-type="${type}">?</div>`;
        return d;
    }
    if (item.type === 'piggy_bank') {
        const d = document.createElement('div');
        d.className = 'item piggy-bank-item';
        const ready = Date.now() >= item.openAt;
        const rem = Math.max(0, item.openAt - Date.now());
        const m = Math.floor(rem / 60000);
        const s = Math.floor((rem % 60000) / 1000);
        const cooldown = ready ? '' : `<div class="cooldown-overlay"><span>${m}:${s.toString().padStart(2, '0')}</span></div>`;
        d.innerHTML = `
            <div class="bg-circle" style="background-color:#fbbf24"></div>
            <img src="images/spawners/spawner_piggybank.png" style="width:80%;height:80%;object-fit:contain;position:relative;z-index:1">
            ${cooldown}
        `;
        if (!ready && tutorialStep <= 0) {
            const adBtn = document.createElement('div');
            adBtn.className = 'sell-btn ad-btn';
            adBtn.innerHTML = '<img src="images/icons/tv.png" class="icon icon-xs">';
            adBtn.onclick = (e) => { e.stopPropagation(); openAdPopup(zone, index); };
            d.appendChild(adBtn);
        }
        return d;
    }
    const d = document.createElement('div');
    d.className = 'item';
    let list,
        isSnack = item.type.includes('snack'),
        isToy = item.type.includes('toy');
    if (item.type === 'cat') list = CATS;
    else if (item.type === 'dog') list = DOGS;
    else if (item.type === 'cat_snack') list = CAT_SNACKS;
    else if (item.type === 'dog_snack') list = DOG_SNACKS;
    else if (item.type === 'cat_toy') list = CAT_TOYS;
    else if (item.type === 'dog_toy') list = DOG_TOYS;
    else if (item.type === 'bird') list = BIRDS;
    else if (item.type === 'fish') list = FISH;
    else if (item.type === 'reptile') list = REPTILES;
    const data = list[item.level - 1] || list[list.length - 1];
    const itemKey = `${item.type}_${item.level}`;
    const discoveredAt = newlyDiscoveredItems.get(itemKey);
    const isNew = discoveredAt && Date.now() - discoveredAt < 10000;
    const newBadge = isNew ? '<div class="new-badge">NEW</div>' : '';
    const imgSize = isSnack || isToy ? '65%' : '80%';
    const itemVisual = data.img
        ? `<img src="${data.img}" alt="${data.name}" style="width:${imgSize};height:${imgSize};object-fit:contain">`
        : `<div style="font-size:${isSnack || isToy ? '1.5rem' : '2rem'}">${data.emoji}</div>`;
    d.innerHTML = `<div class="${isSnack || isToy ? 'bg-square' : 'bg-circle'}" style="background-color:${data.color}"></div>${itemVisual}<div class="level-badge">Lv.${item.level}</div>${newBadge}`;
    if (tutorialStep <= 0) {
        const sellBtn = document.createElement('div');
        sellBtn.className = 'sell-btn';
        sellBtn.innerText = 'ⓒ';
        sellBtn.onclick = (e) => askSellItem(zone, index, e);
        d.appendChild(sellBtn);
    }
    return d;
}

// --- UI 업데이트 ---
function updateAll() {
    renderGrid('board', boardState, boardEl);
    renderGrid('storage', storageState, storageEl);
    renderShop();
    updateUI();
    updateTimerUI();
    updateQuestUI();
    trySpawnSpecialGenerator();
    updateDailyMissionUI();
    updateAlbumBarUI();
    updateDiceTripUI();
    updateBottomBadges();
    saveGame();
    // 튜토리얼 중이면 스포트라이트 재배치
    if (tutorialStep > 0) repositionTutorial();
}

function updateUI() {
    coinEl.innerText = coins.toLocaleString();
    diamondEl.innerText = diamonds.toLocaleString();
    energyEl.innerText = energy;
    levelEl.innerText = `Lv.${userLevel}`;
    energyEl.className = energy === 0 ? 'text-xs font-bold text-red-500' : 'text-xs font-bold text-yellow-500';
    updateLevelupProgressUI();
}

function updateLevelupProgressUI() {
    const goal = getLevelUpGoal(userLevel);
    const reward = getLevelUpReward(userLevel);
    document.getElementById('levelup-progress-text').innerText = `${questProgress}/${goal}`;
    document.getElementById('levelup-progress-fill').style.width = `${(questProgress / goal) * 100}%`;
    document.getElementById('levelup-reward-preview').innerText = reward;
}

function updateTimerUI() {
    energyTimerEl.innerText =
        energy >= MAX_ENERGY
            ? 'FULL'
            : `${Math.floor(recoveryCountdown / 60)}:${(recoveryCountdown % 60).toString().padStart(2, '0')}`;
}

function updateQuestUI(scrollToFront = false) {
    questContainer.innerHTML = '';
    const inv = {};
    [...boardState, ...storageState].forEach((i) => {
        if (i && !i.type.includes('locked') && !i.type.includes('generator') && !i.type.includes('mission'))
            inv[`${i.type}_${i.level}`] = (inv[`${i.type}_${i.level}`] || 0) + 1;
    });

    const canComplete = (q) => {
        const tInv = { ...inv };
        for (const r of q.reqs) {
            const k = `${r.type}_${r.level}`;
            if (tInv[k] > 0) tInv[k]--;
            else return false;
        }
        return true;
    };

    quests.sort((a, b) => canComplete(b) - canComplete(a));
    // 스페셜 퀘스트: 완료 불가능할 때만 마지막 위치
    const spSortIdx = quests.findIndex((q) => q.isSpecial);
    if (spSortIdx !== -1 && !canComplete(quests[spSortIdx]) && spSortIdx !== quests.length - 1) {
        const [sp] = quests.splice(spSortIdx, 1);
        quests.push(sp);
    }

    quests.forEach((q, i) => {
        const d = document.createElement('div');
        d.className = 'quest-card';
        const ok = canComplete(q);
        if (ok) d.classList.add('ready');
        let h = `<div class="quest-top"><div class="quest-npc">${q.npc}</div><div class="quest-reqs">`;
        q.reqs.forEach((r) => {
            let l;
            if (r.type === 'cat') l = CATS;
            else if (r.type === 'dog') l = DOGS;
            else if (r.type === 'bird') l = BIRDS;
            else if (r.type === 'fish') l = FISH;
            else if (r.type === 'reptile') l = REPTILES;
            else if (r.type.includes('snack')) l = r.type.includes('cat') ? CAT_SNACKS : DOG_SNACKS;
            else if (r.type.includes('toy')) l = r.type.includes('cat') ? CAT_TOYS : DOG_TOYS;
            const reqData = l[r.level - 1];
            const reqVisual = reqData.img
                ? `<img src="${reqData.img}" style="width:22px;height:22px;object-fit:contain;vertical-align:middle">`
                : `<span class="text-lg">${reqData.emoji}</span>`;
            h += `<div class="req-item" title="Lv.${r.level}">${reqVisual}</div>`;
        });
        let timerText, rewardText;
        if (q.isSpecial) {
            timerText = '⭐스페셜';
            rewardText = `${ICON.coin}${ICON.piggy}`;
        } else {
            const remaining = q.expiresAt ? q.expiresAt - Date.now() : 0;
            timerText = remaining > 0 ? `⏱${formatQuestTimer(remaining)}` : '만료';
            rewardText = q.piggyReward ? `${ICON.coin}${ICON.piggy}` : q.cardReward > 0 ? `${q.cardReward}${ICON.card}` : `${q.reward}${ICON.coin}`;
        }
        h += `</div></div><div class="text-[9px] mb-1 text-center"><div class="text-yellow-600">보상: ${rewardText}</div><div class="${q.isSpecial ? 'text-purple-500' : 'text-red-500'}">${timerText}</div></div><div class="quest-btn ${ok ? 'complete' : 'incomplete'}" onclick="${ok ? `completeQuest(${i})` : ''}">${ok ? '완료!' : '구해줘'}</div>`;
        d.innerHTML = h;
        questContainer.appendChild(d);
    });
    if (scrollToFront) {
        requestAnimationFrame(() => { questContainer.scrollLeft = 0; });
    }
}

// --- 이펙트 ---
function spawnParticles(cell) {
    const particles = ['✨', '⭐', '💫', '🌟', '✦'];
    const rect = cell.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
        const p = document.createElement('div');
        p.className = 'spawn-particle';
        p.innerText = particles[Math.floor(Math.random() * particles.length)];
        const angle = (i / 6) * Math.PI * 2;
        const dist = 40 + Math.random() * 20;
        p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
        p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
        p.style.left = `${rect.left + rect.width / 2}px`;
        p.style.top = `${rect.top + rect.height / 2}px`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 600);
    }
}

function spawnItemEffect(cell, isLucky) {
    const rect = cell.getBoundingClientRect();
    const ring = document.createElement('div');
    ring.className = 'spawn-ring';
    ring.style.left = `${rect.left + rect.width / 2}px`;
    ring.style.top = `${rect.top + rect.height / 2}px`;
    if (isLucky) ring.classList.add('lucky');
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 500);
    const sparkles = isLucky ? ['🌟', '⭐', '✨', '💎', '🎉'] : ['✨', '·', '•'];
    const particleCount = isLucky ? 12 : 4;
    for (let i = 0; i < particleCount; i++) {
        const s = document.createElement('div');
        s.className = 'spawn-particle';
        s.innerText = sparkles[Math.floor(Math.random() * sparkles.length)];
        s.style.fontSize = isLucky ? '1.2rem' : '0.6rem';
        const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
        const dist = isLucky ? 40 + Math.random() * 30 : 25 + Math.random() * 15;
        s.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
        s.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
        s.style.left = `${rect.left + rect.width / 2}px`;
        s.style.top = `${rect.top + rect.height / 2}px`;
        document.body.appendChild(s);
        setTimeout(() => s.remove(), isLucky ? 700 : 500);
    }
}

function showLuckyEffect(cell) {
    playSound('lucky');
    cell.classList.add('lucky-glow');
    setTimeout(() => cell.classList.remove('lucky-glow'), 800);
    const flash = document.createElement('div');
    flash.className = 'lucky-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
    const txt = document.createElement('div');
    txt.className = 'lucky-text';
    txt.innerText = '✨ Lucky! ✨';
    document.body.appendChild(txt);
    setTimeout(() => txt.remove(), 1000);
}

function showFloatText(c, t, col) {
    if (!c) return;
    const r = c.getBoundingClientRect();
    const d = document.createElement('div');
    d.className = 'floating-text';
    d.innerText = t;
    d.style.color = col;
    d.style.left = r.left + r.width / 2 - 10 + 'px';
    d.style.top = r.top + 'px';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1000);
}

// --- 팝업/토스트 ---
function showToast(m) {
    const t = document.getElementById('toast');
    t.innerHTML = m;
    t.style.opacity = '1';
    setTimeout(() => (t.style.opacity = '0'), TOAST_DURATION_MS);
}

function showMilestonePopup(t, r) {
    document.getElementById('milestone-text').innerHTML = t;
    document.getElementById('milestone-reward').innerHTML = r;
    document.getElementById('milestone-overlay').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('milestone-overlay').style.display = 'none';
    }, MILESTONE_POPUP_MS);
}

function closeOverlay(id) {
    document.getElementById(id).style.display = 'none';
}

// --- 설정 팝업 ---
function openSettings() {
    const soundBtn = document.getElementById('setting-sound-btn');
    const musicBtn = document.getElementById('setting-music-btn');
    if (soundBtn) {
        soundBtn.textContent = soundEnabled ? 'ON' : 'OFF';
        soundBtn.classList.toggle('active', soundEnabled);
    }
    if (musicBtn) {
        musicBtn.textContent = musicEnabled ? 'ON' : 'OFF';
        musicBtn.classList.toggle('active', musicEnabled);
    }
    document.getElementById('settings-popup').style.display = 'flex';
}

function closeSettings() {
    closeOverlay('settings-popup');
}

// --- 유틸리티 ---
function formatTime(ms) {
    if (ms <= 0) return '00:00:00';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateEnergyPopupTimer() {
    const remaining = energyPurchaseResetTime - Date.now();
    document.getElementById('energy-reset-timer').innerText = formatTime(remaining);
    if (remaining <= 0) {
        const price = getEnergyPrice();
        document.getElementById('energy-price').innerText = price;
    }
}

// --- 드래그 앤 드롭 ---
function handleDragStart(e) {
    if (
        e.target.closest('.help-btn') ||
        e.target.closest('.quest-btn') ||
        e.target.closest('#btn-spin') ||
        e.target.closest('.sell-btn') ||
        e.target.closest('.shop-cell') ||
        e.target.closest('#dice-roll-btn') ||
        e.target.closest('#dice-confirm-btn') ||
        e.target.closest('.special-cage-box')
    ) {
        if (e.target.closest('.help-btn')) openGuide(e.target.closest('.help-btn').dataset.genType);
        e.stopPropagation();
        return;
    }
    const t = e.target.closest('.item, .cage-generator');
    if (!t) return;
    const p = t.parentElement;
    if (p.classList.contains('locked') || p.classList.contains('storage-locked')) return;
    e.preventDefault();
    const z = p.dataset.zone,
        i = parseInt(p.dataset.index);
    dragData = {
        zone: z,
        index: i,
        el: t,
        startX: e.touches ? e.touches[0].clientX : e.clientX,
        startY: e.touches ? e.touches[0].clientY : e.clientY,
    };
    const r = t.getBoundingClientRect();
    dragData.offsetX = dragData.startX - r.left;
    dragData.offsetY = dragData.startY - r.top;
    t.style.position = 'fixed';
    t.style.width = r.width + 'px';
    t.style.height = r.height + 'px';
    t.style.left = r.left + 'px';
    t.style.top = r.top + 'px';
    t.style.zIndex = 1000;
    t.style.pointerEvents = 'none';
}

function handleDragMove(e) {
    if (!dragData) return;
    e.preventDefault();
    const cx = e.touches ? e.touches[0].clientX : e.clientX,
        cy = e.touches ? e.touches[0].clientY : e.clientY;
    dragData.el.style.left = cx - dragData.offsetX + 'px';
    dragData.el.style.top = cy - dragData.offsetY + 'px';
}

function handleDragEnd(e) {
    if (!dragData) return;
    const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX,
        cy = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    if (Math.hypot(cx - dragData.startX, cy - dragData.startY) < 5) {
        dragData.el.style.display = '';
        handleCellClick(dragData.zone, dragData.index);
        dragData = null;
        updateAll();
        return;
    }
    // 튜토리얼: Step 3(합성)이 아니면 실제 드래그 차단
    if (tutorialStep > 0 && tutorialStep !== 3) {
        dragData = null;
        updateAll();
        return;
    }
    dragData.el.style.display = 'none';
    const el = document.elementFromPoint(cx, cy);
    dragData.el.style.display = 'flex';
    const tc = el ? el.closest('.cell') : null;
    if (tc) {
        const tz = tc.dataset.zone,
            ti = parseInt(tc.dataset.index),
            ts = tz === 'board' ? boardState : storageState;
        if (ts[ti] && (ts[ti].type.includes('locked') || ts[ti].type.includes('mission'))) { playSound('error'); showToast('잠겨있음!'); }
        else moveItem(dragData.zone, dragData.index, tz, ti);
    }
    dragData = null;
    updateAll();
}

// --- 도감/모달 ---
function openGuide(type) {
    currentGuideType = type;
    const isToy = type === 'toy';
    document.getElementById('tab-animal').style.display = isToy ? 'none' : '';
    document.getElementById('tab-snack').style.display = isToy || !['cat', 'dog'].includes(type) ? 'none' : '';
    document.getElementById('tab-cat_toy').style.display = isToy ? '' : 'none';
    document.getElementById('tab-dog_toy').style.display = isToy ? '' : 'none';
    document.getElementById('tab-upgrade').style.display = isToy ? 'none' : '';
    const defaultTab = isToy ? 'cat_toy' : 'animal';
    currentGuideTab = defaultTab;
    document.getElementById('guide-modal').classList.add('show');
    switchGuideTab(defaultTab);
}

function closeModal() {
    document.getElementById('guide-modal').classList.remove('show');
}

function switchGuideTab(tab) {
    currentGuideTab = tab;
    document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    const listContainer = document.getElementById('guide-list-container');
    const upgradeContainer = document.getElementById('upgrade-container');

    if (tab === 'upgrade') {
        listContainer.classList.add('hidden');
        upgradeContainer.classList.remove('hidden');
        upgradeContainer.classList.add('flex');
        updateUpgradeUI();
    } else {
        listContainer.classList.remove('hidden');
        upgradeContainer.classList.add('hidden');
        upgradeContainer.classList.remove('flex');
        renderGuideList(tab);
    }
}

function renderGuideList(tab) {
    const container = document.getElementById('guide-list-container');
    let list = [];

    if (tab === 'animal') {
        if (currentGuideType === 'cat') list = CATS;
        else if (currentGuideType === 'dog') list = DOGS;
        else if (currentGuideType === 'bird') list = BIRDS;
        else if (currentGuideType === 'fish') list = FISH;
        else if (currentGuideType === 'reptile') list = REPTILES;
    } else if (tab === 'snack') {
        if (currentGuideType === 'cat' || currentGuideType === 'dog') {
            list = currentGuideType === 'cat' ? CAT_SNACKS : DOG_SNACKS;
        } else {
            container.innerHTML = '<div class="text-center text-gray-400 py-8">이 동물은 간식이 없어요</div>';
            return;
        }
    } else if (tab === 'cat_toy') {
        list = CAT_TOYS;
    } else if (tab === 'dog_toy') {
        list = DOG_TOYS;
    }

    let html = '<div class="guide-list">';
    list.forEach((item) => {
        let key;
        if (tab === 'cat_toy') key = `cat_toy_${item.level}`;
        else if (tab === 'dog_toy') key = `dog_toy_${item.level}`;
        else key = `${currentGuideType}${tab === 'snack' ? '_snack' : ''}_${item.level}`;
        const isDiscovered = discoveredItems.has(key);
        html += `
                <div class="guide-item ${isDiscovered ? '' : 'locked'}">
                    <div class="guide-emoji">${item.img ? `<img src="${item.img}" style="width:2rem;height:2rem;object-fit:contain">` : item.emoji}</div>
                    <div class="guide-name">${isDiscovered ? item.name : '???'}</div>
                    <div class="guide-level">Lv.${item.level}</div>
                </div>
            `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function updateUpgradeUI() {
    const type = currentGuideType;
    const upgradeContent = document.getElementById('upgrade-content');
    const upgradeMsg = document.getElementById('upgrade-msg');
    if (type !== 'cat' && type !== 'dog') {
        if (upgradeContent) upgradeContent.style.display = 'none';
        if (upgradeMsg) upgradeMsg.style.display = 'block';
        return;
    }
    if (upgradeContent) upgradeContent.style.display = 'block';
    if (upgradeMsg) upgradeMsg.style.display = 'none';
    const currentLv = genLevels[type];
    const nextLv = Math.min(currentLv + 1, CAGE_MAX_LEVEL);
    document.getElementById('upg-current-lv').innerText = currentLv;
    document.getElementById('upg-current-luck').innerText = 5 + (currentLv - 1);
    document.getElementById('upg-next-lv').innerText = nextLv;
    document.getElementById('upg-next-luck').innerText = 5 + (nextLv - 1);
}

function upgradeGenerator() {
    const type = currentGuideType;
    if (type !== 'cat' && type !== 'dog') return;
    if (genLevels[type] >= CAGE_MAX_LEVEL) {
        playSound('error');
        showToast('최대 레벨!');
        return;
    }
    if (coins < CAGE_UPGRADE_COST) {
        playSound('error');
        showToast('코인 부족!');
        return;
    }
    coins -= CAGE_UPGRADE_COST;
    genLevels[type]++;
    playSound('purchase');
    showToast(`${type === 'cat' ? '캣타워' : '개집'} Lv.${genLevels[type]}!`);
    boardState.forEach((item, idx) => {
        if (item && item.type === 'upgrade_mission' && item.target === type && genLevels[type] >= item.reqLevel) {
            boardState[idx] = null;
            playSound('milestone');
            showToast('미션 완료! 칸 해제!');
        }
    });
    updateUpgradeUI();
    updateAll();
}

// --- 하단 배지 탭 ---
function toggleBottomTab(tabId) {
    const mapping = {
        race: 'race-bar',
        album: 'album-bar',
        dice: 'dice-trip-wrapper',
        shop: 'shop-wrapper',
        storage: 'storage-wrapper'
    };
    const dailyBar = document.getElementById('daily-mission-bar');

    if (currentBottomTab === tabId) {
        document.getElementById(mapping[tabId]).style.display = 'none';
        dailyBar.style.display = 'flex';
        currentBottomTab = null;
    } else {
        Object.values(mapping).forEach(id => document.getElementById(id).style.display = 'none');
        dailyBar.style.display = 'none';
        document.getElementById(mapping[tabId]).style.display = 'flex';
        currentBottomTab = tabId;
    }

    document.querySelectorAll('.bottom-nav-badge').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === currentBottomTab);
    });
}

function updateBottomBadges() {
    // 레이스: 상태별 표시
    const raceInfo = document.getElementById('badge-race-info');
    if (raceInfo) {
        if (currentRaceId && lastRaceData) {
            if (lastRaceData.status === 'pending' && lastRaceData.inviteExpiresAt) {
                // 초대 대기 중 → 남은 시간
                const rem = Math.max(0, lastRaceData.inviteExpiresAt - Date.now());
                const m = Math.floor(rem / 60000);
                const s = Math.floor((rem % 60000) / 1000);
                raceInfo.textContent = `⏱️${m}:${s.toString().padStart(2, '0')}`;
            } else if (lastRaceData.status === 'active') {
                // 진행 중 → 내 진행도/10
                const isP1 = currentUser && lastRaceData.player1Uid === currentUser.uid;
                const myProg = isP1 ? lastRaceData.player1Progress : lastRaceData.player2Progress;
                raceInfo.textContent = `${myProg || 0}/${RACE_GOAL}`;
            } else {
                raceInfo.textContent = '참가하기';
            }
        } else {
            raceInfo.textContent = '참가하기';
        }
    }

    // 앨범: 수집 진행도
    const albumInfo = document.getElementById('badge-album-info');
    if (albumInfo) albumInfo.textContent = `${getAlbumProgress()}/81`;

    // 주사위 여행: 위치/총칸
    const diceInfo = document.getElementById('badge-dice-info');
    if (diceInfo) diceInfo.textContent = `${diceTripPosition + 1}/50`;

    // 상점: 갱신 타이머
    const shopInfo = document.getElementById('badge-shop-info');
    if (shopInfo) {
        const rem = Math.max(0, shopNextRefresh - Date.now());
        const m = Math.floor(rem / 60000);
        const s = Math.floor((rem % 60000) / 1000);
        shopInfo.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }

    // 창고: 보관 중 / 열린 칸
    const storageInfo = document.getElementById('badge-storage-info');
    if (storageInfo) {
        const unlocked = storageState.filter(s => !s || s.type !== 'locked_storage').length;
        const used = storageState.filter(s => s && s.type !== 'locked_storage').length;
        storageInfo.textContent = `${used}/${unlocked}`;
    }
}

// --- 일일 미션 UI ---
function updateDailyMissionUI() {
    checkDailyReset();

    if (!dailyMissionsContainer) return;

    const tier = dailyMissions.tier;
    const missions = tier < 3 ? DAILY_MISSIONS[tier] : DAILY_MISSIONS[2];
    const allDone = tier >= 3;

    // 단계 표시 업데이트
    const tierInfo = document.getElementById('daily-tier-info');
    if (tierInfo) {
        if (allDone) {
            tierInfo.innerHTML = `<span class="text-green-600 font-bold">✅ 완료!</span> +${DAILY_COMPLETE_REWARD.diamonds}${ICON.diamond} +${DAILY_COMPLETE_REWARD.cards}${ICON.card}`;
        } else {
            tierInfo.textContent = `${'★'.repeat(tier + 1)} ${tier + 1}단계`;
        }
    }

    // 미션 목록 렌더링
    let html = '';
    missions.forEach((mission, idx) => {
        const progress = dailyMissions[mission.id];
        const target = mission.target;
        const pct = Math.min((progress / target) * 100, 100);
        const done = allDone || dailyMissions.claimed[idx];

        html += `
            <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold w-20 text-amber-700">${mission.icon} ${mission.label}</span>
                <div class="flex-1 h-3 bg-amber-100 rounded-full overflow-hidden">
                    <div class="h-full ${done ? 'bg-green-400' : 'bg-amber-400'} transition-all" style="width:${pct}%"></div>
                </div>
                <span class="text-[9px] w-14 text-right ${done ? 'text-green-600' : 'text-amber-600'} font-bold">
                    ${Math.min(progress, target)}/${target} ${done ? '✓' : ''}
                </span>
                <span class="text-[8px] text-amber-400">(${mission.reward}<img src="images/icons/coin.png" class="icon" style="width:10px;height:10px">)</span>
            </div>
        `;
    });
    dailyMissionsContainer.innerHTML = html;

    // 리셋 타이머 (KST 자정 기준)
    if (dailyResetTimer) {
        const remaining = getMsUntilKSTMidnight();
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        dailyResetTimer.innerText = `리셋 ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}
