// ============================================
// systems.js - 미션, 상점, 구조, 룰렛, 판매
// ============================================

// --- 헬퍼 함수 (중복 제거) ---

// 보드+창고에서 특정 타입 아이템 존재 확인
function hasItemOfType(type) {
    return boardState.some((x) => x && x.type === type) ||
           storageState.some((x) => x && x.type === type);
}

// 보드+창고에서 특정 타입+레벨 아이템 존재 확인
function hasItemOfTypeAndLevel(type, level) {
    return boardState.some((x) => x && x.type === type && x.level === level) ||
           storageState.some((x) => x && x.type === type && x.level === level);
}

// 보드+창고에서 특정 타입의 최대 레벨 반환
function getMaxLevelOfType(type) {
    let maxLv = 0;
    boardState.forEach((x) => {
        if (x && x.type === type && x.level > maxLv) maxLv = x.level;
    });
    storageState.forEach((x) => {
        if (x && x.type === type && x.level > maxLv) maxLv = x.level;
    });
    return maxLv;
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
                playSound('milestone');
                showToast(`${targetData.name} 미션 완료! 칸 해제!`);
                changed = true;
            }
        } else if (item.type === 'quest_count_mission') {
            if (totalQuestsCompleted >= item.reqCount) {
                boardState[idx] = null;
                playSound('milestone');
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
        const timerText = formatMinSec(shopNextRefresh - Date.now());
        document.getElementById('shop-timer-badge').innerText = `갱신: ${timerText}`;
        document.getElementById('badge-shop-info').innerText = timerText;
    }, 1000);
}

function refreshShop() {
    shopNextRefresh = Date.now() + SHOP_REFRESH_MS;
    const t = getActiveTypes();
    // 1번 칸: cat/dog Lv.6 광고 아이템
    shopItems[0] = { type: Math.random() > 0.5 ? 'cat' : 'dog', level: 6, isAd: true };
    // 2~3번 칸: 기존 랜덤
    for (let i = 1; i < SHOP_SIZE - 2; i++) shopItems[i] = generateRandomShopItem(t);
    shopItems[SHOP_SIZE - 2] = { type: 'card_pack', amount: 15, price: 15 };
    shopItems[SHOP_SIZE - 1] = { type: 'diamond_pack', amount: 5, price: 500 };
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
                d.innerHTML = `<div class="bg-circle" style="background-color:#f0abfc"></div><img src="images/icons/card.png" class="icon icon-md"><div class="level-badge">×${item.amount}</div><div class="shop-price-tag">${item.price}<img src="images/icons/diamond.png" class="icon" style="width:8px;height:8px"></div>`;
            } else if (item.type === 'diamond_pack') {
                d.innerHTML = `<div class="bg-circle" style="background-color:#67e8f9"></div><img src="images/icons/diamond.png" class="icon icon-md"><div class="level-badge">×${item.amount}</div><div class="shop-price-tag" style="color:#fbbf24">${item.price}<img src="images/icons/coin.png" class="icon" style="width:8px;height:8px"></div>`;
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
                const priceTag = item.isAd
                    ? `<div class="shop-price-tag"><img src="images/icons/tv.png" class="icon" style="width:10px;height:10px"></div>`
                    : `<div class="shop-price-tag">${item.level * 3}<img src="images/icons/diamond.png" class="icon" style="width:8px;height:8px"></div>`;
                const shopVisual = data.img
                    ? `<img src="${data.img}" style="width:1.2rem;height:1.2rem;object-fit:contain">`
                    : `<div style="font-size:1.2rem">${data.emoji}</div>`;
                d.innerHTML = `<div class="${isS || isT ? 'bg-square' : 'bg-circle'}" style="background-color:${data.color}"></div>${shopVisual}<div class="level-badge">Lv.${item.level}</div>${priceTag}`;
            }
        } else d.innerHTML = `<span class="text-xs text-gray-400">품절</span>`;
        shopGrid.appendChild(d);
    });
}

