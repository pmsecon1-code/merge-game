// ============================================
// constants.js - 게임 상수 및 데이터
// ============================================

// --- 그리드 설정 ---
const GRID_COLS = 5;
const GRID_ROWS = 7;
const BOARD_SIZE = 35;
const STORAGE_SIZE = 5;
const APARTMENT_ROOMS = 3;
const SHOP_SIZE = 5;

// --- 시간 설정 (밀리초) ---
const SHOP_REFRESH_MS = 300000; // 5분

// --- 에너지 설정 ---
const MAX_ENERGY = 100;
const RECOVERY_SEC = 30;

// --- 비용 설정 ---
const UNLOCK_COST_BOARD = 100;
const ENERGY_COST = 500;
const CAGE_UPGRADE_COST = 1000;
const FIRE_EXTINGUISH_COST = 100;

// --- 보상 설정 ---
const RESCUE_QUEST_REWARD = 1000;
const FIRE_EXTINGUISH_REWARD = 100;
const SPECIAL_QUEST_GOAL = 1000;
const SPECIAL_QUEST_STEP = 200;
const SPECIAL_QUEST_REWARD_COINS = 50;

// --- 게임 밸런스 ---
const CAGE_MAX_LEVEL = 5;
const SNACK_CHANCE = 0.08;
const ANIMAL_HP_DECAY = 2;
const ANIMAL_HP_DECAY_SEC = 10;

// --- 룰렛 설정 ---
const ROULETTE_SEGMENTS = [0, 70, 30, 50, 90, 100];
const ROULETTE_COLORS = ['#dbeafe', '#3b82f6', '#93c5fd', '#60a5fa', '#1d4ed8', '#1e3a8a'];

// --- NPC 아바타 ---
const NPC_AVATARS = ['👩‍🌾', '👨‍🍳', '👮‍♀️', '🧙‍♂️', '👸', '🕵️‍♂️', '🎅', '🧑‍🚀', '👨‍🎨', '🦸‍♀️'];

// --- 상시 미션 설정 ---
const PM_GOALS = [100, 200];
const PM_TITLES = ['100번 합성하기', '200번 생성하기'];
const PM_ICONS = ['🔨', '✨'];
const PM_REWARD = 100;

// ============================================
// 동물 데이터
// ============================================

const CATS = [
    { level: 1, emoji: '🐱', name: '아기 냥이', color: '#fecdd3' },
    { level: 2, emoji: '🐈', name: '얼룩 냥이', color: '#a3e635' },
    { level: 3, emoji: '🐈‍⬛', name: '검은 냥이', color: '#a1a1aa' },
    { level: 4, emoji: '😹', name: '웃음 냥이', color: '#38bdf8' },
    { level: 5, emoji: '😾', name: '뾰로통 냥이', color: '#fb923c' },
    { level: 6, emoji: '😻', name: '사랑 냥이', color: '#f472b6' },
    { level: 7, emoji: '😼', name: '시크 냥이', color: '#a78bfa' },
    { level: 8, emoji: '🙀', name: '깜짝 냥이', color: '#fde047' },
    { level: 9, emoji: '😽', name: '뽀뽀 냥이', color: '#2dd4bf' },
    { level: 10, emoji: '🐯', name: '호랑이', color: '#fbbf24' },
    { level: 11, emoji: '🦁', name: '사자 왕', color: '#ef4444' },
];

const DOGS = [
    { level: 1, emoji: '🐶', name: '아기 멍멍', color: '#fecdd3' },
    { level: 2, emoji: '🐕', name: '누렁이', color: '#fcd34d' },
    { level: 3, emoji: '🐩', name: '푸들', color: '#e9d5ff' },
    { level: 4, emoji: '🦮', name: '안내견', color: '#86efac' },
    { level: 5, emoji: '🐕‍🦺', name: '듬직견', color: '#38bdf8' },
    { level: 6, emoji: '🐺', name: '늑대', color: '#94a3b8' },
    { level: 7, emoji: '🦊', name: '여우', color: '#fb923c' },
    { level: 8, emoji: '🦝', name: '너구리', color: '#a78bfa' },
    { level: 9, emoji: '🐼', name: '팬더', color: '#1e293b' },
    { level: 10, emoji: '🐻', name: '곰돌이', color: '#92400e' },
    { level: 11, emoji: '🐻‍❄️', name: '북극곰', color: '#e0f2fe' },
];

