---
name: weekly
description: 주간 회고 — 이번 주 Dev-Log 종합 분석
tools: mcp__obsidian__read_note, mcp__obsidian__write_note, mcp__obsidian__patch_note, mcp__obsidian__search_notes, mcp__obsidian__list_directory
---

# /weekly - 주간 회고

이번 주 Dev-Log를 종합 분석하여 주간 회고 노트를 생성합니다.

## 사용법
- `/weekly` — 이번 주(월~오늘) 회고
- `/weekly 2026-02-17` — 특정 주 회고 (해당 날짜가 속한 월~일)

## 수행 절차

1. **이번 주 Dev-Log 수집**
   - `mcp__obsidian__list_directory("3-Dev-Log")` 로 파일 목록 확인
   - 이번 주 월~일 범위의 Dev-Log 읽기 (최대 7개)

2. **종합 분석**
   - 작업량: 세션 수, 변경 파일 수
   - 주요 성과: 완료된 기능/수정
   - 반복 패턴: 자주 다룬 기술, 반복된 에러
   - 병목: 시간 많이 쓴 작업, 삽질 영역

3. **주간 회고 노트 생성**
   - 경로: `3-Dev-Log/weekly/YYYY-WNN.md` (예: 2026-W09)
   - 아래 템플릿 기반

4. **다음 주 제안**
   - 미완료 TODO 취합
   - 우선순위 제안

## 노트 템플릿

```markdown
# YYYY-WNN 주간 회고

## 이번 주 요약
- 세션: N회
- 주요 성과:

## 작업 내역
| 날짜 | 핵심 작업 |
|------|----------|
| 월 | |
| 화 | |
| ... | |

## 패턴 분석
- 자주 다룬 기술:
- 반복된 이슈:
- 생산성 병목:

## 배운 것 (TIL/Error 링크)
-

## 다음 주 우선순위
- [ ]
- [ ]
```

## 주의사항
- Dev-Log가 없는 날은 건너뜀
- 분석은 사실 기반 (추측 최소화)
- 기존 TIL/Error 노트가 있으면 [[링크]] 연결
