import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadConstants } from './helpers/loadConstants.js';

describe('constants.js 헬퍼 함수', () => {
    let ctx;

    beforeEach(() => {
        ctx = loadConstants();
    });

    // --- getLevelUpGoal ---
    describe('getLevelUpGoal(lv)', () => {
        it('Lv.1 → 2', () => {
            expect(ctx.getLevelUpGoal(1)).toBe(2);
        });

        it('Lv.5 → 6', () => {
            expect(ctx.getLevelUpGoal(5)).toBe(6);
        });

        it('Lv.6 → 12', () => {
            expect(ctx.getLevelUpGoal(6)).toBe(12);
        });

        it('Lv.8 이상 상한 15', () => {
            expect(ctx.getLevelUpGoal(8)).toBe(15);
            expect(ctx.getLevelUpGoal(100)).toBe(15);
        });
    });

    // --- getLevelUpReward ---
    describe('getLevelUpReward(lv)', () => {
        it('Lv.1 → 3', () => {
            expect(ctx.getLevelUpReward(1)).toBe(3);
        });

        it('Lv.10 → 3', () => {
            expect(ctx.getLevelUpReward(10)).toBe(3);
        });

        it('Lv.11 → 6', () => {
            expect(ctx.getLevelUpReward(11)).toBe(6);
        });

        it('Lv.30 → 9', () => {
            expect(ctx.getLevelUpReward(30)).toBe(9);
        });
    });

    // --- formatMinSec ---
    describe('formatMinSec(ms)', () => {
        it('0ms → "0:00"', () => {
            expect(ctx.formatMinSec(0)).toBe('0:00');
        });

        it('61000ms → "1:01"', () => {
            expect(ctx.formatMinSec(61000)).toBe('1:01');
        });

        it('3600000ms → "60:00"', () => {
            expect(ctx.formatMinSec(3600000)).toBe('60:00');
        });

        it('30000ms → "0:30"', () => {
            expect(ctx.formatMinSec(30000)).toBe('0:30');
        });

        it('59999ms → "0:59"', () => {
            expect(ctx.formatMinSec(59999)).toBe('0:59');
        });
    });

    // --- getItemList ---
    describe('getItemList(type)', () => {
        it('cat → 11개', () => {
            const list = ctx.getItemList('cat');
            expect(list).toHaveLength(11);
        });

        it('bird → 7개', () => {
            expect(ctx.getItemList('bird')).toHaveLength(7);
        });

        it('cat_snack → 5개', () => {
            expect(ctx.getItemList('cat_snack')).toHaveLength(5);
        });

        it('unknown → null', () => {
            expect(ctx.getItemList('unknown')).toBeNull();
        });
    });

    // --- getMaxLevel ---
    describe('getMaxLevel(type)', () => {
        it('cat → 11', () => {
            expect(ctx.getMaxLevel('cat')).toBe(11);
        });

        it('dog → 11', () => {
            expect(ctx.getMaxLevel('dog')).toBe(11);
        });

        it('bird → 7', () => {
            expect(ctx.getMaxLevel('bird')).toBe(7);
        });

        it('cat_toy → 5', () => {
            expect(ctx.getMaxLevel('cat_toy')).toBe(5);
        });

        it('unknown → 0', () => {
            expect(ctx.getMaxLevel('unknown')).toBe(0);
        });
    });

    // --- getItemData ---
    describe('getItemData(type, level)', () => {
        it('cat/1 → 아기 고양이', () => {
            const item = ctx.getItemData('cat', 1);
            expect(item).not.toBeNull();
            expect(item.name).toBe('아기 고양이');
        });

        it('dog/11 → 북극곰', () => {
            const item = ctx.getItemData('dog', 11);
            expect(item.name).toBe('북극곰');
        });

        it('cat/99 → null (범위 초과)', () => {
            expect(ctx.getItemData('cat', 99)).toBeNull();
        });

        it('unknown/1 → null', () => {
            expect(ctx.getItemData('unknown', 1)).toBeNull();
        });
    });

    // --- getDisplayName ---
    describe('getDisplayName(user)', () => {
        it('6자 이하 → 그대로', () => {
            expect(ctx.getDisplayName({ displayName: '홍길동' })).toBe('홍길동');
        });

        it('7자 이상 → 6자로 자름', () => {
            expect(ctx.getDisplayName({ displayName: '가나다라마바사' })).toBe('가나다라마바');
        });

        it('공백 포함 → 첫 단어만', () => {
            expect(ctx.getDisplayName({ displayName: 'John Smith' })).toBe('John');
        });

        it('displayName 없음 → email 앞부분', () => {
            expect(ctx.getDisplayName({ email: 'test@example.com' })).toBe('test');
        });

        it('null/undefined → "유저"', () => {
            expect(ctx.getDisplayName(null)).toBe('유저');
            expect(ctx.getDisplayName({})).toBe('유저');
        });
    });

    // --- getSpecialCooldown ---
    describe('getSpecialCooldown(type)', () => {
        it('기본 Lv.1 → 300000ms (5분)', () => {
            expect(ctx.getSpecialCooldown('bird')).toBe(300000);
        });

        it('Lv.3 bird → 180000ms (3분)', () => {
            const ctx3 = loadConstants({
                genLevels: { cat: 1, dog: 1, bird: 3, fish: 1, reptile: 1 },
            });
            expect(ctx3.getSpecialCooldown('bird')).toBe(180000);
        });

        it('Lv.5 fish → 60000ms (1분)', () => {
            const ctx5 = loadConstants({
                genLevels: { cat: 1, dog: 1, bird: 1, fish: 5, reptile: 1 },
            });
            expect(ctx5.getSpecialCooldown('fish')).toBe(60000);
        });

        it('genLevels 없는 타입 → 기본 300000ms', () => {
            expect(ctx.getSpecialCooldown('unknown')).toBe(300000);
        });
    });

    // --- getKSTDateString ---
    describe('getKSTDateString()', () => {
        it('YYYY-MM-DD 형식 반환', () => {
            const result = ctx.getKSTDateString();
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('고정 시간에서 올바른 KST 날짜', () => {
            // 2026-02-20 00:00:00 UTC = 2026-02-20 09:00:00 KST
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-20T00:00:00Z'));

            const ctx2 = loadConstants();
            expect(ctx2.getKSTDateString()).toBe('2026-02-20');

            vi.useRealTimers();
        });

        it('UTC 자정 직전 → KST는 다음날', () => {
            vi.useFakeTimers();
            // 2026-02-20 23:00:00 UTC = 2026-02-21 08:00:00 KST
            vi.setSystemTime(new Date('2026-02-20T23:00:00Z'));

            const ctx2 = loadConstants();
            expect(ctx2.getKSTDateString()).toBe('2026-02-21');

            vi.useRealTimers();
        });
    });

    // --- getMsUntilKSTMidnight ---
    describe('getMsUntilKSTMidnight()', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('양수 반환', () => {
            vi.setSystemTime(new Date('2026-02-20T12:00:00Z'));
            const ctx2 = loadConstants();
            const result = ctx2.getMsUntilKSTMidnight();
            expect(result).toBeGreaterThan(0);
        });

        it('KST 자정 직전 → 작은 값', () => {
            // KST 23:59:00 = UTC 14:59:00
            vi.setSystemTime(new Date('2026-02-20T14:59:00Z'));
            const ctx2 = loadConstants();
            const result = ctx2.getMsUntilKSTMidnight();
            expect(result).toBeLessThanOrEqual(60 * 1000); // 1분 이내
            expect(result).toBeGreaterThan(0);
        });

        it('24시간 이하', () => {
            vi.setSystemTime(new Date('2026-02-20T06:00:00Z'));
            const ctx2 = loadConstants();
            const result = ctx2.getMsUntilKSTMidnight();
            expect(result).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
        });
    });

    // --- getGeneratorName ---
    describe('getGeneratorName(type)', () => {
        it('cat → 캣타워', () => {
            expect(ctx.getGeneratorName('cat')).toBe('캣타워');
        });

        it('dog → 개집', () => {
            expect(ctx.getGeneratorName('dog')).toBe('개집');
        });

        it('bird → 새장', () => {
            expect(ctx.getGeneratorName('bird')).toBe('새장');
        });

        it('fish → 어항', () => {
            expect(ctx.getGeneratorName('fish')).toBe('어항');
        });

        it('reptile → 사육장', () => {
            expect(ctx.getGeneratorName('reptile')).toBe('사육장');
        });

        it('toy → 장난감 상자', () => {
            expect(ctx.getGeneratorName('toy')).toBe('장난감 상자');
        });

        it('unknown → 그대로 반환', () => {
            expect(ctx.getGeneratorName('unknown')).toBe('unknown');
        });
    });

    // --- 상수 간접 검증 (const는 vm context에 노출되지 않으므로 함수를 통해 검증) ---
    describe('상수 간접 검증', () => {
        it('동물 타입 9종 모두 getItemList로 접근 가능', () => {
            const types = ['cat', 'dog', 'bird', 'fish', 'reptile', 'cat_snack', 'dog_snack', 'cat_toy', 'dog_toy'];
            for (const type of types) {
                expect(ctx.getItemList(type)).not.toBeNull();
            }
        });

        it('getMaxLevel로 최대 레벨 검증', () => {
            expect(ctx.getMaxLevel('cat')).toBe(11);
            expect(ctx.getMaxLevel('dog')).toBe(11);
            expect(ctx.getMaxLevel('bird')).toBe(7);
            expect(ctx.getMaxLevel('fish')).toBe(7);
            expect(ctx.getMaxLevel('reptile')).toBe(7);
            expect(ctx.getMaxLevel('cat_snack')).toBe(5);
            expect(ctx.getMaxLevel('dog_snack')).toBe(5);
            expect(ctx.getMaxLevel('cat_toy')).toBe(5);
            expect(ctx.getMaxLevel('dog_toy')).toBe(5);
        });

        it('getSpecialCooldown Lv.1~5 쿨다운 배열 검증', () => {
            const expected = [300000, 240000, 180000, 120000, 60000];
            for (let lv = 1; lv <= 5; lv++) {
                const ctxLv = loadConstants({
                    genLevels: { cat: 1, dog: 1, bird: lv, fish: 1, reptile: 1 },
                });
                expect(ctxLv.getSpecialCooldown('bird')).toBe(expected[lv - 1]);
            }
        });
    });
});
