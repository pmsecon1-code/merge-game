// ============================================
// constants.js - 게임 상수 및 데이터
// ============================================

// --- 아이콘 헬퍼 ---
const ICON = {
    coin: '<img src="images/icons/coin.png" class="icon icon-sm">',
    diamond: '<img src="images/icons/diamond.png" class="icon icon-sm">',
    energy: '<img src="images/icons/energy.png" class="icon icon-sm">',
    card: '<img src="images/icons/card.png" class="icon icon-sm">',
    piggy: '<img src="images/icons/piggybank.png" class="icon icon-sm">',
    settings: '<img src="images/icons/settings.png" class="icon icon-sm">',
    lock: '<img src="images/icons/lock.png" class="icon icon-sm">',
    tv: '<img src="images/icons/tv.png" class="icon icon-sm">',
    save: '<img src="images/icons/save.png" class="icon icon-sm">',
    gift: '<img src="images/icons/gift.png" class="icon icon-sm">',
    sound: '<img src="images/icons/sound.png" class="icon icon-sm">',
    mycar: '<img src="images/race/mycar.png" class="icon icon-md">',
    rival: '<img src="images/race/rival.png" class="icon icon-md">',
    trophy: '<img src="images/race/trophy.png" class="icon icon-sm">',
    lose: '<img src="images/race/lose.png" class="icon icon-sm">',
    draw: '<img src="images/race/draw.png" class="icon icon-sm">',
    target: '<img src="images/icons/target.png" class="icon icon-sm">',
    paw: '<img src="images/icons/paw.png" class="icon icon-sm">',
    pointer: '<img src="images/icons/pointer.png" class="icon icon-sm">',
    music: '<img src="images/icons/music.png" class="icon icon-sm">',
    key: '<img src="images/icons/key.png" class="icon icon-sm">',
    party: '<img src="images/effects/party.png" class="icon icon-sm">',
    confetti: '<img src="images/effects/confetti.png" class="icon icon-sm">',
    sparkle: '<img src="images/effects/sparkle.png" class="icon icon-sm">',
    clipboard: '<img src="images/icons/clipboard.png" class="icon icon-sm">',
    finish: '<img src="images/icons/finish.png" class="icon icon-sm">',
    camera: '<img src="images/icons/camera.png" class="icon icon-sm">',
    dice: '<img src="images/icons/dice.png" class="icon icon-sm">',
    cart: '<img src="images/icons/cart.png" class="icon icon-sm">',
    box: '<img src="images/icons/box.png" class="icon icon-sm">',
    moneybag: '<img src="images/icons/moneybag.png" class="icon icon-sm">',
    ticket: '<img src="images/icons/ticket.png" class="icon icon-sm">',
    mail: '<img src="images/icons/mail.png" class="icon icon-sm">',
    trash: '<img src="images/icons/trash.png" class="icon icon-sm">',
    timer: '<img src="images/icons/timer.png" class="icon icon-sm">',
    check: '<img src="images/icons/check.png" class="icon icon-sm">',
    sleep: '<img src="images/icons/sleep.png" class="icon icon-sm">',
    offline: '<img src="images/icons/offline.png" class="icon icon-sm">',
    star: '<img src="images/effects/star.png" class="icon icon-sm">',
    merge: '<img src="images/icons/merge.png" class="icon icon-sm">',
};

// --- 유저 이름 ---
const MAX_NAME_LENGTH = 6;
function getDisplayName(user) {
    const raw = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || '유저';
    return raw.length > MAX_NAME_LENGTH ? raw.slice(0, MAX_NAME_LENGTH) : raw;
}

// --- 그리드 설정 ---
const GRID_COLS = 5;
const GRID_ROWS = 7;
const BOARD_SIZE = 35;
const STORAGE_SIZE = 5;
const SHOP_SIZE = 5;

// --- 시간 설정 (밀리초) ---
const SHOP_REFRESH_MS = 300000; // 5분
const GENERATOR_COOLDOWN_MS = 60000; // 생성기 과열 1분

// --- UI 타이밍 (밀리초) ---
const TOAST_DURATION_MS = 2000;
const MILESTONE_POPUP_MS = 2000;
const DICE_DROP_POPUP_MS = 1500;
const DICE_RESULT_POPUP_MS = 1000;
const DICE_SLOT_EFFECT_MS = 1000;
const DICE_MOVE_DELAY_MS = 500;

// --- 에너지 설정 ---
const MAX_ENERGY = 100;
const RECOVERY_SEC = 30;

// --- 비용 설정 ---
const UNLOCK_COST_BOARD = 100;
const CAGE_UPGRADE_COST = 1000;

// --- 게임 밸런스 ---
const CAGE_MAX_LEVEL = 5;
const SNACK_CHANCE = 0.08;
const GENERATOR_MAX_CLICKS = 6; // 스페셜 생성기 과열 클릭 수
const AD_ENERGY_AMOUNT = 30; // 광고 시청 에너지 충전량

