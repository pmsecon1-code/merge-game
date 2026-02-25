// ============================================
// scripts/extract-balance.js
// Zoo Revival Phase 0: constants.js 밸런스 데이터 → JSON 추출
// ============================================

import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { createContext, runInContext } from 'vm';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'balance-data');

const VERSION = '4.37.1';
const EXTRACTED_AT = new Date().toISOString();

// ============================================
// vm 컨텍스트에 constants.js 로드
// ============================================

function loadCtx() {
    const ctx = {
        ICON: new Proxy({}, { get: () => '' }),
        genLevels: { cat: 1, dog: 1, bird: 1, fish: 1, reptile: 1, dinosaur: 1 },
        console,
        Math,
        Date,
        Array,
        Object,
        String,
        Number,
        JSON,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        Proxy,
    };

    let code = readFileSync(resolve(ROOT, 'js/constants.js'), 'utf8');
    // const는 블록 스코프 → vm context에 미노출. 제거하면 전역 프로퍼티로 등록됨
    code = code.replace(/^const /gm, '');
    runInContext(code, createContext(ctx));
    return ctx;
}

// ============================================
// 공통: emoji 필드 제거
// ============================================

function stripEmoji(arr) {
    return arr.map(({ emoji: _e, ...rest }) => rest);
}

// ============================================
// 추출 함수들
// ============================================

function extractAnimals(ctx) {
    return {
        version: VERSION,
        extractedAt: EXTRACTED_AT,
        animals: {
            cat: stripEmoji(ctx.CATS),
            dog: stripEmoji(ctx.DOGS),
            bird: stripEmoji(ctx.BIRDS),
            fish: stripEmoji(ctx.FISH),
            reptile: stripEmoji(ctx.REPTILES),
            dinosaur: stripEmoji(ctx.DINOSAURS),
        },
        snacks: {
            cat_snack: stripEmoji(ctx.CAT_SNACKS),
            dog_snack: stripEmoji(ctx.DOG_SNACKS),
        },
        toys: {
            cat_toy: stripEmoji(ctx.CAT_TOYS),
            dog_toy: stripEmoji(ctx.DOG_TOYS),
        },
    };
}

