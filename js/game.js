// ============================================
// game.js - 코어 게임 메커닉
// ============================================

// --- 발견 기록 ---
function discoverItem(type, level) {
    const key = `${type}_${level}`;
    const isNew = !discoveredItems.has(key);
    if (isNew) {
        newlyDiscoveredItems.set(key, Date.now());
    }
    discoveredItems.add(key);
    return isNew;
}

// --- 퀘스트 ---
function countEasyQuests() {
    return quests.filter((q) => q.reqs.every((r) => r.level <= 3)).length;
}

function generateNewQuest(forceEasy = false) {
    const needEasy = forceEasy || countEasyQuests() < 2;
    const npc = NPC_AVATARS[Math.floor(Math.random() * NPC_AVATARS.length)];
    const twoItemChance = Math.min(0.3 + userLevel * 0.05, 0.8);
    const cnt = Math.random() < twoItemChance ? 2 : 1;
    const minLv = needEasy ? 4 : Math.min(Math.max(2, Math.floor(userLevel / 2)), 6);
    const maxLvAnimal = needEasy ? 5 : Math.min(minLv + 3 + Math.floor(userLevel / 4), 10);
    const maxLvSnack = needEasy ? 4 : Math.min(Math.ceil(minLv / 2) + 2, 5);
    const reqs = [];
    let sc = 0;
    for (let i = 0; i < cnt; i++) {
        const rand = Math.random();
        const hasToyGen = userLevel >= 5;
        const isSnack = rand < 0.3;
        const isToy = !isSnack && hasToyGen && rand < 0.5;
        const base = Math.random() > 0.5 ? 'cat' : 'dog';
        const type = isSnack ? base + '_snack' : isToy ? base + '_toy' : base;
        const min = isSnack || isToy ? 2 : minLv;
        const max = isSnack || isToy ? maxLvSnack : maxLvAnimal;
        const lv = Math.floor(Math.random() * (max - min + 1)) + min;
        reqs.push({ type, level: lv });
        sc += lv * (isSnack || isToy ? 7 : 5);
    }
    const isCardQuest = Math.random() < ALBUM_CARD_CHANCE;
    const cardReward = isCardQuest
        ? ALBUM_CARD_MIN + Math.floor(Math.random() * (ALBUM_CARD_MAX - ALBUM_CARD_MIN + 1))
        : 0;
    quests.push({
        id: questIdCounter++,
        npc,
        reqs,
        reward: 10 + sc + Math.floor(Math.random() * 5),
        cardReward,
        expiresAt: Date.now() + 10 * 60 * 1000,
    });
    updateQuestUI();
}

function scrollQuests(dir) {
    const maxPage = Math.ceil(quests.length / 3) - 1;
    questPage = Math.max(0, Math.min(maxPage, questPage + dir));
    updateQuestUI();
}

function completeQuest(i) {
    const q = quests[i],
        rem = [...q.reqs];
    const delArr = (arr) => {
        for (let j = 0; j < arr.length; j++) {
            if (rem.length === 0) break;
            const it = arr[j];
            if (it && !it.type.includes('locked') && !it.type.includes('generator')) {
                const idx = rem.findIndex((r) => r.type === it.type && r.level === it.level);
                if (idx !== -1) {
                    arr[j] = null;
                    rem.splice(idx, 1);
                }
            }
        }
    };
    delArr(boardState);
    if (rem.length > 0) delArr(storageState);
    questProgress++;
    totalQuestsCompleted++;
    checkAutoCompleteMissions();
    if (q.cardReward > 0) {
        cards += q.cardReward;
        showToast(`완료! +${q.cardReward}🃏`);
    } else {
        coins += q.reward;
        cumulativeCoins += q.reward;
        showToast(`완료! +${q.reward}코인`);
    }
    if (questProgress >= Math.min(userLevel * 2, 20)) {
        const reward = Math.ceil(userLevel / 5) * 5;
        userLevel++;
        questProgress = 0;
        diamonds += reward;
        document.getElementById('levelup-num').innerText = userLevel;
        document.getElementById('levelup-reward').innerText = reward;
        document.getElementById('levelup-overlay').style.display = 'flex';
        checkToyGeneratorUnlock();
    }
    quests.splice(i, 1);
    generateNewQuest();
    updateRaceProgress();
    updateAll();
}

