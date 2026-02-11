// ============================================
// tutorial.js - 온보딩 튜토리얼 시스템 (4스텝)
// ============================================

const TUTORIAL_STEPS = [
    // Step 1: 캣타워 소개 + 클릭
    {
        target: () => boardEl.children[0],
        text: '<strong>캣타워</strong>예요! 터치하면 고양이가 태어나요!',
        arrow: 'up',
        action: 'click',
    },
    // Step 2: 캣타워 한번 더
    {
        target: () => boardEl.children[0],
        text: '합성하려면 2마리 필요! 한번 더 터치!',
        arrow: 'up',
        action: 'click',
    },
    // Step 3: 합성 (드래그)
    {
        target: () => {
            const pair = findSameLevelPair('cat');
            return pair ? [boardEl.children[pair[0]], boardEl.children[pair[1]]] : null;
        },
        text: '같은 동물끼리 <strong>드래그</strong>해서 합쳐보세요!',
        arrow: 'up',
        action: 'merge',
    },
    // Step 4: 퀘스트 완료
    {
        target: () => findReadyQuestBtn(),
        text: '<strong>무지개 퀘스트</strong>를 터치해서 완료!',
        arrow: 'down',
        action: 'quest',
    },
];

function startTutorial() {
    if (tutorialStep <= 0 || tutorialStep > 4) return;
    document.getElementById('tutorial-overlay').style.display = '';
    document.body.classList.add('tutorial-active');
    window.scrollTo(0, 0);
    // Step 3 재개 시 같은 동물 없으면 Step 2로 되돌리기
    if (tutorialStep === 3) {
        const pair = findSameLevelPair('cat');
        if (!pair) tutorialStep = 2;
    }
    showTutorialStep(tutorialStep);
}

function showTutorialStep(step) {
    const config = TUTORIAL_STEPS[step - 1];
    if (!config) return;

    const spotlight = document.getElementById('tutorial-spotlight');
    const bubble = document.getElementById('tutorial-bubble');
    const nextBtn = document.getElementById('tutorial-next-btn');

    // 모든 tutorial-target 클래스 제거
    document.querySelectorAll('.tutorial-target').forEach((el) => el.classList.remove('tutorial-target'));
    nextBtn.style.display = 'none';

    // 타겟 결정
    const targetResult = typeof config.target === 'function' ? config.target() : config.target;
    const targets = Array.isArray(targetResult) ? targetResult : targetResult ? [targetResult] : [];

    if (targets.length === 0) {
        spotlight.style.display = 'none';
        bubble.style.display = 'none';
        return;
    }

    // 타겟에 tutorial-target 클래스 추가
    targets.forEach((t) => t.classList.add('tutorial-target'));

    // 타겟이 보이도록 스크롤
    targets[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    // 스크롤 완료 후 위치 재계산
    setTimeout(() => {
        positionSpotlight(targets, spotlight);
        positionBubble(targets, config.arrow, bubble);
    }, 200);

    // 스포트라이트 + 말풍선 위치 (즉시)
    positionSpotlight(targets, spotlight);
    bubble.style.display = '';
    bubble.className = config.arrow === 'down' ? 'arrow-down' : 'arrow-up';
    document.getElementById('tutorial-bubble-text').innerHTML = config.text;
    positionBubble(targets, config.arrow, bubble);
}

function positionSpotlight(targets, spotlight) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    targets.forEach((t) => {
        const r = t.getBoundingClientRect();
        minX = Math.min(minX, r.left);
        minY = Math.min(minY, r.top);
        maxX = Math.max(maxX, r.right);
        maxY = Math.max(maxY, r.bottom);
    });
    const pad = 6;
    spotlight.style.display = '';
    spotlight.style.left = (minX - pad) + 'px';
    spotlight.style.top = (minY - pad) + 'px';
    spotlight.style.width = (maxX - minX + pad * 2) + 'px';
    spotlight.style.height = (maxY - minY + pad * 2) + 'px';
}

function positionBubble(targets, arrow, bubble) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    targets.forEach((t) => {
        const r = t.getBoundingClientRect();
        minX = Math.min(minX, r.left);
        minY = Math.min(minY, r.top);
        maxX = Math.max(maxX, r.right);
        maxY = Math.max(maxY, r.bottom);
    });
    const centerX = (minX + maxX) / 2;
    const bw = Math.min(280, window.innerWidth - 32);
    let left = centerX - bw / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - bw - 16));

    bubble.style.maxWidth = bw + 'px';
    bubble.style.left = left + 'px';

    if (arrow === 'down') {
        bubble.style.top = '';
        bubble.style.bottom = (window.innerHeight - minY + 16) + 'px';
    } else {
        bubble.style.bottom = '';
        bubble.style.top = (maxY + 16) + 'px';
    }
}

function advanceTutorial() {
    tutorialStep++;
    if (tutorialStep > 4) {
        completeTutorial();
        return;
    }
    saveGame();
    showTutorialStep(tutorialStep);
}

function completeTutorial() {
    tutorialStep = 0;
    lastMergedIndex = -1;

    // 오버레이 제거
    document.getElementById('tutorial-overlay').style.display = 'none';
    document.body.classList.remove('tutorial-active');
    document.querySelectorAll('.tutorial-target').forEach((el) => el.classList.remove('tutorial-target'));

    saveGame();

    // 지연된 이벤트 실행
    checkDailyBonus();
    initRace();
    if (currentUser) showToast(`환영합니다, ${currentUser.displayName}!`);
}

function isTutorialClickAllowed(zone, idx) {
    if (tutorialStep <= 0) return true;
    // Step 1, 2: 캣타워(board[0])만 허용
    if (tutorialStep === 1 || tutorialStep === 2) return zone === 'board' && idx === 0;
    // Step 3: 드래그만 허용 (클릭 불가)
    if (tutorialStep === 3) return false;
    // Step 4: 퀘스트 onclick은 별도 경로
    if (tutorialStep === 4) return false;
    return false;
}

function findSameLevelPair(type) {
    const indices = [];
    for (let i = 0; i < boardState.length; i++) {
        const it = boardState[i];
        if (it && it.type === type && it.level === 1) {
            indices.push(i);
            if (indices.length === 2) return indices;
        }
    }
    return null;
}

function findReadyQuestBtn() {
    const btn = questContainer.querySelector('.quest-btn.complete');
    return btn ? btn.closest('.quest-card') : null;
}

function repositionTutorial() {
    if (tutorialStep <= 0 || tutorialStep > 4) return;
    showTutorialStep(tutorialStep);
}