// --- 퀘스트 밸런스 ---
const SPECIAL_QUEST_REWARD = 300;
const QUEST_EXPIRE_MS = 10 * 60 * 1000; // 10분
const QUEST_SNACK_CHANCE = 0.3;
const QUEST_PIGGY_CHANCE = 0.2;
const QUEST_MULTI_BASE_CHANCE = 0.3;
const QUEST_MULTI_LEVEL_FACTOR = 0.05;
const QUEST_MULTI_MAX_CHANCE = 0.8;

// --- 럭키 드랍 확률 ---
const LUCKY_BASE_CHANCE = 0.05;
const LUCKY_LEVEL_BONUS = 0.01;
const LUCKY_SNACK_CHANCE = 0.5;

// --- 기타 ---
const QUEST_COUNT_MISSION_GOAL = 100;
const CLOUD_SAVE_DEBOUNCE_MS = 500;

// --- 레벨업 공식 (중앙화) ---
function getLevelUpGoal(lv) { return Math.min(lv * 2, 20); }
function getLevelUpReward(lv) { return Math.ceil(lv / 10) * 3; }

// --- 시간 포맷 헬퍼 (mm:ss) ---
function formatMinSec(ms) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// --- 저금통 설정 ---
const PIGGY_BANK_TIMER_MS = 60 * 60 * 1000; // 1시간
const PIGGY_BANK_MIN_COINS = 100;
const PIGGY_BANK_MAX_COINS = 200;

// --- 주사위 여행 설정 ---
const DICE_TRIP_SIZE = 50;
const DICE_DROP_CHANCE = 0.03;
const DICE_TRIP_COMPLETE_REWARD = { coins: 500, diamonds: 20 };

const DICE_TRIP_REWARDS = [
    // 1~10: 초반
    { type: 'coins', min: 3, max: 10 },       // 1
    { type: 'energy', min: 2, max: 5 },       // 2
    { type: 'coins', min: 5, max: 15 },       // 3
    { type: 'cards', min: 1, max: 1 },        // 4
    { type: 'diamonds', min: 1, max: 1 },     // 5
    { type: 'coins', min: 8, max: 20 },       // 6
    { type: 'energy', min: 2, max: 5 },       // 7
    { type: 'cards', min: 1, max: 1 },        // 8
    { type: 'coins', min: 10, max: 25 },      // 9
    { type: 'diamonds', min: 1, max: 1 },     // 10
    // 11~20: 중반 초입
    { type: 'coins', min: 12, max: 30 },      // 11
    { type: 'energy', min: 3, max: 7 },       // 12
    { type: 'cards', min: 1, max: 2 },        // 13
    { type: 'coins', min: 15, max: 35 },      // 14
    { type: 'diamonds', min: 1, max: 2 },     // 15
    { type: 'coins', min: 18, max: 38 },      // 16
    { type: 'energy', min: 4, max: 8 },       // 17
    { type: 'cards', min: 1, max: 2 },        // 18
    { type: 'coins', min: 20, max: 42 },      // 19
    { type: 'diamonds', min: 1, max: 2 },     // 20
    // 21~30: 중반
    { type: 'coins', min: 22, max: 45 },      // 21
    { type: 'energy', min: 5, max: 10 },      // 22
    { type: 'cards', min: 1, max: 2 },        // 23
    { type: 'coins', min: 25, max: 50 },      // 24
    { type: 'diamonds', min: 1, max: 2 },     // 25
    { type: 'coins', min: 28, max: 55 },      // 26
    { type: 'energy', min: 6, max: 12 },      // 27
    { type: 'cards', min: 1, max: 3 },        // 28
    { type: 'coins', min: 30, max: 60 },      // 29
    { type: 'diamonds', min: 1, max: 3 },     // 30
    // 31~40: 후반 초입
    { type: 'coins', min: 35, max: 65 },      // 31
    { type: 'energy', min: 7, max: 14 },      // 32
    { type: 'cards', min: 2, max: 3 },        // 33
    { type: 'coins', min: 38, max: 70 },      // 34
    { type: 'diamonds', min: 2, max: 3 },     // 35
    { type: 'coins', min: 42, max: 75 },      // 36
    { type: 'energy', min: 8, max: 15 },      // 37
    { type: 'cards', min: 2, max: 3 },        // 38
    { type: 'coins', min: 45, max: 85 },      // 39
    { type: 'diamonds', min: 2, max: 3 },     // 40
    // 41~50: 후반
    { type: 'coins', min: 50, max: 95 },      // 41
    { type: 'energy', min: 10, max: 18 },     // 42
    { type: 'cards', min: 2, max: 4 },        // 43
    { type: 'coins', min: 60, max: 110 },     // 44
    { type: 'diamonds', min: 2, max: 4 },     // 45
    { type: 'coins', min: 65, max: 120 },     // 46
    { type: 'energy', min: 12, max: 20 },     // 47
    { type: 'cards', min: 2, max: 4 },        // 48
    { type: 'diamonds', min: 3, max: 5 },     // 49
    { type: 'coins', min: 80, max: 150 },     // 50 (완주 직전)
];

// --- NPC 아바타 ---
const NPC_AVATARS = ['👩‍🌾', '👨‍🍳', '👮‍♀️', '🧙‍♂️', '👸', '🕵️‍♂️', '🎅', '🧑‍🚀', '👨‍🎨', '🦸‍♀️'];