function extractBalance(ctx) {
    return {
        version: VERSION,
        extractedAt: EXTRACTED_AT,
        grid: {
            GRID_COLS: ctx.GRID_COLS,
            BOARD_SIZE: ctx.BOARD_SIZE,
            STORAGE_SIZE: ctx.STORAGE_SIZE,
            SHOP_SIZE: ctx.SHOP_SIZE,
            BOARD_MISSION_START: ctx.BOARD_MISSION_START,
        },
        timing_ms: {
            SHOP_REFRESH_MS: ctx.SHOP_REFRESH_MS,
            GENERATOR_COOLDOWN_MS: ctx.GENERATOR_COOLDOWN_MS,
            TOAST_DURATION_MS: ctx.TOAST_DURATION_MS,
            MILESTONE_POPUP_MS: ctx.MILESTONE_POPUP_MS,
            DICE_DROP_POPUP_MS: ctx.DICE_DROP_POPUP_MS,
            DICE_RESULT_POPUP_MS: ctx.DICE_RESULT_POPUP_MS,
            DICE_SLOT_EFFECT_MS: ctx.DICE_SLOT_EFFECT_MS,
            DICE_MOVE_DELAY_MS: ctx.DICE_MOVE_DELAY_MS,
            QUEST_EXPIRE_MS: ctx.QUEST_EXPIRE_MS,
            COMBO_WINDOW_MS: ctx.COMBO_WINDOW_MS,
            PIGGY_BANK_TIMER_MS: ctx.PIGGY_BANK_TIMER_MS,
            BUBBLE_EXPIRE_MS: ctx.BUBBLE_EXPIRE_MS,
            CLOUD_SAVE_DEBOUNCE_MS: ctx.CLOUD_SAVE_DEBOUNCE_MS,
            ALBUM_CYCLE_MS: ctx.ALBUM_CYCLE_MS,
        },
        energy: {
            MAX_ENERGY: ctx.MAX_ENERGY,
            RECOVERY_SEC: ctx.RECOVERY_SEC,
            AD_ENERGY_AMOUNT: ctx.AD_ENERGY_AMOUNT,
        },
        costs: {
            UNLOCK_COST_BOARD: ctx.UNLOCK_COST_BOARD,
            CAGE_UPGRADE_COST: ctx.CAGE_UPGRADE_COST,
            SPECIAL_UPGRADE_COST: ctx.SPECIAL_UPGRADE_COST,
        },
        generator: {
            CAGE_MAX_LEVEL: ctx.CAGE_MAX_LEVEL,
            GENERATOR_MAX_CLICKS: ctx.GENERATOR_MAX_CLICKS,
            COOLDOWN_COIN_PER_SEC: ctx.COOLDOWN_COIN_PER_SEC,
            SPECIAL_COOLDOWNS: ctx.SPECIAL_COOLDOWNS,
        },
        quest: {
            SPECIAL_QUEST_REWARD: ctx.SPECIAL_QUEST_REWARD,
            QUEST_SNACK_CHANCE: ctx.QUEST_SNACK_CHANCE,
            QUEST_PIGGY_CHANCE: ctx.QUEST_PIGGY_CHANCE,
            QUEST_MULTI_BASE_CHANCE: ctx.QUEST_MULTI_BASE_CHANCE,
            QUEST_MULTI_LEVEL_FACTOR: ctx.QUEST_MULTI_LEVEL_FACTOR,
            QUEST_MULTI_MAX_CHANCE: ctx.QUEST_MULTI_MAX_CHANCE,
            QUEST_LEVEL_WEIGHTS: ctx.QUEST_LEVEL_WEIGHTS,
            QUEST_COUNT_MISSION_GOAL: ctx.QUEST_COUNT_MISSION_GOAL,
        },
        lucky_drop: {
            LUCKY_BASE_CHANCE: ctx.LUCKY_BASE_CHANCE,
            LUCKY_LEVEL_BONUS: ctx.LUCKY_LEVEL_BONUS,
            LUCKY_SNACK_CHANCE: ctx.LUCKY_SNACK_CHANCE,
        },
        piggy_bank: {
            PIGGY_BANK_MIN_COINS: ctx.PIGGY_BANK_MIN_COINS,
            PIGGY_BANK_MAX_COINS: ctx.PIGGY_BANK_MAX_COINS,
        },
        bubble: {
            BUBBLE_MIN_LEVEL: ctx.BUBBLE_MIN_LEVEL,
            BUBBLE_CHANCE: ctx.BUBBLE_CHANCE,
            BUBBLE_DIAMOND_PER_LEVEL: ctx.BUBBLE_DIAMOND_PER_LEVEL,
        },
        snack: {
            SNACK_CHANCE: ctx.SNACK_CHANCE,
        },
        album: {
            ALBUM_CARD_COST: ctx.ALBUM_CARD_COST,
            ALBUM_DRAW_COUNT: ctx.ALBUM_DRAW_COUNT,
            ALBUM_CARD_CHANCE: ctx.ALBUM_CARD_CHANCE,
            ALBUM_CARD_MIN: ctx.ALBUM_CARD_MIN,
            ALBUM_CARD_MAX: ctx.ALBUM_CARD_MAX,
            ALBUM_DUPE_REWARD: ctx.ALBUM_DUPE_REWARD,
            ALBUM_COMPLETE_COINS: ctx.ALBUM_COMPLETE_COINS,
            ALBUM_ALL_COMPLETE_DIAMONDS: ctx.ALBUM_ALL_COMPLETE_DIAMONDS,
        },
        story: {
            STORY_UNLOCK_LEVEL: ctx.STORY_UNLOCK_LEVEL,
            STORY_BOSS_HP_BASE: ctx.STORY_BOSS_HP_BASE,
        },
        misc: {
            MAX_NAME_LENGTH: ctx.MAX_NAME_LENGTH,
            DAILY_COMPLETE_REWARD: ctx.DAILY_COMPLETE_REWARD,
        },
    };
}

function extractRewards(ctx) {
    // DAILY_MISSIONS: icon 필드(HTML) 제거, id만 유지
    const dailyMissions = ctx.DAILY_MISSIONS.map((tier) =>
        tier.map(({ icon: _i, ...rest }) => rest)
    );

    return {
        version: VERSION,
        extractedAt: EXTRACTED_AT,
        dice: {
            DICE_TRIP_SIZE: ctx.DICE_TRIP_SIZE,
            DICE_DROP_CHANCE: ctx.DICE_DROP_CHANCE,
            DICE_TRIP_COMPLETE_REWARD: ctx.DICE_TRIP_COMPLETE_REWARD,
            DICE_TRIP_REWARDS: ctx.DICE_TRIP_REWARDS,
        },
        attendance: {
            rewards: ctx.ATTENDANCE_REWARDS,
        },
        daily_missions: {
            tiers: dailyMissions,
            DAILY_COMPLETE_REWARD: ctx.DAILY_COMPLETE_REWARD,
        },
    };
}

function extractExplore(ctx) {
    return {
        version: VERSION,
        extractedAt: EXTRACTED_AT,
        config: {
            EXPLORE_MAP_SIZE: ctx.EXPLORE_MAP_SIZE,
            EXPLORE_TILE_COUNT: ctx.EXPLORE_TILE_COUNT,
            EXPLORE_UNLOCK_LEVEL: ctx.EXPLORE_UNLOCK_LEVEL,
            EXPLORE_BASE_COST: ctx.EXPLORE_BASE_COST,
            EXPLORE_COST_INCREMENT: ctx.EXPLORE_COST_INCREMENT,
        },
        fossils: ctx.EXPLORE_FOSSILS,
        milestones: ctx.EXPLORE_MILESTONES,
        map: ctx.EXPLORE_MAP,
    };
}

