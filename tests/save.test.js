import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadSave } from './helpers/loadSave.js';

describe('save.js 검증 함수', () => {
    let ctx;

    beforeEach(() => {
        ctx = loadSave();
    });

    // --- sanitizeForFirestore ---
    describe('sanitizeForFirestore(data)', () => {
        it('top-level undefined → undefined (변환 대상 아님)', () => {
            expect(ctx.sanitizeForFirestore(undefined)).toBeUndefined();
        });

        it('NaN → 0', () => {
            expect(ctx.sanitizeForFirestore(NaN)).toBe(0);
        });

        it('일반 값 유지', () => {
            expect(ctx.sanitizeForFirestore(42)).toBe(42);
            expect(ctx.sanitizeForFirestore('hello')).toBe('hello');
            expect(ctx.sanitizeForFirestore(true)).toBe(true);
            expect(ctx.sanitizeForFirestore(null)).toBeNull();
        });

        it('배열 내 undefined → null', () => {
            const result = ctx.sanitizeForFirestore([1, undefined, 3]);
            expect(result).toEqual([1, null, 3]);
        });

        it('객체 내 undefined → null', () => {
            const result = ctx.sanitizeForFirestore({ a: 1, b: undefined });
            expect(result).toEqual({ a: 1, b: null });
        });

        it('중첩 객체 재귀 처리', () => {
            const result = ctx.sanitizeForFirestore({
                nested: { value: undefined, num: NaN },
                arr: [undefined, { deep: undefined }],
            });
            expect(result).toEqual({
                nested: { value: null, num: 0 },
                arr: [null, { deep: null }],
            });
        });
    });

    // --- clampSaveData ---
    describe('clampSaveData(data)', () => {
        it('coins 음수 → 0', () => {
            const data = { coins: -100 };
            ctx.clampSaveData(data);
            expect(data.coins).toBe(0);
        });

        it('coins 초과 → 9999999', () => {
            const data = { coins: 99999999 };
            ctx.clampSaveData(data);
            expect(data.coins).toBe(9999999);
        });

        it('energy 999 초과 → 999', () => {
            const data = { energy: 1500 };
            ctx.clampSaveData(data);
            expect(data.energy).toBe(999);
        });

        it('userLevel 0 → 1', () => {
            const data = { userLevel: 0 };
            ctx.clampSaveData(data);
            expect(data.userLevel).toBe(1);
        });

        it('NaN 값 → 최소값', () => {
            const data = { coins: NaN };
            ctx.clampSaveData(data);
            expect(data.coins).toBe(0);
        });

        it('boardState 35초과 → 잘림', () => {
            const data = { boardState: new Array(40).fill(null) };
            ctx.clampSaveData(data);
            expect(data.boardState).toHaveLength(35);
        });

        it('quests 10초과 → 잘림', () => {
            const data = { quests: new Array(15).fill({}) };
            ctx.clampSaveData(data);
            expect(data.quests).toHaveLength(10);
        });

        it('정상 범위 값 유지', () => {
            const data = { coins: 500, energy: 50, userLevel: 10 };
            ctx.clampSaveData(data);
            expect(data.coins).toBe(500);
            expect(data.energy).toBe(50);
            expect(data.userLevel).toBe(10);
        });

        it('storyProgress 하위 배열 클램핑', () => {
            const data = {
                storyProgress: {
                    unlockedImages: new Array(35).fill(0),
                    bosses: new Array(15).fill({}),
                },
            };
            ctx.clampSaveData(data);
            expect(data.storyProgress.unlockedImages).toHaveLength(30);
            expect(data.storyProgress.bosses).toHaveLength(10);
        });

        it('반환값 = 입력 객체', () => {
            const data = { coins: 100 };
            const result = ctx.clampSaveData(data);
            expect(result).toBe(data);
        });
    });

    // --- isValidSaveData ---
    describe('isValidSaveData(data)', () => {
        it('boardState 없음 → false', () => {
            expect(ctx.isValidSaveData({})).toBe(false);
        });

        it('boardState 배열 아님 → false', () => {
            expect(ctx.isValidSaveData({ boardState: 'not array' })).toBe(false);
        });

        it('boardState 길이 불일치 → false', () => {
            expect(ctx.isValidSaveData({ boardState: new Array(10).fill(null) })).toBe(false);
        });

        it('생성기 없음 → false', () => {
            const data = { boardState: new Array(35).fill(null) };
            expect(ctx.isValidSaveData(data)).toBe(false);
        });

        it('정상 데이터 → true', () => {
            const board = new Array(35).fill(null);
            board[0] = { type: 'cat_generator' };
            expect(ctx.isValidSaveData({ boardState: board })).toBe(true);
        });
    });

    // --- diagnoseSaveData ---
    describe('diagnoseSaveData(data)', () => {
        it('정상 데이터 → 빈 배열', () => {
            const data = {
                coins: 100,
                diamonds: 50,
                energy: 80,
                userLevel: 5,
                cumulativeCoins: 1000,
                questProgress: 3,
                boardState: new Array(35).fill(null),
                storageState: new Array(5).fill(null),
                quests: [],
                shopItems: [],
                discoveredItems: [],
                cards: 10,
                album: [],
                diceTripPosition: 5,
                diceCount: 3,
                visitedSteps: [0, 1, 2],
                tutorialStep: 0,
                savedAt: Date.now(),
            };
            const failures = ctx.diagnoseSaveData(data);
            expect(failures).toEqual([]);
        });

        it('coins 음수 → 실패 항목 포함', () => {
            const data = {
                coins: -1,
                diamonds: 0,
                energy: 50,
                userLevel: 1,
                cumulativeCoins: 0,
                questProgress: 0,
                boardState: [],
                storageState: [],
                quests: [],
                shopItems: [],
                discoveredItems: [],
                cards: 0,
                album: [],
                diceTripPosition: 0,
                diceCount: 0,
                visitedSteps: [],
                tutorialStep: 0,
                savedAt: Date.now(),
            };
            const failures = ctx.diagnoseSaveData(data);
            expect(failures.some((f) => f.includes('coins'))).toBe(true);
        });

        it('필수 키 누락 → hasAll 실패', () => {
            const failures = ctx.diagnoseSaveData({});
            expect(failures.some((f) => f.includes('hasAll'))).toBe(true);
        });

        it('savedAt 미래 시간 → 실패', () => {
            const data = {
                coins: 0,
                diamonds: 0,
                energy: 50,
                userLevel: 1,
                cumulativeCoins: 0,
                questProgress: 0,
                boardState: [],
                storageState: [],
                quests: [],
                shopItems: [],
                discoveredItems: [],
                cards: 0,
                album: [],
                diceTripPosition: 0,
                diceCount: 0,
                visitedSteps: [],
                tutorialStep: 0,
                savedAt: Date.now() + 999999999,
            };
            const failures = ctx.diagnoseSaveData(data);
            expect(failures.some((f) => f.includes('savedAt'))).toBe(true);
        });
    });

    // --- validateGameData ---
    describe('validateGameData(data)', () => {
        it('coins 상한 초과 → 클램핑', () => {
            const data = {
                coins: 99999999,
                boardState: new Array(35).fill(null),
                storageState: new Array(5).fill(null),
                quests: [],
                shopItems: [],
                album: [],
            };
            const result = ctx.validateGameData(data);
            expect(result.coins).toBe(9999999);
        });

        it('energy 음수 → 0', () => {
            const data = {
                energy: -10,
                boardState: new Array(35).fill(null),
                storageState: new Array(5).fill(null),
                quests: [],
                shopItems: [],
                album: [],
            };
            const result = ctx.validateGameData(data);
            expect(result.energy).toBe(0);
        });

        it('savedAt 미래 → 현재로 보정', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-20T12:00:00Z'));

            const ctx2 = loadSave();
            const future = Date.now() + 999999999;
            const data = {
                savedAt: future,
                boardState: new Array(35).fill(null),
                storageState: new Array(5).fill(null),
                quests: [],
                shopItems: [],
                album: [],
            };
            const result = ctx2.validateGameData(data);
            expect(result.savedAt).toBeLessThanOrEqual(Date.now() + 1000);

            vi.useRealTimers();
        });

        it('boardState 길이 부족 → null 패딩', () => {
            const data = {
                boardState: [null, null],
                storageState: new Array(5).fill(null),
                quests: [],
                shopItems: [],
                album: [],
            };
            const result = ctx.validateGameData(data);
            expect(result.boardState).toHaveLength(35);
        });

        it('boardState 배열 아님 → null', () => {
            const data = {
                boardState: 'invalid',
                storageState: new Array(5).fill(null),
                quests: [],
                shopItems: [],
                album: [],
            };
            const result = ctx.validateGameData(data);
            expect(result.boardState).toBeNull();
        });

        it('storyProgress.unlockedImages 초과 → 잘림', () => {
            const data = {
                boardState: new Array(35).fill(null),
                storageState: new Array(5).fill(null),
                quests: [],
                shopItems: [],
                album: [],
                storyProgress: {
                    unlockedImages: new Array(40).fill(0),
                    bosses: [],
                },
            };
            const result = ctx.validateGameData(data);
            expect(result.storyProgress.unlockedImages).toHaveLength(30);
        });

        it('정상 데이터 → 그대로 반환', () => {
            const data = {
                coins: 500,
                diamonds: 50,
                energy: 100,
                userLevel: 10,
                boardState: new Array(35).fill(null),
                storageState: new Array(5).fill(null),
                quests: [{}],
                shopItems: [{}],
                album: ['0_1'],
                savedAt: Date.now(),
            };
            const result = ctx.validateGameData(data);
            expect(result.coins).toBe(500);
            expect(result.diamonds).toBe(50);
        });
    });
});