// --- 일일 미션 설정 ---
const DAILY_MISSIONS = [
    // 1단계 (쉬움)
    [
        { id: 'merge', icon: ICON.merge, label: '합성', target: 15, reward: 30 },
        { id: 'spawn', icon: ICON.sparkle, label: '생성', target: 30, reward: 30 },
        { id: 'coins', icon: ICON.coin, label: '코인 획득', target: 150, reward: 30 },
    ],
    // 2단계 (보통)
    [
        { id: 'merge', icon: ICON.merge, label: '합성', target: 40, reward: 60 },
        { id: 'spawn', icon: ICON.sparkle, label: '생성', target: 80, reward: 60 },
        { id: 'coins', icon: ICON.coin, label: '코인 획득', target: 400, reward: 60 },
    ],
    // 3단계 (어려움)
    [
        { id: 'merge', icon: ICON.merge, label: '합성', target: 80, reward: 100 },
        { id: 'spawn', icon: ICON.sparkle, label: '생성', target: 150, reward: 100 },
        { id: 'coins', icon: ICON.coin, label: '코인 획득', target: 800, reward: 100 },
    ],
];
const DAILY_COMPLETE_REWARD = { diamonds: 5, cards: 3 };

// ============================================
// 동물 데이터
// ============================================

const CATS = [
    { level: 1, emoji: '🐱', img: 'images/cats/cat1.png', name: '아기 고양이', color: '#fecdd3' },
    { level: 2, emoji: '🐈', img: 'images/cats/cat2.png', name: '코리안 숏헤어', color: '#d4a574' },
    { level: 3, emoji: '🐈‍⬛', img: 'images/cats/cat3.png', name: '러시안 블루', color: '#a1a1aa' },
    { level: 4, emoji: '😺', img: 'images/cats/cat4.png', name: '스코티시 폴드', color: '#fbbf24' },
    { level: 5, emoji: '😸', img: 'images/cats/cat5.png', name: '페르시안', color: '#f0f0f0' },
    { level: 6, emoji: '😻', img: 'images/cats/cat6.png', name: '벵갈', color: '#d4a030' },
    { level: 7, emoji: '😼', img: 'images/cats/cat7.png', name: '살쾡이', color: '#a78bfa' },
    { level: 8, emoji: '🐆', img: 'images/cats/cat8.png', name: '치타', color: '#fde047' },
    { level: 9, emoji: '🐆', img: 'images/cats/cat9.png', name: '표범', color: '#f59e0b' },
    { level: 10, emoji: '🐯', img: 'images/cats/cat10.png', name: '호랑이', color: '#fbbf24' },
    { level: 11, emoji: '🦁', img: 'images/cats/cat11.png', name: '사자', color: '#ef4444' },
];

const DOGS = [
    { level: 1, emoji: '🐶', img: 'images/dogs/dog1.png', name: '아기 강아지', color: '#fecdd3' },
    { level: 2, emoji: '🐕', img: 'images/dogs/dog2.png', name: '치와와', color: '#fcd34d' },
    { level: 3, emoji: '🐩', img: 'images/dogs/dog3.png', name: '포메라니안', color: '#e9d5ff' },
    { level: 4, emoji: '🦮', img: 'images/dogs/dog4.png', name: '코기', color: '#86efac' },
    { level: 5, emoji: '🐕‍🦺', img: 'images/dogs/dog5.png', name: '비글', color: '#38bdf8' },
    { level: 6, emoji: '🐺', img: 'images/dogs/dog6.png', name: '시바견', color: '#d4a030' },
    { level: 7, emoji: '🦊', img: 'images/dogs/dog7.png', name: '허스키', color: '#94a3b8' },
    { level: 8, emoji: '🦝', img: 'images/dogs/dog8.png', name: '셰퍼드', color: '#a78bfa' },
    { level: 9, emoji: '🐺', img: 'images/dogs/dog9.png', name: '늑대', color: '#64748b' },
    { level: 10, emoji: '🐻', img: 'images/dogs/dog10.png', name: '곰', color: '#92400e' },
    { level: 11, emoji: '🐻‍❄️', img: 'images/dogs/dog11.png', name: '북극곰', color: '#e0f2fe' },
];

const BIRDS = [
    { level: 1, emoji: '🐣', img: 'images/birds/bird1.png', name: '병아리', color: '#fde047' },
    { level: 2, emoji: '🐤', img: 'images/birds/bird2.png', name: '참새', color: '#a78bfa' },
    { level: 3, emoji: '🐦', img: 'images/birds/bird3.png', name: '앵무새', color: '#60a5fa' },
    { level: 4, emoji: '🕊️', img: 'images/birds/bird4.png', name: '비둘기', color: '#e2e8f0' },
    { level: 5, emoji: '🦢', img: 'images/birds/bird5.png', name: '백조', color: '#f8fafc' },
    { level: 6, emoji: '🦅', img: 'images/birds/bird6.png', name: '독수리', color: '#78350f' },
    { level: 7, emoji: '🦚', img: 'images/birds/bird7.png', name: '봉황', color: '#ef4444' },
];

