---
name: adr
description: 아키텍처 결정 기록을 Obsidian에 저장
tools: mcp__obsidian__write_note, mcp__obsidian__search_notes, mcp__obsidian__list_directory
---

# /adr - 아키텍처 결정 기록

아키텍처 결정(Architecture Decision Record)을 Obsidian에 기록합니다.

## 사용법
- `/adr 보스를 보드 아이템으로 변경` — ADR 노트 생성
- `/adr 탐험 시스템으로 코인 싱크 교체` — ADR 노트 생성

## 수행 절차

1. **번호 결정**
   - `mcp__obsidian__list_directory("1-Projects/merge2/ADR")` 로 기존 ADR 확인
   - 폴더 없으면 자동 생성, 다음 번호 부여 (001, 002, ...)

2. **내용 수집**
   - 현재 대화 컨텍스트에서 결정 배경 추출
   - 부족하면 간단히 질문 (최대 2개):
     - "어떤 대안을 고려했나요?"
     - "이 결정의 예상 영향은?"

3. **노트 생성**
   - 경로: `1-Projects/merge2/ADR/{NNN}-{slug}.md`
   - frontmatter: date, tags(adr, merge2), status(accepted)
   - Templates/adr.md 기반

4. **결과 출력**
   - 생성된 노트 경로
   - 내용 요약 1~2줄

## 주의사항
- 결정의 "왜"에 집중 (코드 how는 handoff.md 역할)
- 대안은 최소 1개 이상 기록
- status: accepted | deprecated | superseded
