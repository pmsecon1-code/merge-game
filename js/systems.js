// ============================================
// systems.js - 미션, 상점, 구조, 룰렛, 판매
// ============================================

// --- 스페셜 미션 ---
function getSlotUnlockLevel(slotIdx, cycle) {
    return (slotIdx + 1) * 3 + cycle * 9;
}

function updateSpecialMissionUI() {
    const types = ['bird', 'fish', 'reptile'];
    for (let i = 0; i < 3; i++) {
        const unlockLv = getSlotUnlockLevel(i, specialMissionCycles[i]);
        const isActive = userLevel >= unlockLv;
        updateSlot(i, isActive, types[i], unlockLv);
    }
}

function updateSlot(i, isActive, t, unlockLv) {
    const c = document.getElementById(`sp-mission-${i}`),
        txt = document.getElementById(`sp-text-${i}`),
        btn = document.getElementById(`sp-btn-${i}`);
    if (isActive) {
        c.classList.add('active');
        const hasGen = boardState.some((x) => x && x.type === `${t}_generator`);
        const hasMax = boardState.some((x) => x && x.type === t && x.level === 7);
        if (!hasGen && !hasMax) {
            spawnSpecialGenerator(t);
        }
        const nameKo = t === 'bird' ? '새' : t === 'fish' ? '물고기' : '파충류';
        if (hasMax) {
            txt.innerText = '목표달성!';
            btn.style.display = 'block';
        } else {
            txt.innerText = `Lv.7 ${nameKo}\n만들기`;
            btn.style.display = 'none';
        }
    } else {
        c.classList.remove('active');
        txt.innerText = `Lv.${unlockLv}\n오픈`;
        btn.style.display = 'none';
    }
}

function spawnSpecialGenerator(t) {
    const e = boardState.findIndex((x) => x === null);
    if (e !== -1) {
        boardState[e] = { type: `${t}_generator`, clicks: 0, cooldown: 0 };
        renderGrid('board', boardState, boardEl);
        showToast('스페셜 케이지 도착!');
    } else showToast('공간 부족!');
}

function completeSpecialMission(idx) {
    const type = ['bird', 'fish', 'reptile'][idx];
    coins += 500;
    diamonds += 10;
    showToast(`완료! +500🪙 +10💎`);
    for (let i = 0; i < BOARD_SIZE; i++) {
        if (boardState[i] && (boardState[i].type === type || boardState[i].type === `${type}_generator`))
            boardState[i] = null;
    }
    specialMissionCycles[idx]++;
    const nextLv = getSlotUnlockLevel(idx, specialMissionCycles[idx]);
    document.getElementById(`sp-text-${idx}`).innerText = `Lv.${nextLv}\n오픈`;
    document.getElementById(`sp-btn-${idx}`).style.display = 'none';
    for (let i = 0; i < SHOP_SIZE; i++) {
        if (shopItems[i] && shopItems[i].type.includes(type)) shopItems[i] = generateRandomShopItem(getActiveTypes());
    }
    renderShop();
    updateAll();
}

// --- 상시 미션 ---
function addPmProgress(type) {
    if (type !== pmType) return;
    pmProgress++;
    if (pmProgress >= PM_GOALS[pmType]) {
        coins += PM_REWARD;
        showToast(`상시 미션 완료! +${PM_REWARD}🪙`);
        showMilestonePopup(PM_TITLES[pmType] + ' 완료!', `${PM_REWARD} 코인`);
        pmProgress = 0;
        pmType = pmType === 0 ? 1 : 0;
        updateUI();
    }
    updatePmUI();
}

function updatePmUI() {
    const goal = PM_GOALS[pmType];
    document.getElementById('pm-label').innerText = `${PM_ICONS[pmType]} ${PM_TITLES[pmType]}(${PM_REWARD}🪙)`;
    document.getElementById('pm-bar').style.width = `${(pmProgress / goal) * 100}%`;
    document.getElementById('pm-text').innerText = `${pmProgress}/${goal}`;
}

// --- 7행 미션 자동 완료 ---
function checkAutoCompleteMissions() {
    let changed = false;
    boardState.forEach((item, idx) => {
        if (!item) return;
        if (item.type === 'animal_mission') {
            const hasAnimal =
                boardState.some((b) => b && b.type === item.target && b.level >= item.reqLevel) ||
                storageState.some((s) => s && s.type === item.target && s.level >= item.reqLevel);
            if (hasAnimal) {
                const list = item.target === 'cat' ? CATS : DOGS;
                const targetData = list[item.reqLevel - 1];
                boardState[idx] = null;
                showToast(`${targetData.name} 미션 완료! 칸 해제!`);
                changed = true;
            }
        } else if (item.type === 'quest_count_mission') {
            if (totalQuestsCompleted >= item.reqCount) {
                boardState[idx] = null;
                showToast('퀘스트 미션 완료! 칸 해제!');
                changed = true;
            }
        }
    });
    return changed;
}