const FISH = [
    { level: 1, emoji: '🐟', img: 'images/fish/fish1.png', name: '금붕어', color: '#fbbf24' },
    { level: 2, emoji: '🐠', img: 'images/fish/fish2.png', name: '열대어', color: '#fde047' },
    { level: 3, emoji: '🐡', img: 'images/fish/fish3.png', name: '복어', color: '#fbbf24' },
    { level: 4, emoji: '🦑', img: 'images/fish/fish4.png', name: '거북이', color: '#86efac' },
    { level: 5, emoji: '🐙', img: 'images/fish/fish5.png', name: '돌고래', color: '#60a5fa' },
    { level: 6, emoji: '🦈', img: 'images/fish/fish6.png', name: '상어', color: '#94a3b8' },
    { level: 7, emoji: '🐳', img: 'images/fish/fish7.png', name: '고래', color: '#3b82f6' },
];

const REPTILES = [
    { level: 1, emoji: '🐸', img: 'images/reptiles/reptile1.png', name: '개구리', color: '#86efac' },
    { level: 2, emoji: '🦎', img: 'images/reptiles/reptile2.png', name: '도마뱀', color: '#4ade80' },
    { level: 3, emoji: '🐍', img: 'images/reptiles/reptile3.png', name: '뱀', color: '#16a34a' },
    { level: 4, emoji: '🐢', img: 'images/reptiles/reptile4.png', name: '거북이', color: '#15803d' },
    { level: 5, emoji: '🐊', img: 'images/reptiles/reptile5.png', name: '악어', color: '#14532d' },
    { level: 6, emoji: '🦕', img: 'images/reptiles/reptile6.png', name: '브라키오', color: '#60a5fa' },
    { level: 7, emoji: '🐉', img: 'images/reptiles/reptile7.png', name: '드래곤', color: '#ef4444' },
];

// ============================================
// 간식 데이터
// ============================================

const CAT_SNACKS = [
    { level: 1, emoji: '🥛', img: 'images/cat_snacks/cat_snack1.png', name: '우유', color: '#fce7f3' },
    { level: 2, emoji: '🐟', img: 'images/cat_snacks/cat_snack2.png', name: '멸치', color: '#fbcfe8' },
    { level: 3, emoji: '🥫', img: 'images/cat_snacks/cat_snack3.png', name: '통조림', color: '#f9a8d4' },
    { level: 4, emoji: '🍡', img: 'images/cat_snacks/cat_snack4.png', name: '츄르', color: '#f472b6' },
    { level: 5, emoji: '🌿', img: 'images/cat_snacks/cat_snack5.png', name: '캣닢', color: '#ec4899' },
];

const DOG_SNACKS = [
    { level: 1, emoji: '🦴', img: 'images/dog_snacks/dog_snack1.png', name: '뼈다귀', color: '#e0f2fe' },
    { level: 2, emoji: '🥖', img: 'images/dog_snacks/dog_snack2.png', name: '개껌', color: '#bae6fd' },
    { level: 3, emoji: '🥩', img: 'images/dog_snacks/dog_snack3.png', name: '육포', color: '#7dd3fc' },
    { level: 4, emoji: '🌭', img: 'images/dog_snacks/dog_snack4.png', name: '소세지', color: '#38bdf8' },
    { level: 5, emoji: '🍖', img: 'images/dog_snacks/dog_snack5.png', name: '스테이크', color: '#0ea5e9' },
];

// ============================================
// 장난감 데이터
// ============================================

const CAT_TOYS = [
    { level: 1, emoji: '🧶', img: 'images/cat_toys/cat_toy1.png', name: '털실', color: '#fce7f3' },
    { level: 2, emoji: '🪶', img: 'images/cat_toys/cat_toy2.png', name: '깃털', color: '#fbcfe8' },
    { level: 3, emoji: '🐭', img: 'images/cat_toys/cat_toy3.png', name: '쥐인형', color: '#f9a8d4' },
    { level: 4, emoji: '🎣', img: 'images/cat_toys/cat_toy4.png', name: '낚싯대', color: '#f472b6' },
    { level: 5, emoji: '🏠', img: 'images/cat_toys/cat_toy5.png', name: '숨숨집', color: '#ec4899' },
];

const DOG_TOYS = [
    { level: 1, emoji: '🎾', img: 'images/dog_toys/dog_toy1.png', name: '공', color: '#d9f99d' },
    { level: 2, emoji: '🦆', img: 'images/dog_toys/dog_toy2.png', name: '오리인형', color: '#bef264' },
    { level: 3, emoji: '🥏', img: 'images/dog_toys/dog_toy3.png', name: '프리스비', color: '#a3e635' },
    { level: 4, emoji: '🪢', img: 'images/dog_toys/dog_toy4.png', name: '터그로프', color: '#84cc16' },
    { level: 5, emoji: '🛝', img: 'images/dog_toys/dog_toy5.png', name: '미끄럼틀', color: '#65a30d' },
];

// ============================================
// 앨범 데이터
// ============================================

const ALBUM_CARD_COST = 15;
const ALBUM_DRAW_COUNT = 3;
const ALBUM_CARD_CHANCE = 0.3;
const ALBUM_CARD_MIN = 2;
const ALBUM_CARD_MAX = 6;
const ALBUM_DUPE_REWARD = { N: 1, R: 3, SR: 8 };
const ALBUM_COMPLETE_COINS = 500;
const ALBUM_ALL_COMPLETE_DIAMONDS = 500;
const ALBUM_CYCLE_MS = 42 * 24 * 60 * 60 * 1000; // 42일

