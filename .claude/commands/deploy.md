---
description: GitHub Pages + Firebase 배포
allowed-tools: Bash, Read
---

# 배포

게임을 GitHub Pages와 Firebase에 배포합니다.

## 수행 절차

1. **변경사항 확인**
   - `git status`로 미커밋 변경 확인
   - 미커밋 있으면 커밋 먼저 요청

2. **GitHub Pages 배포** (게임 콘텐츠)
   - `git push origin master`
   - 1~2분 후 자동 반영

3. **Firebase 배포** (인증 핸들러, 필요 시만)
   - firestore.rules 변경 시: `firebase deploy --only firestore:rules`
   - hosting 변경 시: `firebase deploy --only hosting`

4. **배포 확인**
   - 배포 URL 안내: https://pmsecon1-code.github.io/merge-game/
   - 브라우저 캐시 주의 안내

## 주의사항
- push 전 사용자 확인 필수
- firestore.rules 변경 시 보안 규칙 검증 먼저