// --- 누적 코인 ---
function updateSpecialQuestUI() {
    while (cumulativeCoins >= nextSpecialTarget) {
        giveSpecialReward();
        showMilestonePopup('누적 코인 목표 달성!', '50 코인');
        nextSpecialTarget += SPECIAL_QUEST_STEP;
        if (nextSpecialTarget > SPECIAL_QUEST_GOAL) {
            cumulativeCoins = 0;
            nextSpecialTarget = SPECIAL_QUEST_STEP;
            showToast('누적 코인 리셋!');
            break;
        }
    }
    const disp = Math.min(cumulativeCoins, SPECIAL_QUEST_GOAL);
    cumulativeBar.style.width = `${(disp / SPECIAL_QUEST_GOAL) * 100}%`;
    cumulativeText.innerText = `${Math.floor(disp).toLocaleString()} / ${SPECIAL_QUEST_GOAL.toLocaleString()}`;
}

function giveSpecialReward() {
    coins += SPECIAL_QUEST_REWARD_COINS;
    updateUI();
}

function updateRescueQuestUI() {
    if (currentSetRescues >= 3) {
        coins += RESCUE_QUEST_REWARD;
        showToast(`모두 구조 완료! +${RESCUE_QUEST_REWARD}코인`);
        showMilestonePopup('모두 구조 달성!', `${RESCUE_QUEST_REWARD} 코인`);
        currentSetRescues = 0;
        updateUI();
    }
    rescueText.innerText = `${currentSetRescues}/3`;
}

// --- 상점 ---
function startShopTimer() {
    setInterval(() => {
        if (Date.now() >= shopNextRefresh) refreshShop();
        const d = shopNextRefresh - Date.now(),
            m = Math.floor(d / 60000),
            s = Math.floor((d % 60000) / 1000);
        document.getElementById('shop-timer-badge').innerText = `갱신: ${m}:${s.toString().padStart(2, '0')}`;
    }, 1000);
}

function refreshShop() {
    shopNextRefresh = Date.now() + SHOP_REFRESH_MS;
    const t = getActiveTypes();
    for (let i = 0; i < SHOP_SIZE - 2; i++) shopItems[i] = generateRandomShopItem(t);
    shopItems[SHOP_SIZE - 2] = { type: 'card_pack', amount: 20, price: 10 };
    shopItems[SHOP_SIZE - 1] = { type: 'diamond_pack', amount: 10, price: 500 };
    renderShop();
}

function generateRandomShopItem(types) {
    const tb = types[Math.floor(Math.random() * types.length)],
        canSnack = tb === 'cat' || tb === 'dog',
        isS = canSnack && Math.random() < 0.3,
        type = isS ? `${tb}_snack` : tb,
        lv = Math.floor(Math.random() * 5) + 1;
    return { type, level: lv };
}

function renderShop() {
    shopGrid.innerHTML = '';
    shopItems.forEach((item, idx) => {
        const d = document.createElement('div');
        d.className = 'shop-cell';
        if (item) {
            d.onclick = () => buyShopItem(idx);
            if (item.type === 'card_pack') {
                d.innerHTML = `<div class="bg-circle" style="background-color:#f0abfc"></div><div style="font-size:1.2rem">🃏x${item.amount}</div><div class="shop-price-tag">💎${item.price}</div>`;
            } else if (item.type === 'diamond_pack') {
                d.innerHTML = `<div class="bg-circle" style="background-color:#67e8f9"></div><div style="font-size:1.2rem">💎x${item.amount}</div><div class="shop-price-tag" style="color:#fbbf24">🪙${item.price}</div>`;
            } else {
                let list;
                if (item.type.includes('cat'))
                    list = item.type.includes('snack') ? CAT_SNACKS : item.type.includes('toy') ? CAT_TOYS : CATS;
                else if (item.type.includes('dog'))
                    list = item.type.includes('snack') ? DOG_SNACKS : item.type.includes('toy') ? DOG_TOYS : DOGS;
                else if (item.type.includes('bird')) list = BIRDS;
                else if (item.type.includes('fish')) list = FISH;
                else list = REPTILES;
                const data = list[item.level - 1] || list[list.length - 1],
                    isS = item.type.includes('snack'),
                    isT = item.type.includes('toy');
                d.innerHTML = `<div class="${isS || isT ? 'bg-square' : 'bg-circle'}" style="background-color:${data.color}"></div><div style="font-size:1.2rem">${data.emoji}</div><div class="level-badge">Lv.${item.level}</div><div class="shop-price-tag">💎${item.level}</div>`;
            }
        } else d.innerHTML = `<span class="text-xs text-gray-400">품절</span>`;
        shopGrid.appendChild(d);
    });
}

