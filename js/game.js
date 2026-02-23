// ============================================
// game.js - 코어 게임 메커닉
// ============================================

// --- 코인 추가 헬퍼 ---
function addCoins(amount) {
    coins += amount;
    cumulativeCoins += amount;
    addDailyProgress('coins', amount);
}

// --- 저금통 스폰 헬퍼 ---
function spawnPiggyBank(toastPrefix, minCoins = PIGGY_BANK_MIN_COINS, maxCoins = PIGGY_BANK_MAX_COINS) {
    const piggyCoins = minCoins + Math.floor(Math.random() * (maxCoins - minCoins + 1));
    const piggyIdx = boardState.findIndex((x, i) => x === null && i < BOARD_MISSION_START);
    if (piggyIdx !== -1) {
        boardState[piggyIdx] = { type: 'piggy_bank', coins: piggyCoins, openAt: Date.now() + PIGGY_BANK_TIMER_MS };
        showToast(`${toastPrefix}${ICON.piggy} 저금통 획득!`);
    } else {
        addCoins(piggyCoins);
        showToast(`보드 가득! +${piggyCoins}${ICON.coin}`);
    }
}

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
    return quests.filter((q) => q.reqs.every((r) => r.level <= 4)).length;
}

function generateNewQuest(forceEasy = false) {
    const needEasy = forceEasy || userLevel <= 5 || countEasyQuests() < 2;
    const npc = NPC_AVATARS[Math.floor(Math.random() * NPC_AVATARS.length)];
    const twoItemChance = Math.min(QUEST_MULTI_BASE_CHANCE + userLevel * QUEST_MULTI_LEVEL_FACTOR, QUEST_MULTI_MAX_CHANCE);
    const cnt = Math.random() < twoItemChance ? 2 : 1;
    const minLv = needEasy ? 4 : Math.min(5 + Math.floor(userLevel / 20), 9);
    const maxLvAnimal = needEasy ? 5 : Math.min(minLv + 3 + Math.floor(userLevel / 4), 11);
    const maxLvSnack = needEasy ? 3 : Math.min(Math.ceil(minLv / 2) + 2, 5);
    const reqs = [];
    let sc = 0;
    for (let i = 0; i < cnt; i++) {
        const rand = Math.random();
        const hasToyGen = userLevel >= 5;
        const isSnack = rand < QUEST_SNACK_CHANCE;
        const isToy = !isSnack && hasToyGen && rand < 0.5;
        const base = Math.random() > 0.5 ? 'cat' : 'dog';
        const type = isSnack ? base + '_snack' : isToy ? base + '_toy' : base;
        const min = isSnack || isToy ? 2 : minLv;
        const max = isSnack || isToy ? maxLvSnack : maxLvAnimal;
        const lv = Math.floor(Math.random() * (max - min + 1)) + min;
        reqs.push({ type, level: lv });
        sc += Math.max(30, Math.pow(2, lv - 3));
    }
    const isPiggyQuest = sc >= 200 || (needEasy && Math.random() < QUEST_PIGGY_CHANCE);
    const isCardQuest = !isPiggyQuest && userLevel >= 3 && Math.random() < ALBUM_CARD_CHANCE;
    const cardReward = isCardQuest
        ? ALBUM_CARD_MIN + Math.floor(Math.random() * (ALBUM_CARD_MAX - ALBUM_CARD_MIN + 1))
        : 0;
    const questObj = {
        id: questIdCounter++,
        npc,
        reqs,
        reward: sc,
        cardReward,
        piggyReward: isPiggyQuest,
        expiresAt: Date.now() + QUEST_EXPIRE_MS,
    };
    // 스페셜 퀘스트가 있으면 그 앞에 삽입
    const spIdx = quests.findIndex((q) => q.isSpecial);
    if (spIdx !== -1) {
        quests.splice(spIdx, 0, questObj);
    } else {
        quests.push(questObj);
    }
}

// --- 스페셜 퀘스트 ---
function generateSpecialQuest() {
    if (userLevel < 2) return null;
    const types = ['bird', 'fish', 'reptile'];
    const npcImgs = ['images/birds/bird1.png', 'images/fish/fish1.png', 'images/reptiles/reptile1.png'];
    const idx = currentSpecialIndex;
    return {
        id: questIdCounter++,
        npc: npcImgs[idx],
        reqs: [{ type: types[idx], level: 7 }],
        reward: SPECIAL_QUEST_REWARD,
        cardReward: 0,
        expiresAt: null,
        isSpecial: true,
        specialIndex: idx,
    };
}

