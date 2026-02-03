# 멍냥 머지 게임 - Handoff

## 2026-02-03 작업 내용

### 28. Firebase 아키텍처 전면 개선

#### P0: 중복 로그인 처리 수정
- **문제**: `getRedirectResult` + `onAuthStateChanged` 둘 다 실행 → `loadFromCloud()` 2번 호출
- **해결**: `authProcessed` 플래그로 중복 방지
- **공통 함수**: `handleLoginSuccess(user, isNewLogin)` 도입

#### P1: 저장 Race Condition 수정
- **문제**: `saveToCloud`가 `await` 없이 호출 → 순서 꼬임
- **해결**:
  - 클라우드 저장 500ms 디바운스
  - `cloudSavePromise`로 순차 저장 보장
  - 중요 액션용 `saveGameNow()` 함수 추가

#### P1: 저장 시점 최적화
- 페이지 이탈 시 `beforeunload`로 localStorage 즉시 저장
- 탭 비활성화 시 `visibilitychange`로 클라우드 저장
- 세션 체크 탭 활성화 시에만 실행

#### P2: 에러 핸들링 및 피드백
- **저장 상태 UI**: 상단바 💾 아이콘
  - ⏳: 저장 중
  - ✓: 저장 완료
  - ✗: 저장 실패
  - 📴: 오프라인
- **오프라인 감지**: `online`/`offline` 이벤트 리스너
- **재시도 로직**: 저장 실패 시 1회 자동 재시도

### 29. 모바일 로그인 지원
- PC: `signInWithPopup` (팝업)
- 모바일: `signInWithRedirect` (페이지 이동)
- User-Agent 기반 자동 분기

### 30. 크로스 디바이스 동기화
- **문제**: 새 기기에서 로그인 시 로컬 데이터가 더 최신으로 인식
- **해결**: `hadLocalSave` 플래그
  - 새 기기 (localStorage 없음) → 클라우드 무조건 로드
  - 기존 기기 → 타임스탬프 비교

### 31. 단일 세션 정책
- **세션 관리**: Firestore `sessions/{uid}` 컬렉션
- **동작**:
  - 로그인 시 `registerSession()` → 고유 세션 ID 저장
  - 10초마다 `checkSession()` (탭 활성화 시만)
  - 다른 기기 로그인 시 기존 기기 자동 로그아웃

### 32. 보안 강화
- **Firestore 보안 규칙 파일 생성**: `firestore.rules`
  - 인증 검증 (`isAuthenticated`, `isOwner`)
  - 숫자 범위 검증 (coins 0~999만, energy 0~100 등)
  - 배열 크기 검증 (boardState 35칸, storageState 10칸 등)
  - 타임스탬프 검증 (미래 시간 방지)
- **클라이언트 데이터 검증**: `validateGameData()` 함수
- **적용 필요**: Firebase Console에서 규칙 배포

### 33. 파일 분리 (코드 모듈화)
- **css/styles.css** (신규)
  - 모든 인라인 CSS 분리 (600+ 줄)
  - 섹션별 구조화 (상단바, 퀘스트, 보드, 상점 등)
- **js/constants.js** (신규)
  - 게임 상수 (GRID_*, SHOP_*, ENERGY_* 등)
  - 동물/간식 데이터 (CATS, DOGS, BIRDS, FISH, REPTILES)
  - 헬퍼 함수 (`getItemList`, `getMaxLevel`, `getItemData` 등)
- **index.html**
  - 외부 파일 import 추가
  - 중복 상수/CSS 제거
  - 게임 로직만 유지

---

## 2026-02-02 작업 내용 (계속)

### 12. 도감 시스템 개선
- `discoveredItems` 전역 Set으로 발견한 아이템 추적
- 현재 맵 상태가 아닌 세션 중 발견한 모든 아이템 표시
- 케이지 업그레이드 UI 구조 분리 (`upgrade-content`, `upgrade-msg`)

### 13. 버그 수정
- 구조 보상 팝업: "100 코인" → "500 코인" (RESCUE_QUEST_REWARD 사용)
- 스페셜 퀘스트 텍스트 한글화: bird→새, fish→물고기, reptile→파충류

### 14. 일반 퀘스트 시스템 대폭 개선
- 퀘스트 개수: 3개 → **6개**
- UI: 3개씩 표시 + 좌우 네비게이션 버튼 (`‹` `›`)
- 레벨업 기준: 레벨×3 → **레벨×2** 퀘스트 완료
- **레벨별 난이도 자동 스케일링**
- **완료 가능 퀘스트 자동 정렬** (앞으로)
- **자동 페이지 이동**: 완료 가능 퀘스트 수 증가 시마다 1페이지로 이동
  - `prevReadyCount` 추적하여 새 완료 가능 퀘스트 감지
  - 사용자 수동 페이지 이동 허용
  - 이후 새 완료 가능 퀘스트 생기면 다시 자동 이동

