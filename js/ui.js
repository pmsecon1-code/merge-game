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
                c.innerHTML = `<div class="text-xl opacity-50">🔒</div><div class="text-[8px] font-bold text-gray-500">${UNLOCK_COST_BOARD}🪙</div>`;
            } else if (item.type === 'locked_storage') {
                c.classList.add('storage-locked');
                c.innerHTML = `<div class="text-xl">🔒</div><div class="text-[9px] font-bold mt-1">💎${item.cost}</div>`;
            } else if (item.type === 'upgrade_mission') {
                const done = genLevels[item.target] >= item.reqLevel;
                const name = item.target === 'cat' ? '캣타워' : '개집';
                c.classList.add('upgrade-mission-cell');
                if (done) c.classList.add('done');
                c.innerHTML = `<div class="text-lg">${done ? '✅' : '🎯'}</div><div class="text-[8px] font-bold text-center">${name}<br>Lv.${item.reqLevel}</div>`;
                c.dataset.missionTarget = item.target;
            } else if (item.type === 'animal_mission') {
                const list = item.target === 'cat' ? CATS : DOGS;
                const targetData = list[item.reqLevel - 1];
                const done =
                    boardState.some((b) => b && b.type === item.target && b.level >= item.reqLevel) ||
                    storageState.some((s) => s && s.type === item.target && s.level >= item.reqLevel);
                c.classList.add('upgrade-mission-cell');
                if (done) c.classList.add('done');
                c.innerHTML = `<div class="text-lg">${done ? '✅' : targetData.emoji}</div><div class="text-[8px] font-bold text-center">${targetData.name}<br>만들기</div>`;
            } else if (item.type === 'quest_count_mission') {
                const done = totalQuestsCompleted >= item.reqCount;
                c.classList.add('upgrade-mission-cell');
                if (done) c.classList.add('done');
                c.innerHTML = `<div class="text-lg">${done ? '✅' : '📋'}</div><div class="text-[8px] font-bold text-center">일반 퀘스트<br>${totalQuestsCompleted}/${item.reqCount}</div>`;
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
        let specialUI = '';
        if (['bird', 'fish', 'reptile', 'toy'].includes(type)) {
            const rem = 6 - (item.clicks || 0);
            if (item.cooldown > Date.now())
                specialUI = `<div class="cooldown-overlay"><span>💤</span><span>${Math.ceil((item.cooldown - Date.now()) / 1000)}s</span></div>`;
            else specialUI = `<div class="usage-badge">${rem}/6</div>`;
        }
        if (type === 'cat') {
            emoji = '🐱';
            label = `캣타워 (Lv.${genLevels.cat})`;
        } else if (type === 'dog') {
            emoji = '🐶';
            label = `개집 (Lv.${genLevels.dog})`;
        } else if (type === 'bird') {
            emoji = '🐦';
            label = '새장';
        } else if (type === 'fish') {
            emoji = '🐠';
            label = '어항';
        } else if (type === 'reptile') {
            emoji = '🦎';
            label = '사육장';
        } else if (type === 'toy') {
            emoji = '🧸';
            label = '장난감 생성기';
        } else if (type === 'legendary') {
            emoji = '🦄';
            label = '목장';
            const rem = 3 - (item.clicks || 0);
            if (item.cooldown > Date.now()) {
                specialUI = `<div class="cooldown-overlay"><span>💤</span><span>${Math.ceil((item.cooldown - Date.now()) / 1000)}s</span></div>`;
            } else {
                specialUI = `<div class="usage-badge">${rem}/3</div>`;
            }
        }
        d.innerHTML = `${specialUI}<div class="animal-inside">${emoji}</div><div class="cage-label">${label}</div><div class="help-btn" data-gen-type="${type}">?</div>`;
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
    else if (item.type === 'legendary') list = LEGENDARIES;
    const data = list[item.level - 1] || list[list.length - 1];
    const itemKey = `${item.type}_${item.level}`;
    const discoveredAt = newlyDiscoveredItems.get(itemKey);
    const isNew = discoveredAt && Date.now() - discoveredAt < 10000;
    const newBadge = isNew ? '<div class="new-badge">NEW</div>' : '';
    d.innerHTML = `<div class="${isSnack || isToy ? 'bg-square' : 'bg-circle'}" style="background-color:${data.color}"></div><div style="font-size:${isSnack || isToy ? '1.5rem' : '2rem'}">${data.emoji}</div><div class="level-badge">Lv.${item.level}</div>${newBadge}`;
    const sellBtn = document.createElement('div');
    sellBtn.className = 'sell-btn';
    sellBtn.innerText = 'ⓒ';
    sellBtn.onclick = (e) => askSellItem(zone, index, e);
    d.appendChild(sellBtn);
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
    updateSpecialMissionUI();
    updateLegendaryQuestUI();
    updateDailyMissionUI();
    updateAlbumBarUI();
    updateDiceTripUI();
    saveGame();
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
    const goal = Math.min(userLevel * 2, 20);
    const reward = Math.ceil(userLevel / 5) * 5;
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

function updateQuestUI() {
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
            else if (r.type.includes('snack')) l = r.type.includes('cat') ? CAT_SNACKS : DOG_SNACKS;
            else if (r.type.includes('toy')) l = r.type.includes('cat') ? CAT_TOYS : DOG_TOYS;
            h += `<div class="req-item" title="Lv.${r.level}"><span class="text-lg">${l[r.level - 1].emoji}</span></div>`;
        });
        const remaining = q.expiresAt ? q.expiresAt - Date.now() : 0;
        const timerText = remaining > 0 ? formatQuestTimer(remaining) : '만료';
        const rewardText = q.cardReward > 0 ? `${q.cardReward}🃏` : `${q.reward}🪙`;
        h += `</div></div><div class="text-[9px] mb-1 text-center"><div class="text-yellow-600">보상: ${rewardText}</div><div class="text-red-500">⏱${timerText}</div></div><div class="quest-btn ${ok ? 'complete' : 'incomplete'}" onclick="${ok ? `completeQuest(${i})` : ''}">${ok ? '완료!' : '구해줘'}</div>`;
        d.innerHTML = h;
        questContainer.appendChild(d);
    });
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
    t.innerText = m;
    t.style.opacity = '1';
    setTimeout(() => (t.style.opacity = '0'), TOAST_DURATION_MS);
}