function trySpawnSpecialGenerator() {
    const sq = quests.find((q) => q.isSpecial);
    if (!sq) return;
    const type = sq.reqs[0].type;
    const hasGen = hasItemOfType(`${type}_generator`);
    const hasMax = hasItemOfTypeAndLevel(type, 7);
    if (hasGen || hasMax) return;
    const emptyIdx = boardState.findIndex((x) => x === null);
    if (emptyIdx !== -1) {
        boardState[emptyIdx] = { type: `${type}_generator`, clicks: 0, cooldown: 0 };
        renderGrid('board', boardState, boardEl);
        showToast('스페셜 케이지 도착!');
    }
}

// --- 퀘스트 아이템 제거 헬퍼 ---
function removeQuestItems(reqs) {
    const rem = [...reqs];
    const del = (arr) => {
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
    del(boardState);
    if (rem.length > 0) del(storageState);
}

// --- 레벨업 처리 ---
function handleLevelUp() {
    if (questProgress < getLevelUpGoal(userLevel)) return;
    const reward = getLevelUpReward(userLevel);
    userLevel++;
    questProgress = 0;
    diamonds += reward;
    document.getElementById('levelup-num').innerText = userLevel;
    document.getElementById('levelup-reward').innerText = reward;
    openOverlay('levelup-overlay');
    playSound('levelup');
    spawnLevelupConfetti();
    // 다이아 보상 아이콘 날아가기
    const lvOverlay = document.getElementById('levelup-overlay');
    if (lvOverlay) flyRewardToStatusBar(lvOverlay, 'diamond');
    setTimeout(() => closeOverlay('levelup-overlay'), 2000);
    checkToyGeneratorUnlock();
    // 레벨업 후 스페셜 퀘스트 추가 체크 (10개 상한)
    if (!quests.some((qq) => qq.isSpecial) && quests.length < 10) {
        const sp = generateSpecialQuest();
        if (sp) quests.push(sp);
    }
    // 레벨업 후 스토리 퀘스트 체크
    checkStoryQuests();
}

function completeQuest(i) {
    const q = quests[i];

    if (q.isStory) {
        // --- 스토리 퀘스트 완료 ---
        removeQuestItems(q.reqs);
        playSound('quest_complete');
        quests.splice(i, 1);
        questProgress++;
        totalQuestsCompleted++;
        checkAutoCompleteMissions();
        handleLevelUp();
        completeImageQuest(q.storyImageId);
        updateAll();
        return;
    }

    if (q.isSpecial) {
        // --- 스페셜 퀘스트 완료 ---
        const type = q.reqs[0].type;
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (boardState[j] && (boardState[j].type === type || boardState[j].type === `${type}_generator`))
                boardState[j] = null;
        }
        for (let j = 0; j < STORAGE_SIZE; j++) {
            if (storageState[j] && (storageState[j].type === type || storageState[j].type === `${type}_generator`))
                storageState[j] = null;
        }
        for (let j = 0; j < SHOP_SIZE; j++) {
            if (shopItems[j] && shopItems[j].type && shopItems[j].type.includes(type))
                shopItems[j] = generateRandomShopItem(getActiveTypes());
        }
        renderShop();
        spawnPiggyBank('');
        playSound('quest_complete');
    } else {
        // --- 일반 퀘스트 완료 ---
        removeQuestItems(q.reqs);
        // B3. 퀘스트 카드에 체크마크 오버레이
        const questCard = questContainer.children[i];
        if (questCard) {
            const checkEl = document.createElement('div');
            checkEl.className = 'quest-complete-check';
            checkEl.innerHTML = '<img src="images/icons/check.png" class="icon icon-lg">';
            questCard.appendChild(checkEl);
        }
        if (q.piggyReward) {
            if (q.reward >= 200) {
                spawnPiggyBank('완료! ');
            } else {
                spawnPiggyBank('완료! ', 50, 100);
            }
        } else if (q.cardReward > 0) {
            cards += q.cardReward;
            showToast(`완료! +${q.cardReward}${ICON.card}`);
            if (questCard) flyRewardToStatusBar(questCard, 'card');
        } else {
            addCoins(q.reward);
            showToast(`완료! +${q.reward}${ICON.coin}`);
            if (questCard) flyRewardToStatusBar(questCard, 'coin');
        }
        playSound('quest_complete');
    }

    // --- 공통: 진행도 ---
    questProgress++;
    totalQuestsCompleted++;
    checkAutoCompleteMissions();
    handleLevelUp();

    // 퀘스트 제거 및 새 퀘스트 생성
    quests.splice(i, 1);
    if (q.isSpecial) {
        currentSpecialIndex = (currentSpecialIndex + 1) % 3;
        const newSp = generateSpecialQuest();
        if (newSp) quests.push(newSp);
    } else {
        generateNewQuest();
    }

    updateRaceProgress();
    updateAll({ scrollQuestToFront: true });
    // 튜토리얼 Step 4 퀘스트 완료 훅
    if (tutorialStep === 4) {
        setTimeout(() => advanceTutorial(), 200);
    }
}