function checkExpiredQuests() {
    const now = Date.now();
    let changed = false;
    for (let i = quests.length - 1; i >= 0; i--) {
        if (quests[i].expiresAt && now >= quests[i].expiresAt) {
            quests.splice(i, 1);
            generateNewQuest();
            changed = true;
        }
    }
    if (changed) updateQuestUI();
}

function formatQuestTimer(ms) {
    if (ms <= 0) return '0:00';
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// --- 아이템 생성 ---
function spawnItem(baseType, inputLevel = 1, isFree = false) {
    if (!isFree) {
        if (energy <= 0) {
            openEnergyPopup();
            return;
        }
        energy--;
        updateUI();
        updateTimerUI();
        checkEnergyAfterUse();
    }
    const empties = [];
    boardState.forEach((v, i) => {
        if (v === null) empties.push(i);
    });
    if (empties.length === 0) {
        showToast('공간 부족!');
        return;
    }
    let finalType = baseType,
        finalLevel = inputLevel,
        isLucky = false;
    if (inputLevel === 1 && (baseType === 'cat' || baseType === 'dog')) {
        const rand = Math.random(),
            gl = genLevels[baseType];
        const luckChance = 0.05 + (gl - 1) * 0.01;
        if (rand < luckChance) {
            const luckyLv = gl >= 3 ? 4 : gl + 1;
            const isSnack = Math.random() < 0.5;
            if (isSnack) {
                finalType += '_snack';
                finalLevel = Math.min(luckyLv, 5);
            } else {
                finalLevel = luckyLv;
            }
            isLucky = true;
        } else if (rand < luckChance + SNACK_CHANCE) {
            finalType += '_snack';
            finalLevel = 1;
        }
    }
    const genIdx = boardState.findIndex((x) => x && x.type === `${baseType}_generator`);
    const genRow = Math.floor(genIdx / GRID_COLS),
        genCol = genIdx % GRID_COLS;
    empties.sort((a, b) => {
        const aRow = Math.floor(a / GRID_COLS),
            aCol = a % GRID_COLS;
        const bRow = Math.floor(b / GRID_COLS),
            bCol = b % GRID_COLS;
        const aDist = Math.abs(aRow - genRow) + Math.abs(aCol - genCol);
        const bDist = Math.abs(bRow - genRow) + Math.abs(bCol - genCol);
        return aDist - bDist;
    });
    const targetIdx = empties[0];
    boardState[targetIdx] = { type: finalType, level: finalLevel };
    discoverItem(finalType, finalLevel);
    addPmProgress(1);
    renderGrid('board', boardState, boardEl);
    const cell = boardEl.children[targetIdx];
    if (cell && cell.firstChild) {
        cell.firstChild.classList.add('pop-anim');
        setTimeout(() => cell.firstChild.classList.remove('pop-anim'), 400);
    }
    setTimeout(() => {
        spawnItemEffect(cell, isLucky);
    }, 50);
    if (isLucky) {
        showLuckyEffect(cell);
    }
}

function spawnToy() {
    if (energy <= 0) {
        openEnergyPopup();
        return;
    }
    energy--;
    updateUI();
    updateTimerUI();
    checkEnergyAfterUse();
    const empties = [];
    boardState.forEach((v, i) => {
        if (v === null) empties.push(i);
    });
    if (empties.length === 0) {
        showToast('공간 부족!');
        return;
    }
    const base = Math.random() > 0.5 ? 'cat' : 'dog';
    const finalType = base + '_toy';
    const genIdx = boardState.findIndex((x) => x && x.type === 'toy_generator');
    const genRow = Math.floor(genIdx / GRID_COLS),
        genCol = genIdx % GRID_COLS;
    empties.sort((a, b) => {
        const aRow = Math.floor(a / GRID_COLS),
            aCol = a % GRID_COLS;
        const bRow = Math.floor(b / GRID_COLS),
            bCol = b % GRID_COLS;
        return Math.abs(aRow - genRow) + Math.abs(aCol - genCol) - (Math.abs(bRow - genRow) + Math.abs(bCol - genCol));
    });
    const targetIdx = empties[0];
    boardState[targetIdx] = { type: finalType, level: 1 };
    discoverItem(finalType, 1);
    addPmProgress(1);
    renderGrid('board', boardState, boardEl);
    const cell = boardEl.children[targetIdx];
    if (cell && cell.firstChild) {
        cell.firstChild.classList.add('pop-anim');
        setTimeout(() => cell.firstChild.classList.remove('pop-anim'), 400);
    }
    setTimeout(() => {
        spawnItemEffect(cell, false);
    }, 50);
}

// --- 셀 클릭 ---
function handleCellClick(zone, idx) {
    const s = zone === 'board' ? boardState : storageState,
        it = s[idx];
    if (!it) return;
    if (it.type === 'locked_board') {
        if (coins >= UNLOCK_COST_BOARD) {
            coins -= UNLOCK_COST_BOARD;
            s[idx] = null;
            showToast('해제!');
            updateAll();
        } else showToast('코인부족');
    } else if (it.type === 'locked_storage') {
        if (idx > 0 && s[idx - 1]?.type === 'locked_storage') {
            showToast('앞 칸부터!');
            return;
        }
        if (diamonds >= it.cost) {
            diamonds -= it.cost;
            s[idx] = null;
            showToast('확장!');
            updateAll();
        } else showToast('다이아부족');
    } else if (it.type === 'upgrade_mission') {
        const done = genLevels[it.target] >= it.reqLevel;
        if (done) {
            s[idx] = null;
            showToast('미션 완료! 칸 해제!');
            updateAll();
        } else {
            openGuide(it.target);
            switchGuideTab('upgrade');
        }
    } else if (it.type === 'animal_mission') {
        const list = it.target === 'cat' ? CATS : DOGS;
        const targetData = list[it.reqLevel - 1];
        const done =
            boardState.some((b) => b && b.type === it.target && b.level >= it.reqLevel) ||
            storageState.some((st) => st && st.type === it.target && st.level >= it.reqLevel);
        if (done) {
            s[idx] = null;
            showToast(`${targetData.name} 미션 완료! 칸 해제!`);
            updateAll();
        } else {
            showToast(`${targetData.name}를 만들어주세요!`);
        }
    } else if (it.type === 'quest_count_mission') {
        const done = totalQuestsCompleted >= it.reqCount;
        if (done) {
            s[idx] = null;
            showToast('퀘스트 미션 완료! 칸 해제!');
            updateAll();
        } else {
            showToast(`일반 퀘스트 ${totalQuestsCompleted}/${it.reqCount} 완료`);
        }
    } else if (it.type.includes('generator')) triggerGen(idx, it);
}

function triggerGen(idx, item) {
    const cell = boardEl.children[idx],
        cage = cell.querySelector('.cage-generator');
    if (cage) {
        cage.classList.add('cage-shake');
        setTimeout(() => cage.classList.remove('cage-shake'), 300);
        spawnParticles(cell);
    }
    const baseType = item.type.replace('_generator', '');
    if (['bird', 'fish', 'reptile'].includes(baseType)) {
        if (item.cooldown > Date.now()) {
            showToast('과열!');
            return;
        }
        if (energy <= 0) {
            openEnergyPopup();
            return;
        }
        item.clicks = (item.clicks || 0) + 1;
        if (item.clicks >= 6) {
            item.cooldown = Date.now() + 60000;
            item.clicks = 0;
            showToast('과열! 1분 휴식');
        }
        spawnItem(baseType, 1, false);
    } else if (baseType === 'toy') {
        if (item.cooldown > Date.now()) {
            showToast('과열!');
            return;
        }
        if (energy <= 0) {
            openEnergyPopup();
            return;
        }
        item.clicks = (item.clicks || 0) + 1;
        if (item.clicks >= 6) {
            item.cooldown = Date.now() + 60000;
            item.clicks = 0;
            showToast('과열! 1분 휴식');
        }
        spawnToy();
    } else spawnItem(baseType, 1, false);
}

// --- 에너지 ---
function getEnergyPrice() {
    if (Date.now() >= energyPurchaseResetTime) {
        energyPurchaseCount = 0;
        energyPurchaseResetTime = Date.now() + 3 * 60 * 60 * 1000;
    }
    return 500 + energyPurchaseCount * 100;
}

function checkEnergyAfterUse() {
    if (energy <= 0) {
        if (!firstEnergyRewardGiven) {
            firstEnergyRewardGiven = true;
            energy = MAX_ENERGY;
            recoveryCountdown = RECOVERY_SEC;
            showToast('🎁 첫 에너지 소진 보상! +100⚡');
            updateUI();
            updateTimerUI();
            saveGame();
        } else {
            openEnergyPopup();
        }
    }
}

function openEnergyPopup() {
    const price = getEnergyPrice();
    document.getElementById('popup-coin-val').innerText = coins.toLocaleString();
    document.getElementById('energy-price').innerText = price;
    updateEnergyPopupTimer();
    document.getElementById('energy-err').classList.add('hidden');
    document.getElementById('energy-popup').style.display = 'flex';
    if (energyPopupTimer) clearInterval(energyPopupTimer);
    energyPopupTimer = setInterval(updateEnergyPopupTimer, 1000);
}

function closeEnergyPopup() {
    if (energyPopupTimer) {
        clearInterval(energyPopupTimer);
        energyPopupTimer = null;
    }
    closeOverlay('energy-popup');
}

function buyEnergy() {
    const price = getEnergyPrice();
    document.getElementById('energy-err').classList.add('hidden');
    if (coins >= price) {
        coins -= price;
        energy = MAX_ENERGY;
        recoveryCountdown = RECOVERY_SEC;
        energyPurchaseCount++;
        closeEnergyPopup();
        showToast('충전 완료!');
        updateUI();
        updateTimerUI();
        saveGame();
    } else {
        document.getElementById('energy-err').innerText = '코인 부족!';
        document.getElementById('energy-err').classList.remove('hidden');
    }
}

// --- 활성 타입 ---
function getActiveTypes() {
    const t = [];
    if (boardState.some((i) => i && i.type === 'cat_generator')) t.push('cat');
    if (boardState.some((i) => i && i.type === 'dog_generator')) t.push('dog');
    ['bird', 'fish', 'reptile'].forEach((x) => {
        if (boardState.some((i) => i && i.type === `${x}_generator`)) t.push(x);
    });
    if (t.length === 0) t.push('cat', 'dog');
    return t;
}

function checkToyGeneratorUnlock() {
    if (userLevel >= 5 && !boardState.some((x) => x && x.type === 'toy_generator')) {
        const e = boardState.findIndex((x) => x === null);
        if (e !== -1) {
            boardState[e] = { type: 'toy_generator', clicks: 0, cooldown: 0 };
            renderGrid('board', boardState, boardEl);
            showToast('🧸 장난감 생성기 해제!');
        }
    }
}

// --- 아이템 이동/합성 ---
function moveItem(fz, fi, tz, ti) {
    if (fz === tz && fi === ti) return;
    const ss = fz === 'board' ? boardState : storageState,
        ts = tz === 'board' ? boardState : storageState;
    const fIt = ss[fi],
        tIt = ts[ti];
    if (!tIt) {
        ts[ti] = fIt;
        ss[fi] = null;
        return;
    }
    if (fIt.type === tIt.type && fIt.level === tIt.level) {
        let max = 11;
        if (fIt.type.includes('snack') || fIt.type.includes('toy')) max = 5;
        if (['bird', 'fish', 'reptile'].includes(fIt.type)) max = 7;
        if (fIt.level < max) {
            const newLv = fIt.level + 1;
            ts[ti] = { type: fIt.type, level: newLv };
            ss[fi] = null;
            discoverItem(fIt.type, newLv);
            addPmProgress(0);
            checkAutoCompleteMissions();
            const cell = (tz === 'board' ? boardEl : storageEl).children[ti];
            setTimeout(() => {
                showFloatText(cell, 'UP!', '#f43f5e');
            }, 50);
        } else {
            ts[ti] = fIt;
            ss[fi] = tIt;
        }
    } else {
        ts[ti] = fIt;
        ss[fi] = tIt;
    }
}

// --- 일일 보너스 ---
function checkDailyBonus() {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    if (lastDailyBonusDate === today) return;
    lastDailyBonusDate = today;
    coins += DAILY_BONUS.coins;
    cumulativeCoins += DAILY_BONUS.coins;
    diamonds += DAILY_BONUS.diamonds;
    cards += DAILY_BONUS.cards;
    showMilestonePopup('🎁 일일 보너스!', `${DAILY_BONUS.coins}🪙 ${DAILY_BONUS.diamonds}💎 ${DAILY_BONUS.cards}🃏`);
    saveGame();
}