function buyShopItem(idx) {
    const item = shopItems[idx];
    if (!item) return;
    if (item.isAd) {
        openAdPopup('shop', idx);
        return;
    }
    if (item.type === 'card_pack') {
        if (diamonds < item.price) {
            showError('다이아 부족!');
            return;
        }
        diamonds -= item.price;
        cards += item.amount;
        playSound('purchase');
        showToast(`+${item.amount}${ICON.card} 획득!`);
        updateAll();
        return;
    }
    if (item.type === 'diamond_pack') {
        if (coins < item.price) {
            showError('코인 부족!');
            return;
        }
        coins -= item.price;
        diamonds += item.amount;
        playSound('purchase');
        showToast(`+${item.amount}${ICON.diamond} 획득!`);
        updateAll();
        return;
    }
    const p = item.level * 3;
    if (diamonds < p) {
        showError('다이아 부족!');
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
        showError('공간 부족!');
        return;
    }
    diamonds -= p;
    (tz === 'board' ? boardState : storageState)[eIdx] = { ...item };
    discoverItem(item.type, item.level);
    shopItems[idx] = generateRandomShopItem(getActiveTypes());
    playSound('purchase');
    showToast('구매 완료!');
    updateAll();
    renderShop();
}

// --- 주사위 여행 ---
function tryDropDice() {
    if (Math.random() < DICE_DROP_CHANCE) {
        diceCount++;
        playSound('dice_drop');
        // 주사위 획득 팝업
        const popup = document.getElementById('dice-drop-popup');
        const countEl = document.getElementById('dice-drop-count');
        if (countEl) countEl.textContent = `보유: ${diceCount}개`;
        if (popup) {
            openOverlay('dice-drop-popup');
            setTimeout(() => {
                closeOverlay('dice-drop-popup');
            }, DICE_DROP_POPUP_MS);
        }
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
    playSound('dice_roll');
    pendingDiceResult = Math.floor(Math.random() * 6) + 1;

    // 팝업 요소
    const popup = document.getElementById('dice-roll-popup');
    const diceAnim = document.getElementById('dice-anim');
    const resultNum = document.getElementById('dice-result-num');
    const titleEl = document.getElementById('dice-title');
    const rewardBox = document.getElementById('dice-reward-box');
    const rewardText = document.getElementById('dice-reward-text');
    const confirmBtn = document.getElementById('dice-confirm-btn');

    // 초기화
    openOverlay('dice-roll-popup');
    diceAnim.classList.add('rolling');
    resultNum.classList.add('slot');
    resultNum.textContent = '?';
    titleEl.textContent = '주사위 굴리기!';
    rewardBox.classList.add('hidden');
    confirmBtn.classList.add('hidden');

    // 숫자 슬롯 효과
    const slotInterval = setInterval(() => {
        resultNum.textContent = Math.floor(Math.random() * 6) + 1;
    }, 80);

    // 슬롯 효과 후 결과 표시
    setTimeout(() => {
        clearInterval(slotInterval);
        diceAnim.classList.remove('rolling');
        resultNum.classList.remove('slot');
        resultNum.textContent = pendingDiceResult;
        titleEl.textContent = `${pendingDiceResult}칸 이동!`;

        // 이동 대기 후 자동 이동 + 보상 표시
        setTimeout(() => {
            const rewardInfo = executeMove(pendingDiceResult);
            if (rewardInfo) {
                rewardText.innerHTML = rewardInfo;
                rewardBox.classList.remove('hidden');
            }
            isRollingDice = false;
            updateDiceTripUI();
            saveGame();

            // 보상 표시 후 자동 닫기
            setTimeout(() => {
                popup.style.display = 'none';
            }, DICE_RESULT_POPUP_MS);
        }, DICE_MOVE_DELAY_MS);
    }, DICE_SLOT_EFFECT_MS);
}

function executeMove(steps) {
    const newPos = Math.min(diceTripPosition + steps, DICE_TRIP_SIZE - 1);
    diceTripPosition = newPos;

    // 착지 칸 보상 (완주 여부와 관계없이)
    let rewardInfo = null;
    if (!visitedSteps.includes(diceTripPosition)) {
        visitedSteps.push(diceTripPosition);
        rewardInfo = giveStepRewardWithInfo(diceTripPosition);
    }

    // 완주 체크 (마지막 칸 도착 시 완주)
    if (diceTripPosition >= DICE_TRIP_SIZE - 1) {
        // 보상 표시 후 완주 처리
        setTimeout(() => {
            document.getElementById('dice-roll-popup').style.display = 'none';
            completeTrip();
        }, DICE_RESULT_POPUP_MS + 100);
        return rewardInfo;
    }

    return rewardInfo;
}

function closeDiceRollPopup() {
    document.getElementById('dice-roll-popup').style.display = 'none';
}

function giveStepRewardWithInfo(pos) {
    const reward = DICE_TRIP_REWARDS[pos];
    if (!reward) return null;

    const amount = reward.min + Math.floor(Math.random() * (reward.max - reward.min + 1));
    let rewardStr = '';

    switch (reward.type) {
        case 'coins':
            addCoins(amount);
            rewardStr = `${amount}${ICON.coin}`;
            break;
        case 'diamonds':
            diamonds += amount;
            rewardStr = `${amount}${ICON.diamond}`;
            break;
        case 'cards':
            cards += amount;
            rewardStr = `${amount}${ICON.card}`;
            break;
        case 'energy':
            energy += amount;
            rewardStr = `${amount}${ICON.energy}`;
            break;
    }
    updateUI();
    return rewardStr;
}

function completeTrip() {
    // 완주 보상
    addCoins(DICE_TRIP_COMPLETE_REWARD.coins);
    diamonds += DICE_TRIP_COMPLETE_REWARD.diamonds;

    playSound('milestone');
    showMilestonePopup(`${ICON.party} 주사위 여행 완주!`, `${DICE_TRIP_COMPLETE_REWARD.coins}${ICON.coin} + ${DICE_TRIP_COMPLETE_REWARD.diamonds}${ICON.diamond}`);

    // 즉시 리셋
    diceTripPosition = 0;
    visitedSteps = [0];
    diceCount = 0;

    updateDiceTripUI();
    updateUI();
}

function updateDiceTripUI() {
    if (!diceTripContainer) return;

    // 진행도 표시
    const posEl = document.getElementById('dice-trip-position');
    if (posEl) {
        posEl.textContent = `${diceTripPosition + 1}/${DICE_TRIP_SIZE}`;
    }

    // 굴리기 버튼 상태
    const rollBtn = document.getElementById('dice-roll-btn');
    if (rollBtn) {
        rollBtn.disabled = diceCount <= 0 || isRollingDice;
        rollBtn.innerHTML = diceCount > 0 ? `${ICON.dice} 굴리기 (${diceCount})` : `${ICON.dice} 주사위 없음`;
    }

    // 보드 렌더링
    renderDiceTripBoard();
}

function renderDiceTripBoard() {
    if (!diceTripBoard) return;

    let html = '';

    // 49칸 렌더링 (0~48, 마지막 칸은 골인으로 처리)
    for (let i = 0; i < DICE_TRIP_SIZE - 1; i++) {
        const isVisited = visitedSteps.includes(i) && i !== diceTripPosition;
        const isCurrent = i === diceTripPosition;
        const reward = DICE_TRIP_REWARDS[i];
        let rewardIcon = '';
        let rewardAmount = '';
        if (reward) {
            switch (reward.type) {
                case 'coins': rewardIcon = ICON.coin; break;
                case 'diamonds': rewardIcon = ICON.diamond; break;
                case 'cards': rewardIcon = ICON.card; break;
                case 'energy': rewardIcon = ICON.energy; break;
            }
            rewardAmount = reward.min;
        }

        const rewardDisplay = isCurrent
            ? '<img src="images/icons/paw.png" class="icon icon-sm">'
            : isVisited
                ? ICON.check
                : `<span class="reward-icon">${rewardIcon}</span><span class="reward-amount">${rewardAmount}</span>`;

        html += `<div class="dice-step ${isVisited ? 'visited' : ''} ${isCurrent ? 'current' : ''}">
            ${rewardDisplay}
        </div>`;
    }

    // 골인 지점 (마지막 칸 = 49번)
    const isAtGoal = diceTripPosition >= DICE_TRIP_SIZE - 1;
    html += `<div class="dice-step goal ${isAtGoal ? 'reached current' : ''}">
        ${isAtGoal ? '<img src="images/icons/paw.png" class="icon icon-sm">' : '<img src="images/icons/finish.png" class="icon icon-sm">'}
    </div>`;

    diceTripBoard.innerHTML = html;

    // 현재 위치로 자동 스크롤
    const currentStep = diceTripBoard.querySelector('.dice-step.current');
    if (currentStep) {
        void diceTripBoard.offsetWidth;
        const scrollLeft = currentStep.offsetLeft - (diceTripBoard.clientWidth / 2) + (currentStep.offsetWidth / 2);
        diceTripBoard.scrollLeft = Math.max(0, scrollLeft);
    }
}

// --- 판매 ---
function askSellItem(z, i, e) {
    e.stopPropagation();
    const it = z === 'board' ? boardState[i] : storageState[i];
    if (!it) return;

    // 생성기는 판매 불가
    if (it.type.includes('generator')) {
        showError('생성기는 판매할 수 없어요!');
        return;
    }

    // 저금통은 판매 불가
    if (it.type === 'piggy_bank') {
        showError('저금통은 판매할 수 없어요!');
        return;
    }

    // 버블은 판매 불가
    if (it.type === 'bubble') {
        showError('버블은 판매할 수 없어요!');
        return;
    }

    sellTarget = { zone: z, index: i, item: it };
    const p = Math.max(1, Math.floor(it.level / 2));
    const list = getItemList(it.type);
    const n = (list[it.level - 1] || list[list.length - 1]).name;
    document.getElementById('sell-desc').innerHTML = `${n} (Lv.${it.level}) : ${p}${ICON.coin}`;
    openOverlay('sell-popup');
}

// ============================================
// 기부 시스템
// ============================================

function getDonationTitle() {
    let title = null;
    for (const m of DONATION_MILESTONES) {
        if (donationTotal >= m.threshold) title = m.title;
    }
    return title;
}

function getNextMilestone() {
    for (const m of DONATION_MILESTONES) {
        if (donationTotal < m.threshold) return m;
    }
    return null;
}

function donate(amount) {
    if (coins < amount) {
        showError('코인 부족!');
        return;
    }
    const prevTitle = getDonationTitle();
    coins -= amount;
    donationTotal += amount;
    playSound('purchase');
    showToast(`기부 완료! -${amount.toLocaleString()}${ICON.coin}`);

    const newTitle = getDonationTitle();
    if (newTitle && newTitle !== prevTitle) {
        const milestone = DONATION_MILESTONES.find(m => m.title === newTitle);
        if (milestone) {
            diamonds += milestone.diamonds;
            playSound('milestone');
            setTimeout(() => {
                showMilestonePopup(`${ICON.gift} 칭호 획득: ${newTitle}!<br>+${milestone.diamonds}${ICON.diamond}`);
            }, 500);
        }
    }
    updateDonationUI();
    updateAll();
}

function updateDonationUI() {
    const titleEl = document.getElementById('donate-title');
    const totalEl = document.getElementById('donate-total');
    const nextEl = document.getElementById('donate-next');

    const title = getDonationTitle();
    if (titleEl) titleEl.textContent = title || '없음';
    if (totalEl) totalEl.textContent = donationTotal.toLocaleString();

    const next = getNextMilestone();
    if (nextEl) {
        if (next) {
            const remain = next.threshold - donationTotal;
            nextEl.innerHTML = `다음 칭호: <b>${next.title}</b> (${remain.toLocaleString()}${ICON.coin} 남음)`;
        } else {
            nextEl.innerHTML = `<span class="text-yellow-600 font-bold">모든 칭호 달성!</span>`;
        }
    }

    // 버튼 disabled 갱신
    for (const amt of DONATION_AMOUNTS) {
        const btn = document.getElementById(`donate-btn-${amt}`);
        if (btn) {
            btn.disabled = coins < amt;
            btn.classList.toggle('opacity-50', coins < amt);
        }
    }
}
