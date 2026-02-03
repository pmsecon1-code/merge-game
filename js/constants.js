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
const SHOP_REFRESH_MS = 300000;  // 5분

// --- 에너지 설정 ---
const MAX_ENERGY = 100;
const RECOVERY_SEC = 30;

// --- 비용 설정 ---
const UNLOCK_COST_BOARD = 100;
const ENERGY_COST = 500;
const CAGE_UPGRADE_COST = 1000;
const FIRE_EXTINGUISH_COST = 100;

// --- 보상 설정 ---
const RESCUE_QUEST_REWARD = 500;
const FIRE_EXTINGUISH_REWARD = 100;
const SPECIAL_QUEST_GOAL = 1000;
const SPECIAL_QUEST_STEP = 200;
const SPECIAL_QUEST_REWARD_COINS = 50;

// --- 게임 밸런스 ---
const CAGE_MAX_LEVEL = 5;
const SNACK_CHANCE = 0.15;
const ANIMAL_HP_DECAY = 2;
const ANIMAL_HP_DECAY_SEC = 10;

// --- 룰렛 설정 ---
const ROULETTE_SEGMENTS = [0, 70, 30, 50, 90, 100];
const ROULETTE_COLORS = ['#dbeafe', '#3b82f6', '#93c5fd', '#60a5fa', '#1d4ed8', '#1e3a8a'];

// --- NPC 아바타 ---
const NPC_AVATARS = ["👩‍🌾", "👨‍🍳", "👮‍♀️", "🧙‍♂️", "👸", "🕵️‍♂️", "🎅", "🧑‍🚀", "👨‍🎨", "🦸‍♀️"];

// --- 상시 미션 설정 ---
const PM_GOALS = [100, 200];
const PM_TITLES = ['100번 합성하기', '200번 생성하기'];
const PM_ICONS = ['🔨', '✨'];
const PM_REWARD = 100;

// ============================================
// 동물 데이터
// ============================================

const CATS = [
    { level: 1, emoji: "🐱", name: "아기 냥이", color: "#fecdd3" },
    { level: 2, emoji: "🐈", name: "얼룩 냥이", color: "#a3e635" },
    { level: 3, emoji: "🐈‍⬛", name: "검은 냥이", color: "#a1a1aa" },
    { level: 4, emoji: "😹", name: "웃음 냥이", color: "#38bdf8" },
    { level: 5, emoji: "😾", name: "뾰로통 냥이", color: "#fb923c" },
    { level: 6, emoji: "😻", name: "사랑 냥이", color: "#f472b6" },
    { level: 7, emoji: "😼", name: "시크 냥이", color: "#a78bfa" },
    { level: 8, emoji: "🙀", name: "깜짝 냥이", color: "#fde047" },
    { level: 9, emoji: "😽", name: "뽀뽀 냥이", color: "#2dd4bf" },
    { level: 10, emoji: "🐯", name: "호랑이", color: "#fbbf24" },
    { level: 11, emoji: "🦁", name: "사자 왕", color: "#ef4444" }
];

const DOGS = [
    { level: 1, emoji: "🐶", name: "아기 멍멍", color: "#fecdd3" },
    { level: 2, emoji: "🐕", name: "누렁이", color: "#fcd34d" },
    { level: 3, emoji: "🐩", name: "푸들", color: "#e9d5ff" },
    { level: 4, emoji: "🦮", name: "안내견", color: "#86efac" },
    { level: 5, emoji: "🐕‍🦺", name: "듬직견", color: "#38bdf8" },
    { level: 6, emoji: "🐺", name: "늑대", color: "#94a3b8" },
    { level: 7, emoji: "🦊", name: "여우", color: "#fb923c" },
    { level: 8, emoji: "🦝", name: "너구리", color: "#a78bfa" },
    { level: 9, emoji: "🐼", name: "팬더", color: "#1e293b" },
    { level: 10, emoji: "🐻", name: "곰돌이", color: "#92400e" },
    { level: 11, emoji: "🐻‍❄️", name: "북극곰", color: "#e0f2fe" }
];

const BIRDS = [
    { level: 1, emoji: "🐣", name: "아기새", color: "#bae6fd" },
    { level: 2, emoji: "🐤", name: "병아리", color: "#fde047" },
    { level: 3, emoji: "🐦", name: "파랑새", color: "#60a5fa" },
    { level: 4, emoji: "🕊️", name: "비둘기", color: "#e2e8f0" },
    { level: 5, emoji: "🦢", name: "백조", color: "#f8fafc" },
    { level: 6, emoji: "🦅", name: "독수리", color: "#78350f" },
    { level: 7, emoji: "🦚", name: "공작", color: "#10b981" }
];

const FISH = [
    { level: 1, emoji: "🐟", name: "송사리", color: "#bae6fd" },
    { level: 2, emoji: "🐠", name: "열대어", color: "#fde047" },
    { level: 3, emoji: "🐡", name: "복어", color: "#fbbf24" },
    { level: 4, emoji: "🦑", name: "오징어", color: "#f87171" },
    { level: 5, emoji: "🐙", name: "문어", color: "#ef4444" },
    { level: 6, emoji: "🦈", name: "상어", color: "#94a3b8" },
    { level: 7, emoji: "🐳", name: "고래", color: "#3b82f6" }
];

const REPTILES = [
    { level: 1, emoji: "🐸", name: "개구리", color: "#86efac" },
    { level: 2, emoji: "🦎", name: "도마뱀", color: "#4ade80" },
    { level: 3, emoji: "🐍", name: "뱀", color: "#16a34a" },
    { level: 4, emoji: "🐢", name: "거북이", color: "#15803d" },
    { level: 5, emoji: "🐊", name: "악어", color: "#14532d" },
    { level: 6, emoji: "🦕", name: "브라키오", color: "#60a5fa" },
    { level: 7, emoji: "🐉", name: "드래곤", color: "#ef4444" }
];

// ============================================
// 간식 데이터
// ============================================

const CAT_SNACKS = [
    { level: 1, emoji: "🥛", name: "우유", color: "#fce7f3" },
    { level: 2, emoji: "🐟", name: "멸치", color: "#fbcfe8" },
    { level: 3, emoji: "🥫", name: "통조림", color: "#f9a8d4" },
    { level: 4, emoji: "🍡", name: "츄르", color: "#f472b6" },
    { level: 5, emoji: "🌿", name: "캣닢", color: "#ec4899" }
];

const DOG_SNACKS = [
    { level: 1, emoji: "🦴", name: "뼈다귀", color: "#e0f2fe" },
    { level: 2, emoji: "🥖", name: "개껌", color: "#bae6fd" },
    { level: 3, emoji: "🥩", name: "육포", color: "#7dd3fc" },
    { level: 4, emoji: "🌭", name: "소세지", color: "#38bdf8" },
    { level: 5, emoji: "🍖", name: "스테이크", color: "#0ea5e9" }
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
        dog_snack: DOG_SNACKS
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
    return list.find(item => item.level === level) || null;
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
        reptile: '사육장'
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
        reptile: '파충류'
    };
    return names[type] || type;
}
