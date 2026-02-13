# 멍냥 머지 (Merge Game)

모바일 웹 머지 게임 - Firebase 기반, 순수 JS

## 구조
```
index.html          # 메인 HTML (~608줄)
css/styles.css      # 전체 스타일 (~1866줄)
js/constants.js     # 상수/데이터/ICON (~566줄)
js/state.js         # 전역 변수 (~120줄)
js/auth.js          # 인증/세션/회원탈퇴 (~177줄)
js/save.js          # 저장/로드 (~575줄)
js/game.js          # 게임 로직 (~821줄)
js/systems.js       # 미션/주사위여행/상점 (~439줄)
js/album.js         # 앨범 시스템 (~241줄)
js/race.js          # 레이스 시스템 (~1066줄)
js/sound.js         # 사운드 (효과음+BGM) (~406줄)
js/tutorial.js      # 온보딩 튜토리얼 (~194줄)
js/ui.js            # UI/렌더링/배지바/설정 (~700줄)
js/main.js          # 초기화 (~295줄)
images/             # 커스텀 아이콘/동물 PNG (120종)
firestore.rules     # DB 보안 규칙
firebase.json       # Firebase 설정
```

## 기술 스택
- HTML5 + Vanilla JavaScript (프레임워크 없음)
- Tailwind CSS (CDN) + 커스텀 CSS
- Firebase: Auth (Google), Firestore, Hosting

## 명령어
| 명령 | 설명 |
|------|------|
| `git push` | GitHub Pages 배포 (자동, 1~2분) |
| `firebase deploy --only hosting` | 인증 핸들러 배포 |
| `firebase deploy --only firestore:rules` | 보안 규칙 배포 |
| `npm run lint` | ESLint 검사 |
| `npm run format` | Prettier 포맷팅 |

## 핵심 규칙
- 멀티 파일 JS 구조 (전역 변수 기반, 모듈 없음)
- 모바일 퍼스트 (5x7 그리드, 터치 최적화)
- Firestore 보안 규칙 변경 시 범위 검증 필수
- script 로드 순서: constants → state → auth → save → game → systems → album → race → sound → ui → tutorial → main

## 데이터 구조 변경 시 체크리스트
배열/객체에 새로운 타입의 데이터 추가 시 **반드시** 확인:
- [ ] `save.js` - `sanitizeForFirestore()` 검증 범위 (배열 최대 길이 등)
- [ ] `firestore.rules` - 보안 규칙 제한값
- [ ] `handoff.md` - 저장 데이터 구조 섹션 업데이트
- [ ] `eslint.config.js` - 새 전역 변수/함수 추가 시

**예시 (앨범 버그 교훈):**
```
album 배열에 완성 마커 추가 → 검증 로직 미업데이트 → 데이터 손실
```

## 밸런스 변경 시 체크리스트
숫자/공식을 변경할 때 **반드시** 확인:
- [ ] `constants.js`에 상수/헬퍼 함수가 있는지 확인 → 있으면 그곳만 수정
- [ ] 같은 값이 다른 파일에 하드코딩되어 있지 않은지 `Grep`으로 검색
- [ ] `index.html`에 초기값으로 하드코딩된 텍스트 확인
- [ ] `firestore.rules`에 검증 범위가 연동되는지 확인

**원칙**: 같은 값은 반드시 1곳에서만 정의. 중복 발견 시 상수화 먼저.

**중앙화된 헬퍼 함수** (constants.js):
- `getLevelUpGoal(lv)` - 레벨업 필요 퀘스트 수
- `getLevelUpReward(lv)` - 레벨업 다이아 보상
- `getMaxLevel(type)` - 타입별 합성 최대 레벨
- `getEnergyPrice()` - 에너지 구매 가격 (game.js)

**예시 (레벨업 보상 버그 교훈):**
```
game.js에서 공식 변경 → ui.js 프리뷰는 미변경 → 표시 불일치
→ 해결: getLevelUpReward() 헬퍼 함수로 중앙화
```

## 상세 컨텍스트
@handoff.md - 전체 아키텍처, 함수 목록, 밸런스, 변경 이력 (v4.26.0)
