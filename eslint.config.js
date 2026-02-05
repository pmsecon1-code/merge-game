import globals from 'globals';
import html from 'eslint-plugin-html';
import prettier from 'eslint-config-prettier';

export default [
    {
        ignores: ['eslint.config.js', 'node_modules/**'],
    },
    {
        files: ['js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            // constants.js는 전역 제공 파일이므로 unused 경고 무시
            'no-unused-vars': 'off',
            'no-var': 'warn',
            'prefer-const': 'warn',
            eqeqeq: ['warn', 'always'],
            'no-console': 'off',
        },
    },
    {
        files: ['**/*.html'],
        plugins: { html },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                firebase: 'readonly',
                // constants.js globals
                BOARD_SIZE: 'readonly',
                STORAGE_SIZE: 'readonly',
                APARTMENT_ROOMS: 'readonly',
                SHOP_SIZE: 'readonly',
                SHOP_REFRESH_MS: 'readonly',
                MAX_ENERGY: 'readonly',
                RECOVERY_SEC: 'readonly',
                UNLOCK_COST_BOARD: 'readonly',
                ENERGY_COST: 'readonly',
                CAGE_UPGRADE_COST: 'readonly',
                CAGE_MAX_LEVEL: 'readonly',
                FIRE_EXTINGUISH_COST: 'readonly',
                RESCUE_QUEST_REWARD: 'readonly',
                FIRE_EXTINGUISH_REWARD: 'readonly',
                SPECIAL_QUEST_GOAL: 'readonly',
                SPECIAL_QUEST_STEP: 'readonly',
                GRID_COLS: 'readonly',
                GRID_ROWS: 'readonly',
                CATS: 'readonly',
                DOGS: 'readonly',
                BIRDS: 'readonly',
                FISH: 'readonly',
                REPTILES: 'readonly',
                CAT_SNACKS: 'readonly',
                DOG_SNACKS: 'readonly',
                CAT_TOYS: 'readonly',
                DOG_TOYS: 'readonly',
                NPC_AVATARS: 'readonly',
                PM_GOALS: 'readonly',
                ROULETTE_SEGMENTS: 'readonly',
                QUEST_BASE_REWARD: 'readonly',
                QUEST_MULTIPLIERS: 'readonly',
                SNACK_CHANCE: 'readonly',
                TOY_CHANCE: 'readonly',
                getItemData: 'readonly',
                getMaxLevel: 'readonly',
                getItemLabel: 'readonly',
            },
        },
        rules: {
            // onclick 등 HTML 이벤트 핸들러에서 호출하는 함수는 false positive
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^(handle|start|close|scroll|complete|buy|upgrade|open|toggle|sell|show)',
                },
            ],
            'no-var': 'warn',
            'prefer-const': 'warn',
            eqeqeq: ['warn', 'always'],
            'no-console': 'off',
        },
    },
    prettier,
];
