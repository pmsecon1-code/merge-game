# 멍냥 머지 (Merge Game)

모바일 웹 머지 게임 - Firebase 기반, 순수 JS

## 구조
```
index.html          # 메인 HTML (~595줄)
css/styles.css      # 전체 스타일 (~1450줄)
js/constants.js     # 상수/데이터 (~380줄)
js/state.js         # 전역 변수 (~102줄)
js/auth.js          # 인증/세션 (~129줄)
js/save.js          # 저장/로드 (~430줄)
js/game.js          # 게임 로직 (~550줄)
js/systems.js       # 미션/주사위여행/상점 (~340줄)
js/album.js         # 앨범 시스템 (~225줄)
js/race.js          # 레이스 시스템 (~1060줄)
js/tutorial.js      # 온보딩 튜토리얼 (~191줄)
js/ui.js            # UI/렌더링 (~520줄)
js/main.js          # 초기화 (~257줄)
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
- script 로드 순서: constants → state → auth → save → game → systems → album → race → tutorial → ui → main

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

## 상세 컨텍스트
@handoff.md - 전체 아키텍처, 함수 목록, 밸런스, 변경 이력 (v4.17.0)
