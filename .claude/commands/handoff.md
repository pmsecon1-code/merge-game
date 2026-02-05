---
description: 세션 종료 시 handoff.md 갱신
allowed-tools: Read, Edit, Write, Glob, Grep
---

# Handoff 갱신

세션 종료 전 handoff.md를 최신 상태로 갱신합니다.

## 수행 절차

1. **현재 handoff.md 읽기**
   - `Read("handoff.md")`

2. **이번 세션 변경사항 파악**
   - `git diff HEAD~5..HEAD --stat` (최근 커밋 확인)
   - `git log --oneline -10` (커밋 메시지 확인)

3. **handoff.md 갱신**
   - 버전 변경 시 → 버전 번호 업데이트
   - 새 함수/상수 추가 시 → 관련 섹션 업데이트
   - 밸런스 변경 시 → 밸런스 설정 섹션 업데이트
   - UI 변경 시 → UI 레이아웃 섹션 업데이트

4. **변경 요약 출력**
   - 갱신된 섹션 목록
   - 주요 변경 내용 1~3줄

## 주의사항
- 기존 내용 삭제하지 않음 (추가/수정만)
- 변경 이력은 최신순 유지
- 코드 블록과 테이블 형식 유지
