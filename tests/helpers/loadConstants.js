import { readFileSync } from 'fs';
import { createContext, runInContext } from 'vm';
import { resolve } from 'path';

/**
 * constants.js를 vm 컨텍스트에서 실행하고 전역 함수/상수를 반환
 * @param {object} [overrides] - genLevels 등 전역 변수 오버라이드
 */
export function loadConstants(overrides = {}) {
    const ctx = {
        // ICON을 Proxy로 mock - 어떤 속성이든 빈 문자열 반환
        ICON: new Proxy(
            {},
            {
                get: () => '',
            },
        ),
        // 전역 변수 mock
        genLevels: { cat: 1, dog: 1, bird: 1, fish: 1, reptile: 1 },
        // 오버라이드 적용
        ...overrides,
        // 빌트인
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

    const code = readFileSync(resolve('js/constants.js'), 'utf8');
    runInContext(code, createContext(ctx));
    return ctx;
}
