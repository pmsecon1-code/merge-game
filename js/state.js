// ============================================
// state.js - 전역 변수 및 DOM 참조
// ============================================

// --- 게임 상태 ---
let boardState = new Array(BOARD_SIZE).fill(null),
    storageState = new Array(STORAGE_SIZE).fill(null),
    apartmentState = new Array(APARTMENT_ROOMS).fill(null),
    shopItems = new Array(SHOP_SIZE).fill(null);
for (let i = 0; i < STORAGE_SIZE; i++) storageState[i] = { type: 'locked_storage', cost: (i + 1) * 5 };

// --- 재화 ---
let coins = 0,
    cumulativeCoins = 0;
let currentSetRescues = 0;
let diamonds = 0,
    energy = MAX_ENERGY,
    recoveryCountdown = RECOVERY_SEC;

// --- 진행도 ---
let userLevel = 1,
    questProgress = 0,
    quests = [],
    questIdCounter = 0,
    questPage = 0,
    prevReadyCount = 0;
let totalQuestsCompleted = 0;

// --- 생성기/드래그 ---
let genLevels = { cat: 1, dog: 1 },
    dragData = null;

// --- 룰렛 ---
let currentRouletteRoom = -1,
    isSpinning = false;
let currentRotation = 0;

// --- 도감/상점/판매 ---
let currentGuideType = 'cat',
    currentGuideTab = 'animal',
    sellTarget = null,
    shopNextRefresh = Date.now() + SHOP_REFRESH_MS;
let discoveredItems = new Set();
const newlyDiscoveredItems = new Map();

// --- 미션 ---
let specialMissionCycles = [0, 0, 0],
    isTutorialActive = true;

// --- 일일 미션 ---
let dailyMissions = {
    merge: 0,
    spawn: 0,
    coins: 0,
    claimed: [false, false, false],
    bonusClaimed: false,
    lastResetDate: '',
};

// --- 에너지 구매 ---
let energyPurchaseCount = 0,
    energyPurchaseResetTime = Date.now() + 3 * 60 * 60 * 1000;

// --- 최초 에너지 보상 ---
let firstEnergyRewardGiven = false;

// --- 앨범 ---
let cards = 0,
    album = [];
let currentAlbumTheme = 0;
let albumResetTime = Date.now() + ALBUM_CYCLE_MS;

// --- 7일 출석 보너스 ---
let lastDailyBonusDate = '';
let loginStreak = 0; // 0~6 (7일 중 몇 번째 보상인지)

// --- 레이스 ---
let currentRaceId = null;
let myRaceCode = null; // 내 영구 코드
let raceWins = 0;
let raceLosses = 0;
let raceUnsubscribe = null;
let recentRaceOpponents = []; // [{code, name}, ...] 최대 3명

// --- 레이스 초대 ---
let pendingInviteId = null; // 내가 받은 대기 중인 초대
let pendingInviteData = null; // 초대 데이터
let inviteTimerInterval = null; // 초대 타이머 인터벌

// --- 클라우드 저장 ---
let cloudSaveTimeout = null;
let cloudSavePromise = null;
let pendingCloudData = null;

// --- 에너지 팝업 타이머 ---
let energyPopupTimer = null;

// --- 세션 ---
let currentUser = null;
let currentSessionId = null;
let sessionUnsubscribe = null;

// --- DOM 참조 (init에서 할당) ---
let boardEl, storageEl, apartmentEl, shopGrid;
let coinEl, diamondEl, energyEl, energyTimerEl;
let levelEl, questContainer;
let dailyMissionsContainer, dailyResetTimer;
let rescueText, rescueTimerEl;
let shopTimerBadge, rouletteWheel;
let tutorialPointer;