function extractStory(ctx) {
    // 보스 HP 테이블 계산 (EP.1~7)
    const bossHpTable = {};
    for (let ep = 1; ep <= 7; ep++) {
        bossHpTable[`ep${ep}`] = ctx.STORY_BOSS_HP_BASE * ep;
    }

    return {
        version: VERSION,
        extractedAt: EXTRACTED_AT,
        config: {
            STORY_UNLOCK_LEVEL: ctx.STORY_UNLOCK_LEVEL,
            STORY_BOSS_HP_BASE: ctx.STORY_BOSS_HP_BASE,
        },
        boss_hp_table: bossHpTable,
        scenes: ctx.STORY_IMAGES,
    };
}

function extractAlbum(ctx) {
    // ALBUM_THEMES: emoji 필드 제거 (photos), icon은 테마 식별자라 유지
    const themes = ctx.ALBUM_THEMES.map((theme) => ({
        ...theme,
        photos: theme.photos.map(({ emoji: _e, ...rest }) => rest),
    }));

    return {
        version: VERSION,
        extractedAt: EXTRACTED_AT,
        config: {
            ALBUM_CARD_COST: ctx.ALBUM_CARD_COST,
            ALBUM_DRAW_COUNT: ctx.ALBUM_DRAW_COUNT,
            ALBUM_CARD_CHANCE: ctx.ALBUM_CARD_CHANCE,
            ALBUM_DUPE_REWARD: ctx.ALBUM_DUPE_REWARD,
            ALBUM_COMPLETE_COINS: ctx.ALBUM_COMPLETE_COINS,
            ALBUM_ALL_COMPLETE_DIAMONDS: ctx.ALBUM_ALL_COMPLETE_DIAMONDS,
        },
        themes,
    };
}

function buildLookupTables(ctx) {
    // getLevelUpGoal(1~150)
    const levelUpGoal = {};
    for (let lv = 1; lv <= 150; lv++) {
        levelUpGoal[lv] = ctx.getLevelUpGoal(lv);
    }

    // getLevelUpReward(1~150)
    const levelUpReward = {};
    for (let lv = 1; lv <= 150; lv++) {
        levelUpReward[lv] = ctx.getLevelUpReward(lv);
    }

    // getMaxLevel per type
    const maxLevels = {};
    const types = ['cat', 'dog', 'bird', 'fish', 'reptile', 'dinosaur', 'cat_snack', 'dog_snack', 'cat_toy', 'dog_toy'];
    for (const type of types) {
        maxLevels[type] = ctx.getMaxLevel(type);
    }

    // getExploreCost(0~48): revealedCount 0 → 첫 타일 비용
    const exploreCosts = {};
    for (let i = 0; i <= 48; i++) {
        exploreCosts[i] = ctx.getExploreCost(i);
    }

    // generatorNames
    const generatorNames = ctx.GENERATOR_NAMES;

    return {
        version: VERSION,
        extractedAt: EXTRACTED_AT,
        level_up_goal: levelUpGoal,
        level_up_reward: levelUpReward,
        max_levels: maxLevels,
        explore_costs: exploreCosts,
        generator_names: generatorNames,
    };
}

// ============================================
// 메인 실행
// ============================================

function save(filename, data) {
    const path = resolve(OUT_DIR, filename);
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
    console.log(`  ✓ ${filename}`);
}

function main() {
    console.log('Zoo Revival Phase 0: 밸런스 데이터 추출 중...\n');

    // 출력 폴더 생성
    mkdirSync(OUT_DIR, { recursive: true });

    // constants.js 로드
    const ctx = loadCtx();

    // 7개 JSON 추출
    save('animals.json', extractAnimals(ctx));
    save('balance.json', extractBalance(ctx));
    save('rewards.json', extractRewards(ctx));
    save('explore.json', extractExplore(ctx));
    save('story.json', extractStory(ctx));
    save('album.json', extractAlbum(ctx));
    save('lookup-tables.json', buildLookupTables(ctx));

    console.log('\n완료: balance-data/ 폴더에 7개 JSON 생성됨');

    // 스팟 체크
    console.log('\n[스팟 체크]');
    console.log(`  getLevelUpGoal(1) = ${ctx.getLevelUpGoal(1)} (기대값: 2)`);
    console.log(`  CATS.length = ${ctx.CATS.length} (기대값: 11)`);
    console.log(`  DICE_TRIP_REWARDS.length = ${ctx.DICE_TRIP_REWARDS.length} (기대값: 50)`);
}

main();