function showMilestonePopup(t, r) {
    document.getElementById('milestone-text').innerText = t;
    document.getElementById('milestone-reward').innerText = r;
    document.getElementById('milestone-overlay').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('milestone-overlay').style.display = 'none';
    }, MILESTONE_POPUP_MS);
}

function closeOverlay(id) {
    document.getElementById(id).style.display = 'none';
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
        e.target.closest('.sp-btn') ||
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
    dragData.el.style.display = 'none';
    const el = document.elementFromPoint(cx, cy);
    dragData.el.style.display = 'flex';
    const tc = el ? el.closest('.cell') : null;
    if (tc) {
        const tz = tc.dataset.zone,
            ti = parseInt(tc.dataset.index),
            ts = tz === 'board' ? boardState : storageState;
        if (ts[ti] && (ts[ti].type.includes('locked') || ts[ti].type.includes('mission'))) showToast('잠겨있음!');
        else moveItem(dragData.zone, dragData.index, tz, ti);
    }
    dragData = null;
    updateAll();
}

// --- 도감/모달 ---
function openGuide(type) {
    currentGuideType = type;
    document.getElementById('tab-animal').style.display = type === 'toy' ? 'none' : '';
    document.getElementById('tab-snack').style.display = type === 'toy' || !['cat', 'dog'].includes(type) ? 'none' : '';
    document.getElementById('tab-cat_toy').style.display = type === 'toy' ? '' : 'none';
    document.getElementById('tab-dog_toy').style.display = type === 'toy' ? '' : 'none';
    document.getElementById('tab-upgrade').style.display = type === 'toy' ? 'none' : '';
    const defaultTab = type === 'toy' ? 'cat_toy' : 'animal';
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
                    <div class="guide-emoji">${item.emoji}</div>
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
        showToast('최대 레벨!');
        return;
    }
    if (coins < CAGE_UPGRADE_COST) {
        showToast('코인 부족!');
        return;
    }
    coins -= CAGE_UPGRADE_COST;
    genLevels[type]++;
    showToast(`${type === 'cat' ? '캣타워' : '개집'} Lv.${genLevels[type]}!`);
    boardState.forEach((item, idx) => {
        if (item && item.type === 'upgrade_mission' && item.target === type && genLevels[type] >= item.reqLevel) {
            boardState[idx] = null;
            showToast('미션 완료! 칸 해제!');
        }
    });
    updateUpgradeUI();
    updateAll();
}

// --- 일일 미션 UI ---
function updateDailyMissionUI() {
    checkDailyReset();

    if (!dailyMissionsContainer) return;

    // 미션 목록 렌더링
    let html = '';
    DAILY_MISSIONS.forEach((mission, idx) => {
        const progress = dailyMissions[mission.id];
        const target = mission.target;
        const pct = Math.min((progress / target) * 100, 100);
        const done = dailyMissions.claimed[idx];

        html += `
            <div class="flex items-center gap-2">
                <span class="text-[10px] w-20">${mission.icon} ${mission.label}</span>
                <div class="flex-1 h-3 bg-amber-200 rounded-full overflow-hidden">
                    <div class="h-full ${done ? 'bg-green-400' : 'bg-amber-400'} transition-all" style="width:${pct}%"></div>
                </div>
                <span class="text-[9px] w-14 text-right ${done ? 'text-green-600' : 'text-amber-600'} font-bold">
                    ${Math.min(progress, target)}/${target} ${done ? '✓' : ''}
                </span>
                <span class="text-[8px] text-gray-400">(${mission.reward}🪙)</span>
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