// --- 7일 출석 보상 ---
const ATTENDANCE_REWARDS = [
    { day: 1, diamonds: 10 },          // D1: 10💎
    { day: 2, coins: 20 },             // D2: 20🪙
    { day: 3, cards: 5 },              // D3: 5🃏
    { day: 4, diamonds: 30 },          // D4: 30💎
    { day: 5, coins: 50 },             // D5: 50🪙
    { day: 6, cards: 10 },             // D6: 10🃏
    { day: 7, diamonds: 100 },         // D7: 100💎
];

const ALBUM_THEMES = [
    {
        id: 0,
        name: '고양이의 하루',
        icon: '🐱',
        color: '#fecdd3',
        photos: [
            { id: 0, emoji: '😺', name: '기지개', rarity: 'N' },
            { id: 1, emoji: '😸', name: '밥 먹기', rarity: 'N' },
            { id: 2, emoji: '😻', name: '그루밍', rarity: 'N' },
            { id: 3, emoji: '🙀', name: '깜짝!', rarity: 'N' },
            { id: 4, emoji: '😽', name: '낮잠', rarity: 'N' },
            { id: 5, emoji: '😿', name: '목욕 시간', rarity: 'N' },
            { id: 6, emoji: '🐈', name: '상자 탐험', rarity: 'R' },
            { id: 7, emoji: '🐈‍⬛', name: '달빛 산책', rarity: 'R' },
            { id: 8, emoji: '🦁', name: '사자왕 변신', rarity: 'SR' },
        ],
    },
    {
        id: 1,
        name: '강아지의 하루',
        icon: '🐶',
        color: '#fde68a',
        photos: [
            { id: 0, emoji: '🐕', name: '산책', rarity: 'N' },
            { id: 1, emoji: '🦮', name: '공놀이', rarity: 'N' },
            { id: 2, emoji: '🐕‍🦺', name: '훈련', rarity: 'N' },
            { id: 3, emoji: '🐩', name: '목욕', rarity: 'N' },
            { id: 4, emoji: '🐶', name: '간식 시간', rarity: 'N' },
            { id: 5, emoji: '🦊', name: '숨바꼭질', rarity: 'N' },
            { id: 6, emoji: '🐺', name: '늑대 흉내', rarity: 'R' },
            { id: 7, emoji: '🐻', name: '곰과 친구', rarity: 'R' },
            { id: 8, emoji: '🐻‍❄️', name: '북극곰 변신', rarity: 'SR' },
        ],
    },
    {
        id: 2,
        name: '새들의 세계',
        icon: '🐦',
        color: '#bae6fd',
        photos: [
            { id: 0, emoji: '🐣', name: '부화', rarity: 'N' },
            { id: 1, emoji: '🐤', name: '첫 비행', rarity: 'N' },
            { id: 2, emoji: '🐦', name: '노래하기', rarity: 'N' },
            { id: 3, emoji: '🕊️', name: '편지 배달', rarity: 'N' },
            { id: 4, emoji: '🦢', name: '호수 산책', rarity: 'N' },
            { id: 5, emoji: '🦜', name: '수다쟁이', rarity: 'N' },
            { id: 6, emoji: '🦅', name: '하늘의 왕', rarity: 'R' },
            { id: 7, emoji: '🦉', name: '밤의 현자', rarity: 'R' },
            { id: 8, emoji: '🦚', name: '공작의 춤', rarity: 'SR' },
        ],
    },
    {
        id: 3,
        name: '수중 모험',
        icon: '🐟',
        color: '#a5f3fc',
        photos: [
            { id: 0, emoji: '🐟', name: '첫 수영', rarity: 'N' },
            { id: 1, emoji: '🐠', name: '산호초 탐험', rarity: 'N' },
            { id: 2, emoji: '🐡', name: '부풀기', rarity: 'N' },
            { id: 3, emoji: '🦑', name: '먹물 공격', rarity: 'N' },
            { id: 4, emoji: '🐙', name: '숨바꼭질', rarity: 'N' },
            { id: 5, emoji: '🦐', name: '해저 댄스', rarity: 'N' },
            { id: 6, emoji: '🦈', name: '상어 서핑', rarity: 'R' },
            { id: 7, emoji: '🐬', name: '돌고래 점프', rarity: 'R' },
            { id: 8, emoji: '🐳', name: '고래의 노래', rarity: 'SR' },
        ],
    },
    {
        id: 4,
        name: '파충류 탐험',
        icon: '🦎',
        color: '#bbf7d0',
        photos: [
            { id: 0, emoji: '🐸', name: '연잎 위에서', rarity: 'N' },
            { id: 1, emoji: '🦎', name: '일광욕', rarity: 'N' },
            { id: 2, emoji: '🐍', name: '탈피', rarity: 'N' },
            { id: 3, emoji: '🐢', name: '느긋한 산책', rarity: 'N' },
            { id: 4, emoji: '🐊', name: '물속 매복', rarity: 'N' },
            { id: 5, emoji: '🦕', name: '초원 나들이', rarity: 'N' },
            { id: 6, emoji: '🐲', name: '용의 비늘', rarity: 'R' },
            { id: 7, emoji: '🦖', name: '공룡 시대', rarity: 'R' },
            { id: 8, emoji: '🐉', name: '드래곤 비행', rarity: 'SR' },
        ],
    },
    {
        id: 5,
        name: '간식 파티',
        icon: '🍰',
        color: '#fce7f3',
        photos: [
            { id: 0, emoji: '🥛', name: '우유 파티', rarity: 'N' },
            { id: 1, emoji: '🦴', name: '뼈다귀 축제', rarity: 'N' },
            { id: 2, emoji: '🥫', name: '통조림 탑', rarity: 'N' },
            { id: 3, emoji: '🍡', name: '츄르 천국', rarity: 'N' },
            { id: 4, emoji: '🥩', name: '고기 잔치', rarity: 'N' },
            { id: 5, emoji: '🍖', name: '바베큐 파티', rarity: 'N' },
            { id: 6, emoji: '🌿', name: '캣닢 정원', rarity: 'R' },
            { id: 7, emoji: '🍰', name: '생일 케이크', rarity: 'R' },
            { id: 8, emoji: '🎂', name: '뷔페 풀코스', rarity: 'SR' },
        ],
    },
    {
        id: 6,
        name: '장난감 왕국',
        icon: '🧸',
        color: '#e9d5ff',
        photos: [
            { id: 0, emoji: '🧶', name: '털실 미로', rarity: 'N' },
            { id: 1, emoji: '🎾', name: '공 던지기', rarity: 'N' },
            { id: 2, emoji: '🪶', name: '깃털 사냥', rarity: 'N' },
            { id: 3, emoji: '🦆', name: '오리 친구', rarity: 'N' },
            { id: 4, emoji: '🐭', name: '쥐잡기 대회', rarity: 'N' },
            { id: 5, emoji: '🥏', name: '프리스비 묘기', rarity: 'N' },
            { id: 6, emoji: '🎣', name: '낚시 대결', rarity: 'R' },
            { id: 7, emoji: '🛝', name: '놀이공원', rarity: 'R' },
            { id: 8, emoji: '🧸', name: '인형의 왕', rarity: 'SR' },
        ],
    },
    {
        id: 7,
        name: '구조 이야기',
        icon: '🚑',
        color: '#fecaca',
        photos: [
            { id: 0, emoji: '🚑', name: '출동!', rarity: 'N' },
            { id: 1, emoji: '🏥', name: '치료 중', rarity: 'N' },
            { id: 2, emoji: '💊', name: '약 먹기', rarity: 'N' },
            { id: 3, emoji: '🩹', name: '붕대 감기', rarity: 'N' },
            { id: 4, emoji: '🛁', name: '깨끗 목욕', rarity: 'N' },
            { id: 5, emoji: '🍼', name: '분유 시간', rarity: 'N' },
            { id: 6, emoji: '🏠', name: '새 가족', rarity: 'R' },
            { id: 7, emoji: '💕', name: '행복한 재회', rarity: 'R' },
            { id: 8, emoji: '🌈', name: '무지개 다리', rarity: 'SR' },
        ],
    },
    {
        id: 8,
        name: '특별한 순간',
        icon: '🌟',
        color: '#fef3c7',
        photos: [
            { id: 0, emoji: '🎄', name: '크리스마스', rarity: 'N' },
            { id: 1, emoji: '🎃', name: '할로윈', rarity: 'N' },
            { id: 2, emoji: '🎆', name: '새해 불꽃', rarity: 'N' },
            { id: 3, emoji: '🎁', name: '선물 개봉', rarity: 'N' },
            { id: 4, emoji: '🎵', name: '음악회', rarity: 'N' },
            { id: 5, emoji: '📸', name: '가족 사진', rarity: 'N' },
            { id: 6, emoji: '🏆', name: '우승!', rarity: 'R' },
            { id: 7, emoji: '👑', name: '왕관 수여', rarity: 'R' },
            { id: 8, emoji: '✨', name: '기적의 순간', rarity: 'SR' },
        ],
    },
];

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 한국 시간(KST) 기준 날짜 문자열 반환
 * @returns {string} "YYYY-MM-DD" 형식
 */