### 15. 생성기 행운 시스템 개선
- 행운 확률: 5% + (레벨-1)%
- 행운 발동 시: Lv.1→2, Lv.2→3, Lv.3+→4 동물/간식 (50:50)

### 16. Lucky 이펙트 강화
- 화면 플래시, 셀 글로우, 큰 텍스트 `✨ Lucky! ✨`
- 확장 링 100px, 파티클 12개

### 17. 상시 미션 시스템 추가
- **보드 축소**: 5×8 → 5×7 (35칸)
- **8번째 줄**: 상시 미션 바 (한 줄 UI)
- **미션 순환**: 🔨 100번 합성 ↔ ✨ 200번 생성
- **보상**: 100🪙
- **UI**: `🔨 100번 합성하기(100🪙) [████] 3/100`

### 18. 생성기 이름 변경
- 고양이 → **캣타워**
- 강아지 → **개집**

### 19. 7행 업그레이드 미션 셀 추가
- **30번 셀**: 🎯 캣타워 Lv.2 달성하기
- **31번 셀**: 🎯 개집 Lv.2 달성하기
- **클릭 동작**:
  - 미달성: 해당 생성기 업그레이드 탭으로 이동
  - 달성: 셀 해제 (사용 가능)
- **스타일**: 미달성=노란 점선, 달성=초록 실선+✅

### 20. 게임 저장/불러오기 (localStorage)
- **자동 저장**: `updateAll()` 호출 시마다 자동 저장
- **자동 불러오기**: `init()` 시 저장된 데이터 있으면 불러오기
- **저장 항목**:
  - boardState, storageState, apartmentState
  - coins, cumulativeCoins, diamonds, energy
  - userLevel, questProgress, quests
  - genLevels, shopItems, shopNextRefresh
  - discoveredItems, specialMissionCycles
  - pmType, pmProgress, isTutorialActive
- **새 게임 vs 불러오기**: 저장 데이터 없으면 기본 초기화 진행

### 21. Firebase 연동 (클라우드 저장)
- **Firebase 프로젝트**: `merge-game-7cf5f`
- **인증**: Google 로그인
- **DB**: Firestore (`/saves/{userId}`)
- **저장 주기**:
  - localStorage: 즉시 (매 액션)
  - Firestore: 3초 디바운스
- **동기화 로직**:
  - 로그인 시 클라우드 vs 로컬 `savedAt` 비교
  - 최신 데이터 자동 적용
- **보안 규칙**: 본인 UID 문서만 읽기/쓰기 허용
- **UI**: 상단바 🔑 로그인 버튼

### 22. UI 레이아웃 전체 재배치
- **변경 순서**:
  1. 👑 누적 코인
  2. 일반 퀘스트 (6개)
  3. 맵 (5×7)
  4. 🔨 상시 미션
  5. 스페셜 퀘스트 (🐦🐠🦎)
  6. 🚑 구조 달성 + 구조 현장
  7. 상점
  8. 창고

### 23. 로드 시 렌더링 버그 수정
- `updateAll()`에 `renderShop()`, `renderApartment()` 추가
- 로드 시 상점/구조현장이 표시되지 않던 문제 해결
- 구조 현장 즉시 초기화 (2초 지연 제거)
  - `apartmentState`가 비어있으면 `initApartment()` 즉시 호출

### 24. 상점 아이템 버그 수정
- 새/물고기/파충류 간식 생성 방지
  - `bird_snack`, `fish_snack`, `reptile_snack` 데이터 없음
  - `generateRandomShopItem()`에서 cat/dog만 간식 생성

### 25. 구조 달성 저장 버그 수정
- **원인**: 로드 시 타이머 만료되면 `cumulativeRescues=0` 리셋
- **수정**: 타이머 만료 시 진행도 유지, 타이머만 새로 시작

### 26. 구조 시스템 전면 개편
- **기존**: 15마리 누적, 3마리마다 보상, 1시간 타이머
- **변경**:
  - 목표: 3마리 세트 완료
  - 표시: `n/3`
  - 보상: 세트 완료 시 500코인
  - 타이머: 가장 낮은 HP 동물의 남은 시간 표시
  - 라벨: "🚑 모두 구조 (500🪙)"
  - 프로그레스바: 3등분 마커 (33.33%, 66.67%)
- **변수**: `cumulativeRescues` → `currentSetRescues`
- **리셋**: 실패 시에만 (`initApartment()`에서 제거)

### 27. 추가 버그 수정
- **누적 코인 1000 리셋**: 보상 지급 직후 즉시 리셋 (`cumulativeCoins=0`)
- **구조 진행도 저장**: 로드 시 `apartmentState`에서 실제 구조 수 계산
  ```javascript
  currentSetRescues = apartmentState.filter(x => x && x.rescued).length;
  ```
- **스페셜 생성기 에너지**: `spawnItem(baseType, 1, true)` → `false`로 변경
  - 새/물고기/파충류 생성기도 에너지 소모

---

## 이전 작업 (2026-02-02)

