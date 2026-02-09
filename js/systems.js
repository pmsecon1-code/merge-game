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
    addDailyProgress('coins', 500);
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

// --- 주사위 여행 ---
function tryDropDice() {
    if (Math.random() < DICE_DROP_CHANCE) {
        diceCount++;
        showMilestonePopup('🎲 주사위 획득!', `보유: ${diceCount}개`);
        updateDiceTripUI();
        saveGame();
    }
}

function useDice() {
    if (isRollingDice || diceCount <= 0) return;
    diceCount--;
    rollDice();
}

let pendingDiceResult = 0;

function rollDice() {
    isRollingDice = true;
    pendingDiceResult = Math.floor(Math.random() * 6) + 1;

    // 팝업 열기
    const popup = document.getElementById('dice-roll-popup');
    const diceAnim = document.getElementById('dice-anim');
    const resultNum = document.getElementById('dice-result-num');
    const confirmBtn = document.getElementById('dice-confirm-btn');

    popup.classList.add('active');
    diceAnim.classList.add('rolling');
    resultNum.classList.add('slot');
    resultNum.textContent = '?';
    confirmBtn.disabled = true;

    // 숫자 슬롯 효과
    let slotCount = 0;
    const slotInterval = setInterval(() => {
        resultNum.textContent = Math.floor(Math.random() * 6) + 1;
        slotCount++;
    }, 80);

    // 1초 후 결과 표시
    setTimeout(() => {
        clearInterval(slotInterval);
        diceAnim.classList.remove('rolling');
        resultNum.classList.remove('slot');
        resultNum.textContent = pendingDiceResult;
        confirmBtn.disabled = false;
    }, 1000);
}

function confirmDiceRoll() {
    const popup = document.getElementById('dice-roll-popup');
    popup.classList.remove('active');

    moveTripPosition(pendingDiceResult);
    isRollingDice = false;
    updateDiceTripUI();
    saveGame();
}

function moveTripPosition(steps) {
    const newPos = Math.min(diceTripPosition + steps, DICE_TRIP_SIZE);

    // 중간 칸 보상 지급 (이동한 칸들)
    for (let i = diceTripPosition + 1; i <= newPos; i++) {
        if (i < DICE_TRIP_SIZE) {
            giveStepReward(i - 1); // 배열 인덱스는 0부터
        }
    }

    diceTripPosition = newPos;

    // 완주 체크
    if (diceTripPosition >= DICE_TRIP_SIZE) {
        completeTrip();
    }
}

function giveStepReward(pos) {
    const reward = DICE_TRIP_REWARDS[pos];
    if (!reward) return;

    const amount = reward.min + Math.floor(Math.random() * (reward.max - reward.min + 1));

    switch (reward.type) {
        case 'coins':
            coins += amount;
            cumulativeCoins += amount;
            addDailyProgress('coins', amount);
            showFloatText(diceTripBoard, `+${amount}🪙`, '#fbbf24');
            break;
        case 'diamonds':
            diamonds += amount;
            showFloatText(diceTripBoard, `+${amount}💎`, '#06b6d4');
            break;
        case 'cards':
            cards += amount;
            showFloatText(diceTripBoard, `+${amount}🃏`, '#e879f9');
            break;
        case 'energy':
            energy = Math.min(MAX_ENERGY, energy + amount);
            showFloatText(diceTripBoard, `+${amount}⚡`, '#fbbf24');
            break;
    }
    updateUI();
}

function completeTrip() {
    // 완주 보상
    coins += DICE_TRIP_COMPLETE_REWARD.coins;
    cumulativeCoins += DICE_TRIP_COMPLETE_REWARD.coins;
    diamonds += DICE_TRIP_COMPLETE_REWARD.diamonds;
    addDailyProgress('coins', DICE_TRIP_COMPLETE_REWARD.coins);

    showMilestonePopup('🎉 주사위 여행 완주!', `${DICE_TRIP_COMPLETE_REWARD.coins}🪙 + ${DICE_TRIP_COMPLETE_REWARD.diamonds}💎`);

    // 스페셜 케이지 스폰
    spawnSpecialCage();

    // 위치 리셋
    diceTripPosition = 0;
    updateDiceTripUI();
    updateUI();
}