function getKSTDateString() {
    return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * 다음 한국 자정까지 남은 시간(ms) 반환
 * @returns {number} 밀리초
 */
function getMsUntilKSTMidnight() {
    const now = Date.now();
    const kstNow = now + 9 * 60 * 60 * 1000;
    const kstToday = new Date(kstNow);
    kstToday.setUTCHours(0, 0, 0, 0);
    const kstTomorrow = kstToday.getTime() + 24 * 60 * 60 * 1000;
    return kstTomorrow - kstNow;
}

/**
 * 타입에 해당하는 아이템 리스트 반환
 */
function getItemList(type) {
    const lists = {
        cat: CATS,
        dog: DOGS,
        bird: BIRDS,
        fish: FISH,
        reptile: REPTILES,
        cat_snack: CAT_SNACKS,
        dog_snack: DOG_SNACKS,
        cat_toy: CAT_TOYS,
        dog_toy: DOG_TOYS,
    };
    return lists[type] || null;
}

/**
 * 타입의 최대 레벨 반환
 */
function getMaxLevel(type) {
    const list = getItemList(type);
    return list ? list.length : 0;
}

/**
 * 아이템 데이터 반환
 */
function getItemData(type, level) {
    const list = getItemList(type);
    if (!list) return null;
    return list.find((item) => item.level === level) || null;
}

/**
 * 생성기 이름 반환
 */
function getGeneratorName(type) {
    const names = {
        cat: '캣타워',
        dog: '개집',
        bird: '새장',
        fish: '어항',
        reptile: '사육장',
    };
    return names[type] || type;
}

/**
 * 스페셜 타입 한글 이름
 */
function getSpecialTypeName(type) {
    const names = {
        bird: '새',
        fish: '물고기',
        reptile: '파충류',
    };
    return names[type] || type;
}

// ============================================
// 시나리오 미션 (스토리 시스템)
// ============================================

const STORY_UNLOCK_LEVEL = 3;
const STORY_DMG_MULTIPLIER = 3;

const STORY_CHAPTERS = [
    {
        id: 0,
        title: '도깨비섬으로',
        desc: '마을 동물들이 하나씩 사라진다. 아기 고양이가 동료를 모아 바다 건너 도깨비섬으로 향한다.',
        episodes: [
            {
                id: 0,
                title: '텅 빈 마을',
                npc: 'images/cats/cat1.png',
                intro: [
                    '아침이 왔다.',
                    '그런데 아무 소리도 들리지 않았다.',
                    '',
                    '"...여보세요?"',
                    '',
                    '캣타워 옆에 살던 삼색이 언니가 없었다.',
                    '개집 앞에서 놀던 시바도 없었다.',
                    '아무도 없었다.',
                    '',
                    '땅에 거대한 발자국만 남아있었다.',
                    '본 적 없는 크기.',
                    '',
                    '"...다들 어디 간 거야?"',
                ],
                outro: [
                    '발자국은 바다 쪽으로 이어졌다.',
                    '수평선 너머, 검은 섬의 윤곽이 보였다.',
                    '',
                    '아기 고양이의 다리가 떨렸다.',
                    '하지만 가만히 있으면',
                    '다음은 자기 차례일지도 몰랐다.',
                ],
                reqs: [{ type: 'cat', level: 2 }],
                bossName: '도깨비 그림자',
                bossImg: 'images/story/boss_shadow.png',
                bossHp: 30,
                reward: { coins: 50 },
            },
            {
                id: 1,
                title: '떠나는 발걸음',
                npc: 'images/cats/cat1.png',
                intro: [
                    '아기 고양이는 짐을 쌌다.',
                    '간식 두 개. 그게 전부였다.',
                    '',
                    '"혼자라도 가야 해."',
                    '',
                    '마을 어귀에서 뒤를 돌아봤다.',
                    '아무도 배웅해주지 않았다.',
                    '당연했다. 아무도 없으니까.',
                ],
                outro: [
                    '해가 지기 시작했다.',
                    '산 너머에서 이상한 소리가 들렸다.',
                    '',
                    '아기 고양이는 걸음을 멈추지 않았다.',
                ],
                reqs: [{ type: 'cat_snack', level: 1 }, { type: 'dog_snack', level: 1 }],
                bossName: '도깨비 정찰병',
                bossImg: 'images/story/boss_scout.png',
                bossHp: 50,
                reward: { coins: 30, diamonds: 1 },
            },
            {
                id: 2,
                title: '첫 번째 동료',
                npc: 'images/dogs/dog1.png',
                intro: [
                    '길가에 강아지 한 마리가 쓰러져 있었다.',
                    '굶주린 눈. 갈비뼈가 보였다.',
                    '',
                    '"...간식 줄까?"',
                    '',
                    '강아지가 꼬리를 흔들었다.',
                    '힘없이, 하지만 분명히.',
                ],
                outro: [
                    '"나도 같이 갈래."',
                    '강아지가 말했다.',
                    '"우리 가족도 잡혀갔어."',
                    '',
                    '둘은 나란히 걸었다.',
                    '혼자보다는 나았다.',
                ],
                reqs: [{ type: 'dog', level: 3 }],
                bossName: '도깨비 포수',
                bossImg: 'images/story/boss_trapper.png',
                bossHp: 70,
                reward: { coins: 80 },
            },
            {
                id: 3,
                title: '하늘의 눈',
                npc: 'images/birds/bird2.png',
                intro: [
                    '나뭇가지에 새 한 마리가 앉아있었다.',
                    '날개가 꺾여 있었다.',
                    '',
                    '"도깨비한테 당했어."',
                    '새가 말했다.',
                    '"하늘에서 봤어. 섬이 어디에 있는지."',
                    '',
                    '"치료해줄게."',
                    '아기 고양이가 간식을 내밀었다.',
                ],
                outro: [
                    '새의 날개가 나았다.',
                    '"저쪽이야. 검은 섬."',
                    '',
                    '새가 가리킨 곳에',
                    '먹구름이 몰려있었다.',
                ],
                reqs: [{ type: 'bird', level: 2 }, { type: 'cat_snack', level: 2 }],
                bossName: '도깨비 궁수',
                bossImg: 'images/story/boss_archer.png',
                bossHp: 90,
                reward: { coins: 80, cards: 2 },
            },
            {
                id: 4,
                title: '검은 바다',
                npc: 'images/reptiles/reptile4.png',
                intro: [
                    '바다가 검게 물들어 있었다.',
                    '건널 수 없었다.',
                    '',
                    '그때 거북이가 수면 위로 올라왔다.',
                    '"타."',
                    '',
                    '"...믿어도 돼?"',
                    '"나도 잃은 게 있거든."',
                ],
                outro: [
                    '바다 위에서 섬이 점점 커졌다.',
                    '냄새가 났다. 불길한 냄새.',
                    '',
                    '거북이의 등이 떨렸다.',
                    '"...무서워."',
                    '"나도."',
                ],
                reqs: [{ type: 'reptile', level: 3 }, { type: 'fish', level: 2 }],
                bossName: '바다 도깨비',
                bossImg: 'images/story/boss_pirate.png',
                bossHp: 120,
                reward: { coins: 100, diamonds: 2 },
            },
            {
                id: 5,
                title: '도깨비섬',
                npc: 'images/cats/cat1.png',
                intro: [
                    '섬에 발을 디딘 순간, 냄새가 났다.',
                    '비린내. 그리고 다른 무언가.',
                    '',
                    '길 양옆에 뼈가 흩어져 있었다.',
                    '작은 뼈. 동물의 뼈.',
                    '',
                    '"...이거..."',
                    '아기 강아지가 말을 잇지 못했다.',
                    '',
                    '새가 고개를 돌렸다.',
                    '깃털 하나가 땅에 떨어졌다.',
                    '같은 종류의 깃털이었다.',
                    '',
                    '"가자."',
                    '아기 고양이가 말했다.',
                    '목소리가 떨리지 않도록 애썼다.',
                ],
                outro: [
                    '동굴 입구가 보였다.',
                    '안에서 숨소리가 들렸다.',
                    '',
                    '큰 숨소리.',
                ],
                reqs: [{ type: 'cat', level: 5 }, { type: 'dog', level: 4 }],
                bossName: '도깨비 문지기',
                bossImg: 'images/story/boss_guard.png',
                bossHp: 160,
                reward: { coins: 120, cards: 3 },
            },
            {
                id: 6,
                title: '도깨비',
                npc: 'images/cats/cat1.png',
                intro: [
                    '동굴 안은 어두웠다.',
                    '숨소리만 들렸다. 자기 것인지 다른 것인지.',
                    '',
                    '그것이 돌아보았다.',
                    '',
                    '거대한 들쥐.',
                    '사람 키의 세 배는 되는 몸.',
                    '핏빛 눈.',
                    '이빨 사이에 깃털이 끼어있었다.',
                    '',
                    '"...!"',
                    '',
                    '도깨비가 웃었다.',
                    '배가 고프다는 뜻이었다.',
                ],
                outro: [
                    '아기 고양이가 할퀴었다.',
                    '강아지가 물었다.',
                    '새가 눈을 찔렀다.',
                    '',
                    '도깨비가 비틀거렸다.',
                    '그리고 쓰러졌다.',
                    '',
                    '동굴 안쪽에서 울음소리가 들렸다.',
                    '갇혀있던 동물들이었다.',
                    '',
                    '살아있었다. 전부.',
                ],
                reqs: [{ type: 'cat', level: 6 }, { type: 'dog', level: 5 }, { type: 'bird', level: 3 }],
                bossName: '도깨비 두목',
                bossImg: 'images/story/boss_king.png',
                bossHp: 200,
                reward: { coins: 200, diamonds: 5 },
            },
            {
                id: 7,
                title: '귀환',
                npc: 'images/cats/cat1.png',
                intro: [
                    '돌아가는 길은 올 때보다 짧았다.',
                    '아마 같이 걷는 사람이 많아서.',
                    '',
                    '구출된 동물들이 웃고 있었다.',
                    '울고 있는 동물도 있었다.',
                    '감사하다고. 고맙다고.',
                ],
                outro: [
                    '마을이 다시 시끄러워졌다.',
                    '삼색이 언니가 울면서 안아줬다.',
                    '시바가 꼬리를 흔들었다.',
                    '',
                    '아기 고양이는 웃었다.',
                    '모든 게 끝난 줄 알았다.',
                    '',
                    '...그날 밤.',
                    '바다 너머에서 울음소리가 들렸다.',
                    '도깨비의 울음이 아니었다.',
                    '더 크고, 더 깊은 무언가.',
                    '',
                    '아기 고양이는 잠들지 못했다.',
                    '',
                    '                    ─ Chapter 1. 끝 ─',
                    '            (Chapter 2: "바다 너머의 것" — coming soon)',
                ],
                reqs: [{ type: 'cat', level: 3 }, { type: 'dog', level: 3 }],
                bossName: '도깨비 잔당',
                bossImg: 'images/story/boss_remnants.png',
                bossHp: 100,
                reward: { coins: 300, diamonds: 5 },
            },
        ],
    },
];