function buyShopItem(idx) {
    const item = shopItems[idx];
    if (!item) return;
    if (item.type === 'card_pack') {
        if (diamonds < item.price) {
            showToast('다이아 부족!');
            return;
        }
        diamonds -= item.price;
        cards += item.amount;
        showToast(`🃏 +${item.amount} 획득!`);
        updateAll();
        return;
    }
    if (item.type === 'diamond_pack') {
        if (coins < item.price) {
            showToast('코인 부족!');
            return;
        }
        coins -= item.price;
        diamonds += item.amount;
        showToast(`💎 +${item.amount} 획득!`);
        updateAll();
        return;
    }
    const p = item.level;
    if (diamonds < p) {
        showToast('다이아 부족!');
        return;
    }
    let tz = 'board',
        eIdx = boardState.findIndex((v) => v === null);
    if (eIdx === -1) {
        const si = storageState.findIndex((v) => v === null);
        if (si !== -1) {
            tz = 'storage';
            eIdx = si;
        }
    }
    if (eIdx === -1) {
        showToast('공간 부족!');
        return;
    }
    diamonds -= p;
    (tz === 'board' ? boardState : storageState)[eIdx] = { ...item };
    discoverItem(item.type, item.level);
    shopItems[idx] = generateRandomShopItem(getActiveTypes());
    showToast('구매 완료!');
    updateAll();
    renderShop();
}

// --- 구조 현장 (아파트) ---
function initApartment() {
    const emojis = ['😿', '🙀'];
    const assigned = [];
    for (let i = 0; i < APARTMENT_ROOMS; i++) {
        let emoji;
        if (i === 2 && assigned[0] === assigned[1]) {
            emoji = assigned[0] === emojis[0] ? emojis[1] : emojis[0];
        } else {
            emoji = emojis[Math.floor(Math.random() * emojis.length)];
        }
        assigned.push(emoji);
        apartmentState[i] = { emoji: emoji, hp: 100, fireHp: 100, rescued: false };
    }
    renderApartment();
}

function startAnimalHPTimer() {
    setInterval(() => {
        let ch = false;
        const helpRooms = [];
        apartmentState.forEach((r, i) => {
            if (r && !r.rescued) {
                const prevHp = r.hp;
                r.hp -= ANIMAL_HP_DECAY;
                if (Math.floor(prevHp / 10) > Math.floor(r.hp / 10) && r.hp > 0) {
                    helpRooms.push(i);
                }
                if (r.hp <= 0) {
                    apartmentState[i] = null;
                    showToast('구조 실패...');
                }
                ch = true;
            }
        });
        if (ch) {
            const allDoneOrNull = apartmentState.every((x) => !x || x.rescued);
            if (allDoneOrNull && apartmentState.some((x) => x === null)) {
                currentSetRescues = 0;
                setTimeout(() => {
                    showToast('새 구조 요청!');
                    initApartment();
                }, 2000);
            } else {
                renderApartment();
                helpRooms.forEach((i) => showHelpBubble(i));
            }
        }
    }, ANIMAL_HP_DECAY_SEC * 1000);
}

function showHelpBubble(roomIdx) {
    const room = apartmentEl.children[roomIdx];
    if (!room) return;
    const bubble = document.createElement('div');
    bubble.className = 'help-bubble';
    bubble.innerText = 'HELP!';
    room.appendChild(bubble);
    setTimeout(() => bubble.remove(), 1500);
}

function renderApartment() {
    apartmentEl.innerHTML = '';
    apartmentState.forEach((r, i) => {
        const d = document.createElement('div');
        d.className = 'apt-room';
        if (r && r.rescued) {
            d.classList.add('rescued');
            const happyEmoji = r.emoji === '😿' ? '😺' : '😸';
            d.innerHTML = `<div class="rescued-badge">✅ 구조 완료</div><div class="text-3xl z-10">${happyEmoji}</div>`;
        } else if (r) {
            d.onclick = () => {
                isTutorialActive = false;
                openRoulette(i);
                renderApartment();
            };
            let html = `<div class="status-badge fire-badge absolute top-1"><span>🔥</span><span>${r.fireHp}</span></div><div class="fire-icon">🔥</div><div class="text-3xl z-10">${r.emoji}</div><div class="status-badge hp-badge absolute bottom-1"><span>❤️</span><span>${r.hp}</span></div><div class="fire-overlay"></div>`;
            if (isTutorialActive) html += `<div class="tutorial-badge">CLICK!</div>`;
            d.innerHTML = html;
        } else {
            d.classList.add('empty');
            d.innerHTML = `<span class="text-gray-500 text-sm">빈 방</span>`;
        }
        apartmentEl.appendChild(d);
    });
}