function spawnSpecialCage() {
    // 이미 케이지가 있으면 레벨업
    if (specialCageLevel > 0) {
        if (specialCageLevel < SPECIAL_CAGE_MAX_LEVEL) {
            specialCageLevel++;
            showToast(`🎁 스페셜 케이지 Lv.${specialCageLevel}!`);
        } else {
            showToast('🎁 스페셜 케이지 최대 레벨!');
        }
    } else {
        specialCageLevel = 1;
        showToast('🎁 스페셜 케이지 등장!');
    }
    updateDiceTripUI();
}

function handleSpecialCageClick() {
    if (specialCageLevel <= 0) return;

    // 빈 칸 체크
    const emptyIdx = boardState.findIndex((x) => x === null);
    if (emptyIdx === -1) {
        showToast('공간 부족!');
        return;
    }

    // 레벨에 따른 동물 생성
    const spawnInfo = SPECIAL_CAGE_SPAWNS[specialCageLevel - 1];
    const baseType = Math.random() > 0.5 ? 'cat' : 'dog';
    const level = spawnInfo.minLevel + Math.floor(Math.random() * (spawnInfo.maxLevel - spawnInfo.minLevel + 1));

    boardState[emptyIdx] = { type: baseType, level: level };
    discoverItem(baseType, level);

    const list = baseType === 'cat' ? CATS : DOGS;
    const data = list[level - 1];
    showToast(`🎁 ${data.emoji} ${data.name} 등장!`);

    // 케이지 소멸
    specialCageLevel = 0;
    updateDiceTripUI();
    updateAll();
}

function updateDiceTripUI() {
    if (!diceTripContainer) return;

    // 진행도 표시 (1번 칸부터 시작)
    const posEl = document.getElementById('dice-trip-position');
    if (posEl) {
        posEl.textContent = `${diceTripPosition + 1}/${DICE_TRIP_SIZE}`;
    }

    // 굴리기 버튼 상태
    const rollBtn = document.getElementById('dice-roll-btn');
    if (rollBtn) {
        rollBtn.disabled = diceCount <= 0 || isRollingDice;
        rollBtn.textContent = diceCount > 0 ? `🎲 굴리기 (${diceCount})` : '🎲 주사위 없음';
    }

    // 보드 렌더링
    renderDiceTripBoard();
}

function renderDiceTripBoard() {
    if (!diceTripBoard) return;

    let html = '';

    // 20칸 렌더링
    for (let i = 0; i < DICE_TRIP_SIZE; i++) {
        const isVisited = i < diceTripPosition;
        const isCurrent = i === diceTripPosition;
        const reward = DICE_TRIP_REWARDS[i];
        let rewardIcon = '';
        let rewardAmount = '';
        if (reward) {
            switch (reward.type) {
                case 'coins': rewardIcon = '🪙'; break;
                case 'diamonds': rewardIcon = '💎'; break;
                case 'cards': rewardIcon = '🃏'; break;
                case 'energy': rewardIcon = '⚡'; break;
            }
            rewardAmount = reward.min;
        }

        const rewardDisplay = isCurrent
            ? '🐾'
            : isVisited
                ? '✓'
                : `<span class="reward-icon">${rewardIcon}</span><span class="reward-amount">${rewardAmount}</span>`;

        html += `<div class="dice-step ${isVisited ? 'visited' : ''} ${isCurrent ? 'current' : ''}">
            ${rewardDisplay}
        </div>`;
    }

    // 골인 지점
    html += `<div class="dice-step goal ${diceTripPosition >= DICE_TRIP_SIZE ? 'reached' : ''}">
        🏁
    </div>`;

    // 스페셜 케이지
    if (specialCageLevel > 0) {
        html += `<div class="special-cage-box" onclick="handleSpecialCageClick()">
            <span class="text-2xl">🎁</span>
            <span class="text-[9px] font-bold">Lv.${specialCageLevel}</span>
            <span class="text-[8px] text-gray-400">터치!</span>
        </div>`;
    }

    diceTripBoard.innerHTML = html;
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
