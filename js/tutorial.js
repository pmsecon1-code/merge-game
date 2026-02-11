// ============================================
// tutorial.js - 온보딩 튜토리얼 시스템
// ============================================

const TUTORIAL_STEPS = [
    // Step 1: 캣타워 터치
    {
        phase: 'spawn',
        target: () => boardEl.children[0],
        text: '<strong>캣타워</strong>예요! 터치하면 고양이가 태어나요!',
        arrow: 'up',
        action: 'click',
    },
    // Step 2: 개집 터치
    {
        phase: 'spawn',
        target: () => boardEl.children[4],
        text: '<strong>개집</strong>이에요! 터치하면 강아지가 태어나요!',
        arrow: 'up',
        action: 'click',
    },
    // Step 3: 캣타워 한번 더
    {
        phase: 'spawn',
        target: () => boardEl.children[0],
        text: '합성하려면 2마리 필요! 캣타워를 한번 더!',
        arrow: 'up',
        action: 'click',
    },
    // Step 4: 합성 (드래그)
    {
        phase: 'merge',
        target: () => {
            const pair = findSameLevelPair('cat');
            return pair ? [boardEl.children[pair[0]], boardEl.children[pair[1]]] : null;
        },
        text: '같은 동물끼리 <strong>드래그</strong>해서 합쳐보세요!',
        arrow: 'up',
        action: 'merge',
    },
    // Step 5: 합성 결과 확인
    {
        phase: 'merge',
        target: () => lastMergedIndex >= 0 ? boardEl.children[lastMergedIndex] : null,
        text: '짜잔! <strong>레벨업</strong> 성공! 계속 합성하면 더 성장!',
        arrow: 'up',
        action: 'next',
    },
    // Step 6: 퀘스트 설명
    {
        phase: 'quest',
        target: () => document.getElementById('quest-area'),
        text: 'NPC가 동물을 찾고 있어요! 만들어서 보내주세요!',
        arrow: 'down',
        action: 'next',
    },
    // Step 7: 퀘스트 완료
    {
        phase: 'quest',
        target: () => findReadyQuestBtn(),
        text: '<strong>무지개 테두리</strong> 퀘스트를 터치해서 완료!',
        arrow: 'down',
        action: 'quest',
    },
    // Step 8: 완료
    {
        phase: 'complete',
        target: null,
        text: '',
        arrow: null,
        action: 'complete',
    },
];

function startTutorial() {
    if (tutorialStep <= 0 || tutorialStep > 8) return;
    document.getElementById('tutorial-overlay').style.display = '';
    // Step 4 재개 시 같은 동물 없으면 Step 3으로 되돌리기
    if (tutorialStep === 4) {
        const pair = findSameLevelPair('cat');
        if (!pair) tutorialStep = 3;
    }
    showTutorialStep(tutorialStep);
}

function showTutorialStep(step) {
    const config = TUTORIAL_STEPS[step - 1];
    if (!config) return;

    const overlay = document.getElementById('tutorial-overlay');
    const spotlight = document.getElementById('tutorial-spotlight');
    const bubble = document.getElementById('tutorial-bubble');
    const nextBtn = document.getElementById('tutorial-next-btn');
    const completeScreen = document.getElementById('tutorial-complete');

    // 모든 tutorial-target 클래스 제거
    document.querySelectorAll('.tutorial-target').forEach((el) => el.classList.remove('tutorial-target'));

    // 완료 화면
    if (config.action === 'complete') {
        spotlight.style.display = 'none';
        bubble.style.display = 'none';
        nextBtn.style.display = 'none';
        completeScreen.style.display = 'flex';
        return;
    }

    completeScreen.style.display = 'none';

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

    // 스포트라이트 위치
    positionSpotlight(targets, spotlight);

    // 말풍선 위치
    bubble.style.display = '';
    bubble.className = config.arrow === 'down' ? 'arrow-down' : 'arrow-up';
    document.getElementById('tutorial-bubble-text').innerHTML = config.text;
    positionBubble(targets, config.arrow, bubble);

    // 다음 버튼
    if (config.action === 'next') {
        nextBtn.style.display = '';
        nextBtn.onclick = () => advanceTutorial();
        // 버튼 위치: 말풍선 아래
        const bRect = bubble.getBoundingClientRect();
        nextBtn.style.left = (bRect.left + bRect.width / 2 - 50) + 'px';
        nextBtn.style.top = (bRect.bottom + 10) + 'px';
    } else {
        nextBtn.style.display = 'none';
    }
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
        // 말풍선이 타겟 위에
        bubble.style.top = '';
        bubble.style.bottom = (window.innerHeight - minY + 16) + 'px';
    } else {
        // 말풍선이 타겟 아래
        bubble.style.bottom = '';
        bubble.style.top = (maxY + 16) + 'px';
    }
}

function advanceTutorial() {
    tutorialStep++;
    if (tutorialStep > 8) tutorialStep = 8;
    saveGame();
    showTutorialStep(tutorialStep);
}

function completeTutorial() {
    tutorialStep = 0;
    lastMergedIndex = -1;

    // 오버레이 제거
    document.getElementById('tutorial-overlay').style.display = 'none';
    document.querySelectorAll('.tutorial-target').forEach((el) => el.classList.remove('tutorial-target'));

    saveGame();

    // 지연된 이벤트 실행
    checkDailyBonus();
    initRace();
    if (currentUser) showToast(`환영합니다, ${currentUser.displayName}!`);
}

function isTutorialClickAllowed(zone, idx) {
    if (tutorialStep <= 0) return true;
    const step = tutorialStep;

    // Step 1: 캣타워(board[0])만 허용
    if (step === 1) return zone === 'board' && idx === 0;
    // Step 2: 개집(board[4])만 허용
    if (step === 2) return zone === 'board' && idx === 4;
    // Step 3: 캣타워(board[0])만 허용
    if (step === 3) return zone === 'board' && idx === 0;

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
    if (tutorialStep <= 0 || tutorialStep > 8) return;
    showTutorialStep(tutorialStep);
}
