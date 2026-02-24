---
name: handoff
description: 세션 종료 시 handoff.md 갱신 + Obsidian Dev-Log 기록
tools: Read, Edit, Write, Glob, Grep, Bash, mcp__obsidian__read_note, mcp__obsidian__write_note, mcp__obsidian__patch_note, mcp__obsidian__search_notes
---

# Handoff 갱신 + Dev-Log 기록

세션 종료 전 handoff.md를 최신 상태로 갱신하고, Obsidian Dev-Log에 작업 기록을 남깁니다.

## Part 1: handoff.md 갱신 (기존)

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

## Part 2: Obsidian Dev-Log 기록 (신규)

5. **오늘 Dev-Log 확인**
   - `mcp__obsidian__read_note("3-Dev-Log/{오늘 날짜}.md")`
   - 노트가 없으면 → 아래 템플릿으로 `write_note` 생성
   - 노트가 있으면 → `patch_note`로 세션 내용 추가

6. **Dev-Log에 기록할 내용**
   - 작업 요약 (이번 세션에서 한 일 3줄 이내)
   - 변경 파일 테이블 (파일명 + 변경 내용)
   - 주요 결정사항 (아키텍처 변경, 밸런스 조정 등)
   - 다음 할 일 (미완료 작업, 후속 과제)

7. **TIL/에러 노트 제안** (선택)
   - 이번 세션에서 새로운 버그 해결, 패턴 발견이 있었으면:
   - "이 내용을 TIL/에러 노트로 기록할까요?" 질문
   - 승인 시 `2-Knowledge/TIL/` 또는 `2-Knowledge/Errors/`에 노트 생성

## Dev-Log 템플릿 (신규 생성 시)

```markdown
# {YYYY-MM-DD} 작업 로그

## 세션 1
### 작업 요약
-

### 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
|  |  |

### 주요 결정사항
-

### 다음 할 일
- [ ]

### 메모
-
```

## 같은 날 두 번째 세션일 때

기존 노트에 `## 세션 N` 섹션을 append:

```markdown
## 세션 2
### 작업 요약
...
```

## 주의사항
- handoff.md: 기존 내용 삭제하지 않음 (추가/수정만), 변경 이력 최신순
- Dev-Log: frontmatter `tags: [dev-log, {프로젝트명}]` 포함
- Dev-Log: 코드 블록은 최소한으로 (핵심 변경만)
- TIL/에러 노트 생성은 사용자 승인 후에만
