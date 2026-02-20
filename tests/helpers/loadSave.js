import { readFileSync } from 'fs';
import { createContext, runInContext } from 'vm';
import { resolve } from 'path';

/**
 * constants.js + save.js를 vm 컨텍스트에서 실행하고 전역 함수/상수를 반환
 * save.js의 순수 함수(sanitize, clamp, validate, diagnose, isValid)만 테스트용
 */
export function loadSave() {
    const ctx = {
        // ICON mock
        ICON: new Proxy(
            {},
            {
                get: () => '',
            },
        ),
        // save.js에서 참조하는 전역 변수 mock
        genLevels: { cat: 1, dog: 1, bird: 1, fish: 1, reptile: 1 },
        boardState: new Array(35).fill(null),
        storageState: new Array(5).fill(null),
        coins: 0,
        cumulativeCoins: 0,
        totalQuestsCompleted: 0,
        diamonds: 0,
        energy: 100,
        energyRecoverAt: Date.now(),
        userLevel: 1,
        questProgress: 0,
        quests: [],
        questIdCounter: 0,
        shopItems: [],
        shopNextRefresh: Date.now(),
        discoveredItems: new Set(),
        currentSpecialIndex: 0,
        dailyMissions: {
            tier: 0,
            merge: 0,
            spawn: 0,
            coins: 0,
            claimed: [false, false, false],
            bonusClaimed: false,
            lastResetDate: '',
        },
        energyPurchaseCount: 0,
        energyPurchaseResetTime: Date.now(),
        tutorialStep: 0,
        firstEnergyRewardGiven: false,
        cards: 0,
        album: [],
        albumResetTime: Date.now(),
        lastDailyBonusDate: '',
        loginStreak: 0,
        currentRaceId: null,
        myRaceCode: null,
        raceWins: 0,
        raceLosses: 0,
        recentRaceOpponents: [],
        diceTripPosition: 0,
        diceCount: 0,
        visitedSteps: [0],
        soundEnabled: true,
        musicEnabled: true,
        storyProgress: {
            unlockedImages: [],
            activeQuestId: null,
            bosses: [],
            pendingBoss: null,
        },
        currentUser: null,
        pendingCloudData: null,
        cloudSaveTimeout: null,
        cloudSavePromise: null,
        navigator: { onLine: true },
        localStorage: {
            setItem: () => {},
            getItem: () => null,
        },
        document: {
            getElementById: () => null,
        },
        db: null,
        setTimeout,
        clearTimeout,
        // save.js에서 호출하는 함수 mock
        refreshShop: () => {},
        generateRandomShopItem: () => null,
        getActiveTypes: () => ['cat', 'dog'],
        generateSpecialQuest: () => null,
        generateNewQuest: () => {},
        renderGrid: () => {},
        renderShop: () => {},
        updateAll: () => {},
        updateUI: () => {},
        updateTimerUI: () => {},
        updateQuestUI: () => {},
        updateDailyMissionUI: () => {},
        updateDiceTripUI: () => {},
        updateSoundUI: () => {},
        stopBGM: () => {},
        showToast: () => {},
        // 빌트인
        console,
        Math,
        Date,
        Array,
        Object,
        String,
        Number,
        JSON,
        Set,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        Proxy,
    };

    // constants.js 먼저 실행 (상수/헬퍼 정의)
    const constantsCode = readFileSync(resolve('js/constants.js'), 'utf8');
    runInContext(constantsCode, createContext(ctx));

    // save.js 실행
    const saveCode = readFileSync(resolve('js/save.js'), 'utf8');
    runInContext(saveCode, ctx);

    return ctx;
}