// --- 룰렛 ---
function openRoulette(i) {
    if (isSpinning) return;
    currentRouletteRoom = i;
    const r = apartmentState[i];
    if (!r) return;
    currentRotation = 0;
    rouletteWheel.style.transition = 'none';
    rouletteWheel.style.transform = 'rotate(0deg)';
    rouletteWheel.offsetHeight;
    renderRouletteLabels();
    updateRoulettePopupUI(r);
    document.getElementById('roulette-err').classList.add('hidden');
    document.getElementById('roulette-popup').style.display = 'flex';
}

function renderRouletteLabels() {
    rouletteWheel.querySelectorAll('.roulette-label').forEach((el) => el.remove());
    const radius = 70;
    ROULETTE_SEGMENTS.forEach((val, idx) => {
        const angle = ((idx * 60 + 30) * Math.PI) / 180;
        const x = 96 + radius * Math.sin(angle);
        const y = 96 - radius * Math.cos(angle);
        const label = document.createElement('div');
        label.className = 'roulette-label';
        label.innerText = val;
        label.style.left = `${x}px`;
        label.style.top = `${y}px`;
        label.style.transform = 'translate(-50%, -50%)';
        rouletteWheel.appendChild(label);
    });
}

function updateRoulettePopupUI(r) {
    const b = document.getElementById('popup-fire-hp-bar'),
        t = document.getElementById('popup-fire-hp-text');
    b.style.width = `${r.fireHp}%`;
    t.innerText = `${r.fireHp}/100`;
    document.getElementById('roulette-coin-val').innerText = coins.toLocaleString();
}

function startSpin() {
    if (isSpinning) return;
    document.getElementById('roulette-err').classList.add('hidden');
    if (coins < FIRE_EXTINGUISH_COST) {
        const e = document.getElementById('roulette-err');
        e.innerText = '코인 부족!';
        e.classList.remove('hidden');
        return;
    }
    if (currentRouletteRoom === -1 || !apartmentState[currentRouletteRoom]) return;
    coins -= FIRE_EXTINGUISH_COST;
    updateUI();
    updateRoulettePopupUI(apartmentState[currentRouletteRoom]);
    isSpinning = true;
    const deg = Math.floor(Math.random() * 360);
    const spins = 360 * 5;
    currentRotation += spins + deg;
    rouletteWheel.style.transition = 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)';
    rouletteWheel.style.transform = `rotate(${currentRotation}deg)`;
    setTimeout(() => finishSpin(currentRotation), 3000);
}

function finishSpin(angle) {
    isSpinning = false;
    const n = angle % 360,
        p = (360 - n) % 360,
        idx = Math.floor(p / 60),
        dmg = ROULETTE_SEGMENTS[idx],
        r = apartmentState[currentRouletteRoom];
    r.fireHp -= dmg;
    showToast(`🔥 불 체력 -${dmg}!`);
    if (r.fireHp <= 0) {
        currentSetRescues++;
        showToast(`구조 성공!`);
        r.rescued = true;
        r.hp = 100;
        closeOverlay('roulette-popup');
        updateRescueQuestUI();
        const allRescued = apartmentState.every((x) => x && x.rescued);
        if (allRescued)
            setTimeout(() => {
                showToast('모든 동물 구조 완료! 새 구조 요청!');
                initApartment();
            }, 2000);
    } else {
        updateRoulettePopupUI(r);
    }
    renderApartment();
    updateUI();
    saveGameNow();
}

// --- 판매 ---
function askSellItem(z, i, e) {
    e.stopPropagation();
    const it = z === 'board' ? boardState[i] : storageState[i];
    if (!it) return;
    sellTarget = { zone: z, index: i, item: it };
    const p = it.level;
    let list;
    if (it.type.includes('cat'))
        list = it.type.includes('snack') ? CAT_SNACKS : it.type.includes('toy') ? CAT_TOYS : CATS;
    else if (it.type.includes('dog'))
        list = it.type.includes('snack') ? DOG_SNACKS : it.type.includes('toy') ? DOG_TOYS : DOGS;
    else if (it.type.includes('bird')) list = BIRDS;
    else if (it.type.includes('fish')) list = FISH;
    else list = REPTILES;
    const n = (list[it.level - 1] || list[list.length - 1]).name;
    document.getElementById('sell-desc').innerText = `'${n} (Lv.${it.level})' - ${p}코인`;
    document.getElementById('sell-popup').style.display = 'flex';
}