const BIRDS = [
    { level: 1, emoji: '🐣', name: '아기새', color: '#bae6fd' },
    { level: 2, emoji: '🐤', name: '병아리', color: '#fde047' },
    { level: 3, emoji: '🐦', name: '파랑새', color: '#60a5fa' },
    { level: 4, emoji: '🕊️', name: '비둘기', color: '#e2e8f0' },
    { level: 5, emoji: '🦢', name: '백조', color: '#f8fafc' },
    { level: 6, emoji: '🦅', name: '독수리', color: '#78350f' },
    { level: 7, emoji: '🦚', name: '공작', color: '#10b981' },
];

const FISH = [
    { level: 1, emoji: '🐟', name: '송사리', color: '#bae6fd' },
    { level: 2, emoji: '🐠', name: '열대어', color: '#fde047' },
    { level: 3, emoji: '🐡', name: '복어', color: '#fbbf24' },
    { level: 4, emoji: '🦑', name: '오징어', color: '#f87171' },
    { level: 5, emoji: '🐙', name: '문어', color: '#ef4444' },
    { level: 6, emoji: '🦈', name: '상어', color: '#94a3b8' },
    { level: 7, emoji: '🐳', name: '고래', color: '#3b82f6' },
];

const REPTILES = [
    { level: 1, emoji: '🐸', name: '개구리', color: '#86efac' },
    { level: 2, emoji: '🦎', name: '도마뱀', color: '#4ade80' },
    { level: 3, emoji: '🐍', name: '뱀', color: '#16a34a' },
    { level: 4, emoji: '🐢', name: '거북이', color: '#15803d' },
    { level: 5, emoji: '🐊', name: '악어', color: '#14532d' },
    { level: 6, emoji: '🦕', name: '브라키오', color: '#60a5fa' },
    { level: 7, emoji: '🐉', name: '드래곤', color: '#ef4444' },
];

// ============================================
// 간식 데이터
// ============================================

const CAT_SNACKS = [
    { level: 1, emoji: '🥛', name: '우유', color: '#fce7f3' },
    { level: 2, emoji: '🐟', name: '멸치', color: '#fbcfe8' },
    { level: 3, emoji: '🥫', name: '통조림', color: '#f9a8d4' },
    { level: 4, emoji: '🍡', name: '츄르', color: '#f472b6' },
    { level: 5, emoji: '🌿', name: '캣닢', color: '#ec4899' },
];

const DOG_SNACKS = [
    { level: 1, emoji: '🦴', name: '뼈다귀', color: '#e0f2fe' },
    { level: 2, emoji: '🥖', name: '개껌', color: '#bae6fd' },
    { level: 3, emoji: '🥩', name: '육포', color: '#7dd3fc' },
    { level: 4, emoji: '🌭', name: '소세지', color: '#38bdf8' },
    { level: 5, emoji: '🍖', name: '스테이크', color: '#0ea5e9' },
];

// ============================================
// 장난감 데이터
// ============================================

const CAT_TOYS = [
    { level: 1, emoji: '🧶', name: '털실', color: '#fce7f3' },
    { level: 2, emoji: '🪶', name: '깃털', color: '#fbcfe8' },
    { level: 3, emoji: '🐭', name: '쥐인형', color: '#f9a8d4' },
    { level: 4, emoji: '🎣', name: '낚싯대', color: '#f472b6' },
    { level: 5, emoji: '🏠', name: '숨숨집', color: '#ec4899' },
];

const DOG_TOYS = [
    { level: 1, emoji: '🎾', name: '공', color: '#d9f99d' },
    { level: 2, emoji: '🦆', name: '오리인형', color: '#bef264' },
    { level: 3, emoji: '🥏', name: '프리스비', color: '#a3e635' },
    { level: 4, emoji: '🪢', name: '터그로프', color: '#84cc16' },
    { level: 5, emoji: '🛝', name: '미끄럼틀', color: '#65a30d' },
];

// ============================================
// 앨범 데이터
// ============================================

const ALBUM_CARD_COST = 30;
const ALBUM_DRAW_COUNT = 2;
const ALBUM_CARD_CHANCE = 0.3;
const ALBUM_CARD_MIN = 1;
const ALBUM_CARD_MAX = 5;
const ALBUM_DUPE_REWARD = { N: 3, R: 8, SR: 20 };
const ALBUM_COMPLETE_COINS = 500;
const ALBUM_ALL_COMPLETE_DIAMONDS = 100;
const ALBUM_CYCLE_MS = 14 * 24 * 60 * 60 * 1000; // 14일

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