function checkExpiredQuests() {
    if (tutorialStep > 0) return; // 튜토리얼 중 만료 스킵
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
    return formatMinSec(ms);
}

// --- 아이템 생성 ---
function spawnItem(baseType, inputLevel = 1, isFree = false) {
    // 빈 칸 먼저 체크
    const empties = [];
    boardState.forEach((v, i) => {
        if (v === null) empties.push(i);
    });
    if (empties.length === 0) {
        showError('공간 부족!');
        return false;
    }
    // 에너지 소비
    if (!isFree) {
        if (energy <= 0) {
            openEnergyPopup();
            return false;
        }
        energy--;
        updateUI();
        updateTimerUI();
        checkEnergyAfterUse();
    }
    let finalType = baseType,
        finalLevel = inputLevel,
        isLucky = false;
    if (inputLevel === 1 && (baseType === 'cat' || baseType === 'dog') && tutorialStep <= 0) {
        const rand = Math.random(),
            gl = genLevels[baseType];
        const luckChance = LUCKY_BASE_CHANCE + (gl - 1) * LUCKY_LEVEL_BONUS;
        if (rand < luckChance) {
            const luckyLv = gl >= 3 ? 4 : gl + 1;
            const isSnack = Math.random() < LUCKY_SNACK_CHANCE;
            if (isSnack) {
                finalType += '_snack';
                finalLevel = Math.min(luckyLv, 3);
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
    addDailyProgress('spawn');
    renderGrid('board', boardState, boardEl);
    playSound('spawn');
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
    return true;
}

function spawnToy() {
    // 빈 칸 먼저 체크
    const empties = [];
    boardState.forEach((v, i) => {
        if (v === null) empties.push(i);
    });
    if (empties.length === 0) {
        showError('공간 부족!');
        return false;
    }
    // 에너지 소비
    if (energy <= 0) {
        openEnergyPopup();
        return false;
    }
    energy--;
    updateUI();
    updateTimerUI();
    checkEnergyAfterUse();
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
    addDailyProgress('spawn');
    playSound('spawn');
    renderGrid('board', boardState, boardEl);
    const cell = boardEl.children[targetIdx];
    if (cell && cell.firstChild) {
        cell.firstChild.classList.add('pop-anim');
        setTimeout(() => cell.firstChild.classList.remove('pop-anim'), 400);
    }
    setTimeout(() => {
        spawnItemEffect(cell, false);
    }, 50);
    return true;
}

// --- 셀 클릭 헬퍼: 잠긴 셀 ---
function handleLockedCell(zone, idx, it) {
    const s = zone === 'board' ? boardState : storageState;
    if (it.type === 'locked_board') {
        if (coins >= UNLOCK_COST_BOARD) {
            coins -= UNLOCK_COST_BOARD;
            s[idx] = null;
            playSound('purchase');
            showToast('해제!');
            updateAll();
        } else { showError('코인 부족!'); }
    } else {
        openAdPopup('storage', idx);
    }
}

// --- 셀 클릭 헬퍼: 미션 셀 ---
function handleMissionCell(zone, idx, it) {
    const s = zone === 'board' ? boardState : storageState;
    if (it.type === 'upgrade_mission') {
        const done = genLevels[it.target] >= it.reqLevel;
        if (done) {
            s[idx] = null;
            playSound('milestone');
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
            playSound('milestone');
            showToast(`${targetData.name} 미션 완료! 칸 해제!`);
            updateAll();
        } else {
            openGuideForItem(it.target, it.reqLevel);
        }
    } else if (it.type === 'quest_count_mission') {
        const done = totalQuestsCompleted >= it.reqCount;
        if (done) {
            s[idx] = null;
            playSound('milestone');
            showToast('퀘스트 미션 완료! 칸 해제!');
            updateAll();
        } else {
            showToast(`퀘스트 ${totalQuestsCompleted}/${it.reqCount} 완료`);
        }
    }
}

// --- 셀 클릭 헬퍼: 특수 아이템 ---
function handleSpecialItem(zone, idx, it) {
    const s = zone === 'board' ? boardState : storageState;
    if (it.type === 'bubble') {
        if (Date.now() >= it.expiresAt) {
            s[idx] = null;
            const cell = zone === 'board' ? boardEl.children[idx] : storageEl.children[idx];
            if (cell) spawnParticles(cell);
            playSound('error');
            showToast('버블이 사라졌어요!');
            updateAll();
        } else {
            playSound('click');
            showBubblePopup(zone, idx);
        }
    } else if (it.type === 'boss') {
        const bossData = storyProgress.bosses.find(b => b.bossId === it.bossId);
        const imgData = STORY_IMAGES.find(i => i.ep === it.bossId && i.isLastInEp);
        if (bossData) showBossInfoPopup(bossData, imgData);
    } else if (it.type === 'piggy_bank') {
        if (Date.now() >= it.openAt) {
            const cell = zone === 'board' ? boardEl.children[idx] : storageEl.children[idx];
            addCoins(it.coins);
            s[idx] = null;
            playSound('piggy_open');
            showMilestonePopup(`${ICON.piggy} 저금통 개봉!`, `+${it.coins}${ICON.coin}`);
            if (cell) flyRewardToStatusBar(cell, 'coin');
            updateAll();
        } else {
            const rem = it.openAt - Date.now();
            const m = Math.floor(rem / 60000);
            const sec = Math.floor((rem % 60000) / 1000);
            showError(`${ICON.lock} ${m}분 ${sec}초 후 개봉 가능`);
        }
    }
}

// --- 셀 클릭 ---
function handleCellClick(zone, idx) {
    if (tutorialStep > 0 && !isTutorialClickAllowed(zone, idx)) return;
    const s = zone === 'board' ? boardState : storageState,
        it = s[idx];
    if (!it) return;
    if (it.type === 'locked_board' || it.type === 'locked_storage') {
        handleLockedCell(zone, idx, it);
    } else if (it.type.includes('mission')) {
        handleMissionCell(zone, idx, it);
    } else if (it.type === 'bubble' || it.type === 'boss' || it.type === 'piggy_bank') {
        handleSpecialItem(zone, idx, it);
    } else if (it.type.includes('generator')) {
        triggerGen(idx, it);
    }
}

function triggerGen(idx, item) {
    const cell = boardEl.children[idx],
        cage = cell.querySelector('.cage-generator');
    const baseType = item.type.replace('_generator', '');
    if (['bird', 'fish', 'reptile', 'dinosaur'].includes(baseType)) {
        if (item.cooldown > Date.now()) {
            openCooldownPopup(idx, item);
            return;
        }
        if (!spawnItem(baseType, 1, false)) return;
        item.clicks = (item.clicks || 0) + 1;
        if (item.clicks >= GENERATOR_MAX_CLICKS) {
            const cd = getSpecialCooldown(baseType);
            item.cooldown = Date.now() + cd;
            item.clicks = 0;
            showToast(`과열! ${Math.ceil(cd / 60000)}분 휴식`);
        }
    } else if (baseType === 'toy') {
        if (item.cooldown > Date.now()) {
            openCooldownPopup(idx, item);
            return;
        }
        if (!spawnToy()) return;
        item.clicks = (item.clicks || 0) + 1;
        if (item.clicks >= GENERATOR_MAX_CLICKS) {
            item.cooldown = Date.now() + GENERATOR_COOLDOWN_MS;
            item.clicks = 0;
            showToast('과열! 1분 휴식');
        }
    } else {
        const prevEmpty = boardState.filter((x) => x === null).length;
        if (!spawnItem(baseType, 1, false)) return;
        // 튜토리얼: 실제 생성된 경우만 진행
        if ((tutorialStep === 1 || tutorialStep === 2) && boardState.filter((x) => x === null).length < prevEmpty) {
            setTimeout(() => advanceTutorial(), 200);
        }
    }
    // 성공 시에만 파티클/흔들림 재생
    if (cage) {
        cage.classList.add('cage-shake');
        setTimeout(() => cage.classList.remove('cage-shake'), 300);
        spawnParticles(cell);
    }
}

// --- 쿨다운 즉시 해제 ---
function openCooldownPopup(idx, item) {
    const remaining = Math.max(0, item.cooldown - Date.now());
    const cost = Math.ceil(remaining / 1000) * COOLDOWN_COIN_PER_SEC;
    document.getElementById('cooldown-cost-val').textContent = cost.toLocaleString();
    document.getElementById('cooldown-remain-val').textContent = formatMinSec(remaining);
    const popup = document.getElementById('cooldown-popup');
    popup.dataset.idx = idx;
    openOverlay('cooldown-popup');
}

function confirmCooldownReset() {
    const popup = document.getElementById('cooldown-popup');
    const idx = parseInt(popup.dataset.idx, 10);
    const item = boardState[idx];
    if (!item || !item.cooldown || item.cooldown <= Date.now()) {
        closeOverlay('cooldown-popup');
        return;
    }
    const remaining = Math.max(0, item.cooldown - Date.now());
    const cost = Math.ceil(remaining / 1000) * COOLDOWN_COIN_PER_SEC;
    if (coins < cost) {
        showError('코인 부족!');
        closeOverlay('cooldown-popup');
        return;
    }
    coins -= cost;
    item.cooldown = 0;
    item.clicks = 0;
    playSound('purchase');
    showToast(`쿨다운 해제! -${cost.toLocaleString()}${ICON.coin}`);
    closeOverlay('cooldown-popup');
    updateAll();
}

// --- 에너지 ---
function getEnergyPrice() {
    if (Date.now() >= energyPurchaseResetTime) {
        energyPurchaseCount = 0;
        energyPurchaseResetTime = Date.now() + getMsUntilKSTMidnight();
    }
    return 500 + energyPurchaseCount * 100;
}

function checkEnergyAfterUse() {
    if (energy <= 0) {
        if (!firstEnergyRewardGiven) {
            firstEnergyRewardGiven = true;
            energy = MAX_ENERGY;
            energyRecoverAt = Date.now() + RECOVERY_SEC * 1000;
            playSound('milestone');
            showToast(`${ICON.gift} 첫 에너지 소진 보상! +100${ICON.energy}`);
            updateUI();
            updateTimerUI();
            saveGame();
        } else {
            openEnergyPopup();
        }
    }
}

function openEnergyPopup() {
    playSound('click');
    const price = getEnergyPrice();
    document.getElementById('popup-coin-val').innerText = coins.toLocaleString();
    document.getElementById('energy-price').innerText = price;
    updateEnergyPopupTimer();
    document.getElementById('energy-err').classList.add('hidden');
    openOverlay('energy-popup');
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
        energyRecoverAt = Date.now() + RECOVERY_SEC * 1000;
        energyPurchaseCount++;
        const popup = document.getElementById('energy-popup');
        closeEnergyPopup();
        playSound('purchase');
        showToast('충전 완료!');
        if (popup) flyRewardToStatusBar(popup, 'energy');
        updateUI();
        updateTimerUI();
        saveGame();
    } else {
        playSound('error');
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
            playSound('milestone');
            showToast('🧸 장난감 생성기 해제!');
        }
    }
}

// --- 합성 헬퍼 ---
function tryMergeItems(ss, fi, fIt, ts, ti, tIt, tz) {
    const max = getMaxLevel(fIt.type);
    if (fIt.level >= max) {
        playSound('error');
        ts[ti] = fIt;
        ss[fi] = tIt;
        return;
    }
    const newLv = fIt.level + 1;
    ts[ti] = { type: fIt.type, level: newLv };
    ss[fi] = null;
    discoverItem(fIt.type, newLv);
    addDailyProgress('merge');
    playSound('merge');
    checkAutoCompleteMissions();
    const cell = (tz === 'board' ? boardEl : storageEl).children[ti];
    if (tz === 'board') lastMergedIndex = ti;
    // 합성 이펙트 시퀀스
    if (cell) {
        cell.classList.add('merge-punch');
        setTimeout(() => cell.classList.remove('merge-punch'), 300);
        spawnParticles(cell, newLv);
        spawnItemEffect(cell, false);
        screenShake(newLv * 0.5);
    }
    setTimeout(() => { showFloatText(cell, `Lv.${newLv}!`, '#f43f5e'); }, 50);
    if (tutorialStep <= 0) tryDropDice();
    dealBoardBossDamage(newLv);
    const isSpecialType = ['bird', 'fish', 'reptile', 'dinosaur'].includes(fIt.type);
    if (newLv >= BUBBLE_MIN_LEVEL && tutorialStep <= 0 && !isSpecialType && Math.random() < BUBBLE_CHANCE) {
        spawnBubble(fIt.type, newLv);
    }
    if (tutorialStep === 3) setTimeout(() => advanceTutorial(), 200);
}

// --- 보스 boardIdx 갱신 헬퍼 ---
function updateBossIdx(item, zone, newIdx) {
    if (item.type === 'boss' && zone === 'board') {
        const boss = storyProgress.bosses.find(b => b.bossId === item.bossId);
        if (boss) boss.boardIdx = newIdx;
    }
}

// --- 아이템 이동/합성 ---
function moveItem(fz, fi, tz, ti) {
    if (fz === tz && fi === ti) return;
    const ss = fz === 'board' ? boardState : storageState,
        ts = tz === 'board' ? boardState : storageState;
    const fIt = ss[fi],
        tIt = ts[ti];
    // 보드 전용 아이템: 창고 이동 차단
    if (fIt.type === 'boss' && tz === 'storage') { showError('보스는 보드에서만 이동할 수 있어요!'); return; }
    if (fIt.type === 'bubble' && tz === 'storage') { showError('버블은 이동할 수 없어요!'); return; }
    // 빈 칸 이동
    if (!tIt) {
        ts[ti] = fIt; ss[fi] = null;
        updateBossIdx(fIt, tz, ti);
        return;
    }
    // 대상 보드 전용 아이템: 창고 이동 차단
    if (tIt.type === 'boss' && fz === 'storage') { showError('보스는 보드에서만 이동할 수 있어요!'); return; }
    if (tIt.type === 'bubble' && fz === 'storage') { showError('버블은 이동할 수 없어요!'); return; }
    // 합성 불가 아이템 → 위치 교환
    if (fIt.type === 'piggy_bank' || tIt.type === 'piggy_bank' || fIt.type === 'boss' || tIt.type === 'boss' || fIt.type === 'bubble' || tIt.type === 'bubble') {
        ts[ti] = fIt; ss[fi] = tIt;
        updateBossIdx(fIt, tz, ti);
        updateBossIdx(tIt, fz, fi);
        return;
    }
    // 같은 타입+레벨 → 합성 시도
    if (fIt.type === tIt.type && fIt.level === tIt.level) {
        tryMergeItems(ss, fi, fIt, ts, ti, tIt, tz);
    } else {
        // 다른 아이템 → 위치 교환
        ts[ti] = fIt; ss[fi] = tIt;
    }
}

// --- 일일 미션 ---
function checkDailyReset() {
    const today = getKSTDateString();
    if (dailyMissions.lastResetDate === today) return;

    // 리셋
    dailyMissions = {
        tier: 0,
        merge: 0,
        spawn: 0,
        coins: 0,
        claimed: [false, false, false],
        bonusClaimed: false,
        lastResetDate: today,
    };
    updateDailyMissionUI();
    saveGame();
}

function addDailyProgress(type, amount = 1) {
    checkDailyReset();
    if (type === 'merge') dailyMissions.merge += amount;
    else if (type === 'spawn') dailyMissions.spawn += amount;
    else if (type === 'coins') dailyMissions.coins += amount;

    checkDailyMissionComplete(type);
    updateDailyMissionUI();
}

function checkDailyMissionComplete(type) {
    const tier = dailyMissions.tier;
    if (tier >= 3) return; // 모든 단계 완료

    const missions = DAILY_MISSIONS[tier];
    const idx = missions.findIndex((m) => m.id === type);
    if (idx === -1) return;

    const mission = missions[idx];
    const progress = dailyMissions[type];

    if (progress >= mission.target && !dailyMissions.claimed[idx]) {
        dailyMissions.claimed[idx] = true;
        coins += mission.reward;
        playSound('quest_complete');
        showToast(`${mission.icon} ${mission.label} 완료! +${mission.reward}${ICON.coin}`);

        // 현재 단계 올클리어 → 다음 단계 승급
        if (dailyMissions.claimed.every((c) => c)) {
            if (tier < 2) {
                // 다음 단계로
                dailyMissions.tier++;
                dailyMissions.merge = 0;
                dailyMissions.spawn = 0;
                dailyMissions.coins = 0;
                dailyMissions.claimed = [false, false, false];
                playSound('milestone');
                showToast(`${ICON.star} ${tier + 2}단계 미션 해금!`);
                updateDailyMissionUI();
            } else {
                // 3단계 올클리어 → 보너스
                dailyMissions.tier = 3;
                setTimeout(() => claimDailyBonus(), 500);
            }
        }
    }
}

function claimDailyBonus() {
    if (dailyMissions.bonusClaimed) return;
    if (dailyMissions.tier < 3) return;

    dailyMissions.bonusClaimed = true;
    diamonds += DAILY_COMPLETE_REWARD.diamonds;
    cards += DAILY_COMPLETE_REWARD.cards;
    playSound('milestone');
    showMilestonePopup(`${ICON.gift} 일일 미션 완료!`, `${DAILY_COMPLETE_REWARD.diamonds}${ICON.diamond} + ${DAILY_COMPLETE_REWARD.cards}${ICON.card}`);
    updateDailyMissionUI();
    updateAll();
}

// --- 버블 스폰 ---
function spawnBubble(type, level) {
    const emptyIdx = boardState.findIndex((x, i) => x === null && i < BOARD_MISSION_START);
    if (emptyIdx === -1) return;
    boardState[emptyIdx] = { type: 'bubble', itemType: type, itemLevel: level, expiresAt: Date.now() + BUBBLE_EXPIRE_MS };
    playSound('dice_drop');
    showToast('🫧 버블 발견!');
}

// --- 버블 팝업 ---
function showBubblePopup(zone, idx) {
    const s = zone === 'board' ? boardState : storageState;
    const it = s[idx];
    if (!it || it.type !== 'bubble') return;
    document.getElementById('bubble-zone').value = zone;
    document.getElementById('bubble-idx').value = idx;
    const itemData = getItemData(it.itemType, it.itemLevel);
    const cost = it.itemLevel * BUBBLE_DIAMOND_PER_LEVEL;
    document.getElementById('bubble-item-preview').innerHTML = itemData
        ? `<img src="${itemData.img}" style="width:80px;height:80px;object-fit:contain"><div class="text-sm font-bold mt-1">${itemData.name} Lv.${it.itemLevel}</div>`
        : '<div class="text-2xl">?</div>';
    const rem = Math.max(0, it.expiresAt - Date.now());
    document.getElementById('bubble-timer-text').innerText = `${formatMinSec(rem)} 후 사라집니다`;
    document.getElementById('bubble-diamond-btn').innerHTML = `구매 ${cost}${ICON.diamond}`;
    openOverlay('bubble-popup');
}

// --- 버블 해제 (광고) ---
function openBubbleByAd() {
    const zone = document.getElementById('bubble-zone').value;
    const idx = parseInt(document.getElementById('bubble-idx').value);
    closeOverlay('bubble-popup');
    const s = zone === 'board' ? boardState : storageState;
    const it = s[idx];
    if (!it || it.type !== 'bubble') return;
    s[idx] = { type: it.itemType, level: it.itemLevel };
    discoverItem(it.itemType, it.itemLevel);
    playSound('purchase');
    showToast('버블 해제!');
    updateAll();
}

// --- 버블 해제 (다이아) ---
function openBubbleByDiamond() {
    const zone = document.getElementById('bubble-zone').value;
    const idx = parseInt(document.getElementById('bubble-idx').value);
    const s = zone === 'board' ? boardState : storageState;
    const it = s[idx];
    if (!it || it.type !== 'bubble') return;
    const cost = it.itemLevel * BUBBLE_DIAMOND_PER_LEVEL;
    if (diamonds < cost) {
        showError('다이아 부족!');
        return;
    }
    closeOverlay('bubble-popup');
    diamonds -= cost;
    s[idx] = { type: it.itemType, level: it.itemLevel };
    discoverItem(it.itemType, it.itemLevel);
    playSound('purchase');
    showToast('버블 해제!');
    updateAll();
}

// --- 에너지 광고 ---
function adEnergy() {
    closeEnergyPopup();
    openAdPopup('energy', 0);
}

// --- 광고 팝업 (저금통/창고/상점/에너지 공용) ---
function openAdPopup(zone, idx) {
    document.getElementById('ad-piggy-zone').value = zone;
    document.getElementById('ad-piggy-idx').value = idx;
    const isEnergy = zone === 'energy';
    const isStorage = zone === 'storage' && storageState[idx]?.type === 'locked_storage';
    const isShop = zone === 'shop';
    const mode = isEnergy ? 'energy' : isShop ? 'shop' : isStorage ? 'storage' : 'piggy';
    document.getElementById('ad-piggy-mode').value = mode;
    document.getElementById('ad-confirm-btn').textContent = '시청하기';
    let adDesc;
    if (isEnergy) {
        adDesc = `광고를 시청하면<br>에너지 <b class="text-yellow-600">${AD_ENERGY_AMOUNT}${ICON.energy}</b>를 받을 수 있습니다!`;
    } else if (isShop) {
        adDesc = '광고를 시청하면<br>아이템을 받을 수 있습니다!';
    } else if (isStorage) {
        adDesc = '광고를 시청하면<br>창고 칸을 열 수 있습니다!';
    } else {
        const s = zone === 'board' ? boardState : storageState;
        const piggyCoins = s[idx]?.coins || 0;
        adDesc = `광고를 시청하면 저금통을 즉시 열고<br><b class="text-yellow-600">${piggyCoins} × 2 = ${piggyCoins * 2}${ICON.coin}</b> 획득!`;
        document.getElementById('ad-confirm-btn').innerHTML = `${piggyCoins * 2}${ICON.coin} 받기`;
    }
    document.getElementById('ad-popup-desc').innerHTML = adDesc;
    openOverlay('ad-popup');
}

function confirmAd() {
    const mode = document.getElementById('ad-piggy-mode').value;
    const zone = document.getElementById('ad-piggy-zone').value;
    const idx = parseInt(document.getElementById('ad-piggy-idx').value);
    closeOverlay('ad-popup');

    if (mode === 'energy') {
        energy = Math.min(energy + AD_ENERGY_AMOUNT, 999);
        playSound('purchase');
        showToast(`+${AD_ENERGY_AMOUNT}${ICON.energy} 충전!`);
        flyRewardToStatusBar(document.getElementById('ad-popup'), 'energy');
        updateUI();
        updateTimerUI();
        saveGame();
    } else if (mode === 'shop') {
        const item = shopItems[idx];
        if (!item) return;
        let tz = 'board', eIdx = boardState.findIndex((v) => v === null);
        if (eIdx === -1) {
            const si = storageState.findIndex((v) => v === null);
            if (si !== -1) { tz = 'storage'; eIdx = si; }
        }
        if (eIdx === -1) { showError('공간 부족!'); return; }
        (tz === 'board' ? boardState : storageState)[eIdx] = { type: item.type, level: item.level };
        discoverItem(item.type, item.level);
        shopItems[idx] = null;
        playSound('purchase');
        showToast('구매 완료!');
        updateAll();
        renderShop();
    } else if (mode === 'storage') {
        storageState[idx] = null;
        playSound('purchase');
        showToast('창고 확장!');
        updateAll();
    } else {
        const s = zone === 'board' ? boardState : storageState;
        const it = s[idx];
        if (!it || it.type !== 'piggy_bank') return;
        const cell = zone === 'board' ? boardEl.children[idx] : storageEl.children[idx];
        const reward = it.coins * 2;
        addCoins(reward);
        s[idx] = null;
        playSound('purchase');
        showMilestonePopup(`${ICON.piggy} 저금통 개봉! (×2)`, `+${reward}${ICON.coin}`);
        if (cell) flyRewardToStatusBar(cell, 'coin');
        updateAll();
    }
}

// --- 7일 출석 보너스 ---
function checkDailyBonus() {
    const today = getKSTDateString();
    if (lastDailyBonusDate === today) return;

    // 연속 출석 체크 (KST 기준)
    if (lastDailyBonusDate) {
        const lastDate = new Date(lastDailyBonusDate + 'T00:00:00+09:00');
        const todayDate = new Date(today + 'T00:00:00+09:00');
        const diffDays = Math.floor((todayDate - lastDate) / (24 * 60 * 60 * 1000));

        if (diffDays === 1) {
            // 연속 출석 → 다음 날로 진행
            loginStreak = (loginStreak + 1) % 7;
        } else if (diffDays > 1) {
            // 하루 이상 놓침 → 처음부터
            loginStreak = 0;
        }
    } else {
        // 첫 출석
        loginStreak = 0;
    }

    lastDailyBonusDate = today;

    // 보상 지급
    const reward = ATTENDANCE_REWARDS[loginStreak];
    let rewardText = '';

    if (reward.coins) {
        addCoins(reward.coins);
        rewardText = `${reward.coins}${ICON.coin}`;
    }
    if (reward.diamonds) {
        diamonds += reward.diamonds;
        rewardText = `${reward.diamonds}${ICON.diamond}`;
    }
    if (reward.cards) {
        cards += reward.cards;
        rewardText = `${reward.cards}${ICON.card}`;
    }

    playSound('daily_bonus');
    showMilestonePopup(`${ICON.gift} ${reward.day}일차 출석!`, rewardText);
    saveGame();
}