### 1~11. 초기 구현
- 프로젝트 초기화, 누락 함수 구현
- 구조 현장 3x1, HELP 말풍선
- 상점 개선, 다이아 판매
- 생성기 거리 우선 배치, 파티클 효과
- 퀘스트 무지개 테두리, 보상 UI 통일
- 스페셜 퀘스트 순환 (새/물고기/파충류)
- 룰렛 파란 그라데이션, 숫자 라벨
- 동물 이모지/색상 구분 강화
- 레이아웃 정사각형 셀, 스크롤 가능

---

## 현재 상태

### UI 레이아웃 (위→아래)
| 순서 | 요소 |
|------|------|
| 1 | 상단바 (에너지, 코인, 다이아, 레벨, 로그인) |
| 2 | 👑 누적 코인 |
| 3 | 일반 퀘스트 (6개, 3개씩 페이지) |
| 4 | 맵 (5×7) |
| 5 | 🔨 상시 미션 |
| 6 | 스페셜 퀘스트 (🐦🐠🦎) |
| 7 | 🚑 모두 구조 (n/3) + 구조 현장 |
| 8 | 상점 |
| 9 | 창고 |

### 파일 구조
```
merge2/
├── index.html          # 메인 (HTML + 게임 로직)
├── css/
│   └── styles.css      # 모든 CSS (600+ 줄)
├── js/
│   └── constants.js    # 상수 + 데이터 + 헬퍼
└── firestore.rules     # Firebase 보안 규칙
```

### 시스템 상태
| 시스템 | 상태 |
|--------|------|
| 메인 보드 | 5×7 (35칸), 7행: 미션2+잠금3 |
| 창고 | 5칸, 다이아로 해제 |
| 구조 현장 | 3마리 세트, 모두 구조 시 500🪙, HP 남은시간 타이머 |
| 상점 | 4칸 랜덤 + 1칸 다이아 판매 |
| 스페셜 미션 | 새/물고기/파충류 (Lv.3,6,9 + 9n 순환) |
| 일반 퀘스트 | 6개, 자동 정렬, 새 완료 가능 시 자동 이동 |
| 상시 미션 | 합성 100회 ↔ 생성 200회, 100🪙 |
| 저장 | localStorage + Firebase (500ms 디바운스) |
| 세션 | 단일 세션 정책 (다른 기기 로그인 시 기존 로그아웃) |

### Firebase 구조
| 컬렉션 | 문서 | 용도 |
|--------|------|------|
| `saves` | `{uid}` | 게임 전체 상태 |
| `sessions` | `{uid}` | 세션 관리 (단일 로그인) |

### 저장 흐름
```
[일반 액션]
updateAll() → saveGame() → localStorage (즉시)
                        → Firestore (500ms 디바운스)

[중요 액션 (구조 성공 등)]
saveGameNow() → localStorage + Firestore (즉시)

[페이지 이탈]
beforeunload → localStorage (즉시)
visibilitychange (탭 전환) → saveGameNow()
```

### 퀘스트 자동 이동 로직
```
prevReadyCount = 이전 완료 가능 수
readyCount = 현재 완료 가능 수

if (readyCount > prevReadyCount && questPage > 0)
    → 1페이지로 자동 이동

prevReadyCount = readyCount
```

### 7행 셀 구성
| 인덱스 | 내용 | 클릭 |
|--------|------|------|
| 30 | 캣타워 Lv.2 미션 | 미달성→업그레이드탭, 달성→해제 |
| 31 | 개집 Lv.2 미션 | 미달성→업그레이드탭, 달성→해제 |
| 32~34 | 잠금 🔒 | 코인으로 해제 |

### 생성기 이름
| 타입 | 이름 |
|------|------|
| 고양이 | 캣타워 (Lv.X) |
| 강아지 | 개집 (Lv.X) |
| 새 | 새장 |
| 물고기 | 어항 |
| 파충류 | 사육장 |

### 보상 구조
| 항목 | 보상 |
|------|------|
| 퀘스트 완료 | 가변 (레벨 스케일링) |
| 누적 코인 마일스톤 | 칸마다 50🪙 |
| 모두 구조 (3마리) | 500🪙 |
| 스페셜 미션 | 500🪙 + 10💎 |
| 상시 미션 | 100🪙 |
| 레벨업 | 레벨 x 5 💎 |

---

## To-do
- [x] 게임 저장/불러오기 (localStorage) ✅
- [x] GitHub Pages 배포 ✅
- [x] Firebase 클라우드 저장 ✅
- [x] 크로스 디바이스 동기화 ✅
- [x] 단일 세션 정책 ✅
- [x] 저장 아키텍처 개선 (P0~P2) ✅
- [x] 보안 강화 (Firestore 규칙, 데이터 검증) ✅
- [x] 파일 분리 (CSS, 상수) ✅
- [ ] Firebase Console에서 firestore.rules 배포
- [ ] 사운드 효과 추가
- [ ] 밸런스 테스트
- [ ] 모바일 최적화 검증
- [ ] 튜토리얼 확장
