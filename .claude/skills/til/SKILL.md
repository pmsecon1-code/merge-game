---
name: til
description: TIL 또는 에러 해결 패턴을 Obsidian에 기록
tools: mcp__obsidian__write_note, mcp__obsidian__search_notes, mcp__obsidian__patch_note, mcp__obsidian__manage_tags
---

# /til - 학습/에러 기록

현재 세션에서 배운 것이나 해결한 에러를 Obsidian에 기록합니다.

## 사용법
- `/til chrome scroll anchoring` — TIL 노트 생성
- `/til error firestore delete 권한` — 에러 해결 노트 생성

## 수행 절차

1. **유형 판단**
   - 인자에 "error", "bug", "fix" 포함 → 에러 해결 노트 (`2-Knowledge/Errors/`)
   - 그 외 → TIL 노트 (`2-Knowledge/TIL/`)

2. **중복 확인**
   - `mcp__obsidian__search_notes`로 유사 노트 검색
   - 기존 노트 있으면 → 업데이트할지 새로 만들지 질문

3. **내용 수집**
   - 현재 대화 컨텍스트에서 관련 내용 자동 추출
   - 부족하면 간단히 질문 (최대 2개)

4. **노트 생성**
   - 파일명: `YYYY-MM-DD-{slug}.md` (slug는 영문 kebab-case)
   - frontmatter: date, tags, project 자동 설정
   - 템플릿 기반 (Templates/til.md 또는 Templates/error-solution.md)

5. **결과 출력**
   - 생성된 노트 경로
   - 내용 요약 1~2줄

## 주의사항
- 코드 블록은 핵심만 (전체 파일 복붙 금지)
- tags에 기술 태그 추가 (javascript, firebase, css 등)
- project 필드에 현재 프로젝트명 기입
