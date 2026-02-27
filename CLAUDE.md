# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요
모바일 웹 머지 게임 - Firebase 기반, 순수 JS (프레임워크 없음)
- HTML5 + Vanilla JavaScript + Tailwind CSS (CDN) + 커스텀 CSS
- Firebase: Auth (Google), Firestore, Hosting

> **주의: HTML5 코드베이스 동결 (2026-02-25)**
> Zoo Revival (Cocos Creator 리빌드)로 전환 중. 버그 수정 외 새 기능 추가 금지.
> `scripts/extract-balance.js`로 밸런스 데이터 추출 → `balance-data/` 폴더 출력.

## 명령어

| 명령 | 설명 |
|------|------|
| `npm run lint` | ESLint 검사 |
| `npm run lint:fix` | ESLint 자동 수정 |
| `npm run format` | Prettier 포맷팅 |
| `npm run format:check` | Prettier 검사만 (수정 없음) |
| `npm test` | Vitest 전체 테스트 실행 |
| `npx vitest run tests/save.test.js` | 단일 테스트 파일 실행 (constants.test.js도 동일 패턴) |
| `npm run test:watch` | 테스트 watch 모드 |
| `npm run setup-hooks` | Git pre-commit hook 설치 |
| `npm run convert-webp` | 이미지를 WebP로 변환 |
| `npm run extract-balance` | constants.js → JSON 추출 (`balance-data/`) |
| `git push` | GitHub Pages 자동 배포 (1~2분) |
| `firebase deploy --only hosting` | 인증 핸들러 배포 |
| `firebase deploy --only firestore:rules` | 보안 규칙 배포 |

Pre-commit hook이 lint + test를 자동 실행. 실패 시 커밋 차단.
- lint 실패 → `npm run lint:fix` 후 재스테이징
- test 실패 → `npm test`로 실패 원인 확인 후 수정

## 아키텍처

### 전역 변수 기반 멀티 파일 구조
게임 JS 파일은 ES 모듈을 쓰지 않음 (`package.json`의 `"type":"module"`은 Vitest ESM 전용). 모든 JS 파일이 전역 스코프를 공유하며, script 로드 순서가 중요:

**constants → state → auth → save → game → systems → album → race → sound → story → ui → tutorial → main**

- `constants.js`: 상수 + 데이터 배열 + 헬퍼 함수 (다른 파일에서 참조만)
- `state.js`: 전역 변수 + DOM 참조 선언 (초기값만)
- `auth.js`~`main.js`: 각 시스템 로직, 앞 파일에 정의된 전역을 자유롭게 사용

### 새 전역 함수/변수 추가 시
1. 해당 JS 파일에서 함수/변수 선언
2. `eslint.config.js`의 **JS 섹션** (`files: ['js/**/*.js']`)에 등록 — 함수는 `readonly`, 상태 변수는 `writable`
3. `index.html`에서도 참조하면 **HTML 섹션** (`files: ['**/*.html']`)에도 등록 (HTML 섹션은 subset만 포함)

### 테스트 구조
Vitest + `vm.runInContext` 패턴. 브라우저 전역 스코프 의존 코드를 Node에서 실행하기 위해 `tests/helpers/`에서 vm 컨텍스트를 만들어 JS 파일을 로드:
```
tests/helpers/loadConstants.js  → constants.js를 vm에서 실행, ICON을 Proxy로 mock
tests/helpers/loadSave.js       → constants.js + save.js를 순서대로 vm에서 실행
```

**새 테스트 helper 작성 시:**
- `ICON`은 반드시 `new Proxy({}, { get: () => '' })` 로 mock (constants.js가 ICON 참조)
- 의존 JS 파일을 script 로드 순서대로 `runInContext` 실행
- 대상 함수가 참조하는 외부 함수/DOM은 빈 mock(`() => {}`)으로 제공
- `createContext(ctx)`는 첫 파일에서만, 이후 파일은 같은 `ctx`에 `runInContext`
- 테스트 대상: 사이드이펙트 없는 순수함수만 (sanitize, clamp, isValid, 헬퍼 계산 등)

### 코딩 스타일
Prettier 설정 (`.prettierrc`): `singleQuote`, `semi`, `tabWidth: 4`, `printWidth: 120`, `trailingComma: es5`, `arrowParens: always`, `htmlWhitespaceSensitivity: ignore`
- `*.md` 파일은 Prettier 미적용 (`.prettierignore`)
- ESLint: `no-var warn`, `eqeqeq warn`, `no-console off`

### 시간 저장 패턴
상대시간은 델타(ms)로 저장, 로드 시 복원:
```js
// 저장: getGameData()에서
expiresAt: someExpiresAt - Date.now()
// 로드: applyGameData()에서
expiresAt: Date.now() + savedDelta
```

### 핵심 흐름
- **저장**: 게임 액션 → `updateAll()` → `saveGame()` → localStorage(즉시) + Firestore(500ms 디바운스)
- **로드**: 로그인 → `loadFromCloud()` → `applyGameData()` → `renderGrid()`
- **합성**: 드래그 → `tryMergeItems()` → 보스 데미지/콤보/버블 체크 → `updateAll()`

### 중앙화된 헬퍼 함수
밸런스 값은 반드시 constants.js의 헬퍼 함수를 통해 접근 (getLevelUpGoal, getMaxLevel, getExploreCost 등)

## 변경 시 체크리스트

### 데이터 구조 변경
배열/객체에 새 타입 추가 시:
- [ ] `save.js` - `sanitizeForFirestore()` 검증 범위
- [ ] `firestore.rules` - 보안 규칙 제한값
- [ ] `handoff.md` - 저장 데이터 구조 섹션
- [ ] `eslint.config.js` - 새 전역 변수/함수

**교훈**: album 배열에 완성 마커 추가 → 검증 로직 미업데이트 → 데이터 손실

### 밸런스 변경
- [ ] `constants.js`에 상수/헬퍼 있는지 확인 → 있으면 그곳만 수정
- [ ] 같은 값이 다른 파일에 하드코딩되어 있지 않은지 `Grep`
- [ ] `index.html`에 초기값 하드코딩 텍스트 확인
- [ ] `firestore.rules` 검증 범위 연동 확인

**원칙**: 같은 값은 1곳에서만 정의. 중복 발견 시 상수화 먼저.

**교훈**: game.js에서 공식 변경 → ui.js 프리뷰 미변경 → 표시 불일치 → `getLevelUpReward()` 중앙화로 해결

### 기능 제거/리팩토링
- [ ] 삭제 함수의 호출처 모두 확인 (`Grep`)
- [ ] `eslint.config.js` 전역 선언 정리
- [ ] `css/styles.css` 미사용 클래스 제거
- [ ] `index.html` 미사용 HTML 요소 제거
- [ ] `state.js` 미사용 변수 제거
- [ ] `handoff.md` 함수 목록/변경 이력 갱신

**교훈**: 기부 시스템 삭제 시 constants/state/systems/ui/save/index/css/firestore.rules/eslint 10개 파일 수정 필요

### CSS 패턴
- 구간 주석: `/* ============== N. 섹션명 ============== */`
- 아이콘 크기 클래스: `.icon-xs`(14px) ~ `.icon-xl`(80px) — 새 크기 추가 금지, 기존 클래스 사용
- 색상: Tailwind 팔레트 사용 (보라 `#c084fc`, 주황 `#f59e0b`, 초록 `#10b981`)

## 상세 컨텍스트
@handoff.md - 전체 아키텍처, 함수 목록, 밸런스, 변경 이력 (v4.37.1)
