# 멍냥 머지 (Merge Game)

모바일 웹 머지 게임 - Firebase 기반, 순수 JS

## 구조
```
index.html          # 메인 게임 (HTML + JS, ~1900줄)
css/styles.css      # 전체 스타일 (~1100줄)
js/constants.js     # 상수/데이터 (~220줄)
firestore.rules     # DB 보안 규칙
firebase.json       # Firebase Hosting 설정
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

## 핵심 규칙
- 단일 파일 구조 유지 (index.html에 JS 포함)
- 모바일 퍼스트 (5x7 그리드, 터치 최적화)
- Firestore 보안 규칙 변경 시 범위 검증 필수

## 상세 컨텍스트
@handoff.md - 전체 아키텍처, 함수 목록, 밸런스, 변경 이력 (v4.3.2)
