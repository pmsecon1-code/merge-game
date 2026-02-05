# 멍냥 머지 (Merge Game)

모바일 웹 머지 게임 - Firebase 기반, 순수 JS

## 구조
```
index.html          # 메인 HTML (~514줄)
css/styles.css      # 전체 스타일 (~1375줄)
js/constants.js     # 상수/데이터 (~388줄)
js/state.js         # 전역 변수 (~87줄)
js/auth.js          # 인증/세션 (~129줄)
js/save.js          # 저장/로드 (~392줄)
js/game.js          # 게임 로직 (~470줄)
js/systems.js       # 미션/구조/상점 (~467줄)
js/album.js         # 앨범 시스템 (~225줄)
js/ui.js            # UI/렌더링 (~515줄)
js/main.js          # 초기화 (~250줄)
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
- script 로드 순서: constants → state → auth → save → game → systems → album → ui → main

## 상세 컨텍스트
@handoff.md - 전체 아키텍처, 함수 목록, 밸런스, 변경 이력 (v4.5.0)
