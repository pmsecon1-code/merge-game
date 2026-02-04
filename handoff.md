# 멍냥 머지 게임 - Architecture (v4.3.2)

## 개요

**멍냥 머지**는 동물을 합성하여 성장시키는 모바일 친화적 웹 게임입니다.

- **URL**: https://pmsecon1-code.github.io/merge-game/
- **버전**: 4.3.1
- **Firebase 프로젝트**: `merge-game-7cf5f`

---

## 파일 구조

```
merge2/
├── index.html          # 메인 (HTML + 게임 로직, ~1500줄)
├── css/
│   └── styles.css      # 모든 CSS (600+ 줄)
├── js/
│   └── constants.js    # 상수 + 데이터 + 헬퍼 함수
├── firestore.rules     # Firebase 보안 규칙
├── firebase.json       # Firebase Hosting 설정
├── .firebaserc         # Firebase 프로젝트 연결
├── 404.html            # 404 페이지
└── handoff.md          # 이 문서
```

---

## 인증 시스템 (v4.1.0)

### 로그인 필수
- 게임 시작 전 Google 로그인 필수
- 비로그인 상태에서는 게임 UI 숨김

### 화면 흐름
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [사이트 접속]                                   │
│       ↓                                         │
│  ┌─────────────────┐                            │
│  │  로그인 화면     │  ← 게임 컨테이너 숨김        │
│  │  🐱🐶           │                            │
│  │  멍냥 머지       │                            │
│  │  [Google 로그인] │                            │
│  └─────────────────┘                            │
│       ↓ (로그인 성공)                            │
│  ┌─────────────────┐                            │
│  │  세션 등록       │  → Firestore sessions/{uid} │
│  │  세션 리스너 시작 │  → onSnapshot 실시간 감시   │
│  │  클라우드 로드   │  → Firestore saves/{uid}    │
│  │  게임 화면 표시  │                            │
│  └─────────────────┘                            │
│       ↓ (다른 기기 로그인 감지)                   │
│  ┌─────────────────┐                            │
│  │  즉시 로그아웃   │  ← onSnapshot 실시간 감지   │
│  │  로그인 화면     │                            │
│  └─────────────────┘                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 인증 코드 흐름
```javascript
// 1. 로그인 버튼 클릭 (팝업 방식)
startGoogleLogin()
  → auth.signInWithPopup(googleProvider)

// 2. 인증 상태 변경 감지
auth.onAuthStateChanged(user => {
  if (user) {
    registerSession()        // 세션 등록
    startSessionListener()   // 실시간 세션 감시 시작
    loadFromCloud()          // 클라우드 로드
    showGameScreen()         // 게임 표시
  } else {
    stopSessionListener()    // 세션 감시 중지
    showLoginScreen()        // 로그인 화면
  }
})
```

### Firebase Hosting 필수
- `authDomain: "merge-game-7cf5f.firebaseapp.com"` 사용
- Firebase Hosting 배포 필수 (인증 핸들러 제공)
- 배포 명령: `firebase deploy --only hosting`

---

## 단일 세션 정책 (실시간)

### 목적
한 계정으로 동시에 여러 기기에서 플레이 방지

### 동작 방식 (v4.1.0 - 실시간)
```
[기기 A에서 로그인]
  → registerSession() → sessions/{uid} = { sessionId: "abc123", ... }
  → startSessionListener() → onSnapshot 리스너 시작
  → currentSessionId = "abc123"

[기기 B에서 같은 계정 로그인]
  → registerSession() → sessions/{uid} = { sessionId: "xyz789", ... }

[기기 A: onSnapshot 즉시 감지]
  → Firestore sessionId ("xyz789") ≠ local sessionId ("abc123")
  → "다른 기기에서 로그인되어 로그아웃됩니다" 토스트
  → auth.signOut() → 로그인 화면으로 이동
```

### 관련 함수
| 함수 | 역할 |
|------|------|
| `generateSessionId()` | 고유 세션 ID 생성 |
| `registerSession()` | Firestore에 세션 등록 |
| `startSessionListener()` | onSnapshot 실시간 감시 시작 |
| `stopSessionListener()` | 리스너 해제 |

### 이전 방식 vs 현재 방식
| 항목 | v4.0.0 (이전) | v4.1.0 (현재) |
|------|---------------|---------------|
| 감지 방식 | 10초 폴링 | onSnapshot 실시간 |
| 로그아웃 속도 | 최대 10초 | 즉시 (~1초) |
| 서버 요청 | 주기적 | 변경 시에만 |

---

## 데이터 저장 시스템

### 저장 흐름
```
[게임 액션 발생]
     ↓
updateAll()
     ↓
saveGame()
     ├── localStorage.setItem() ─── 즉시 저장 (로컬 백업)
     └── saveToCloud() ─────────── 500ms 디바운스 후 Firestore 저장

[중요 액션 (구조 완료 등)]
     ↓
saveGameNow() ─── localStorage + Firestore 즉시 저장

[페이지 이탈]
     ↓
beforeunload → localStorage 저장
visibilitychange → saveGameNow()
```

### 데이터 우선순위
```
v4.x: 클라우드 데이터만 사용 (로컬은 백업용)

[로그인 시]
  → loadFromCloud()
  → 클라우드 데이터 있으면 적용
  → 없으면 initNewGame() (새 게임)
```

### 저장 데이터 구조
```javascript
{
  // 보드 상태
  boardState: [{type, level}, ...],      // 35칸
  storageState: [{type, level}, ...],    // 5칸
  apartmentState: [{type, level, hp, rescued}, ...], // 3칸

  // 재화
  coins: number,
  cumulativeCoins: number,
  diamonds: number,
  energy: number,

  // 진행도
  userLevel: number,
  questProgress: number,
  quests: [{id, npc, reqs, reward, expiresAt}, ...],  // expiresAt: 10분 타이머 (v4.2.5)
  currentSetRescues: number,
  totalQuestsCompleted: number,   // 총 완료한 퀘스트 수 (v4.1.6)

  // 생성기
  genLevels: {cat: number, dog: number},

  // 상점
  shopItems: [...],
  shopNextRefresh: number,

  // 기타
  discoveredItems: [...],
  specialMissionCycles: [n, n, n],
  pmType: number,
  pmProgress: number,
  savedAt: timestamp
}
```

---

## Firebase 구조

### Firestore 컬렉션
| 컬렉션 | 문서 | 용도 |
|--------|------|------|
| `saves` | `{uid}` | 게임 전체 상태 |
| `sessions` | `{uid}` | 세션 관리 (단일 로그인) |

### Firebase Hosting
- **URL**: https://merge-game-7cf5f.web.app
- **용도**: 인증 핸들러 (`/__/auth/handler`) 제공
- **배포**: `firebase deploy --only hosting`

### 보안 규칙 (firestore.rules)
```javascript
// 본인 문서만 접근 가능
match /saves/{userId} {
  allow read, write: if request.auth.uid == userId
                     && isValidSaveData(request.resource.data);
}

match /sessions/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// 데이터 검증
- 숫자 범위: coins 0~999만, energy 0~100, ...
- 배열 크기: boardState 35칸, storageState 10칸, ...
- 타임스탬프: 미래 시간 방지
```

---

## 게임 시스템

### UI 레이아웃 (위→아래)
| 순서 | 요소 | 스타일 |
|------|------|--------|
| 0 | 로그인 화면 (비로그인 시) | - |
| 1 | 상단바 (에너지, 코인, 다이아, Lv.n, 로그아웃) | - |
| 2 | 📋 레벨업 진행도 (n/레벨*2) | event-bar 파랑 |
| 3 | 📋 일반 퀘스트 (6개, 3개씩 페이지) | event-bar 보라 |
| 4 | 맵 (5×7 = 35칸) | board-wrapper 분홍 |
| 5 | 🔨 상시 미션 | event-bar 보라 |
| 6 | 👑 누적 코인 (1000 달성 시 보상) | event-bar |
| 7 | ⭐ 스페셜 퀘스트 (🐦🐠🦎) | event-bar 노랑 |
| 8 | 🚑 구조 현장 (3마리) | event-bar 파랑 |
| 9 | 🛒 상점 (5칸) | event-bar 주황 |
| 10 | 📦 창고 (5칸) | event-bar 초록 |

### 보드 구성 (5×7)
```
[0 ][1 ][2 ][3 ][4 ]   ← 캣타워(0), 개집(4)
[5 ][6 ][7 ][8 ][9 ]
[10][11][12][13][14]
[15][16][17][18][19]
[20][21][22][23][24]
[25][26][27][28][29]
[30][31][32][33][34]   ← 7행 미션 (아래 참조)
```

### 7행 미션 (v4.1.6)
| 칸 | 타입 | 조건 |
|----|------|------|
| 30 | upgrade_mission | 캣타워 Lv.2 |
| 31 | upgrade_mission | 개집 Lv.2 |
| 32 | animal_mission | 🦁 사자 만들기 (cat Lv.11) |
| 33 | animal_mission | 🐻‍❄️ 북극곰 만들기 (dog Lv.11) |
| 34 | quest_count_mission | 퀘스트 100개 완료 |

- 조건 달성 시 자동 해제 (클릭 불필요)
- `checkAutoCompleteMissions()` 함수가 합성/퀘스트 완료 시 자동 체크

### 생성기 (케이지)
| 타입 | 이름 | 최대 레벨 | 생성물 | 해제 조건 |
|------|------|----------|--------|----------|
| cat | 캣타워 | 5 | 고양이 (11단계) + 고양이 간식 | 기본 |
| dog | 개집 | 5 | 강아지 (11단계) + 강아지 간식 | 기본 |
| toy | 장난감 생성기 | - | 고양이/강아지 장난감 (5단계) | Lv.5 |
| bird | 새장 | - | 새 (7단계) | 스페셜 미션 |
| fish | 어항 | - | 물고기 (7단계) | 스페셜 미션 |
| reptile | 사육장 | - | 파충류 (7단계) | 스페셜 미션 |

### 업그레이드 미션 (v4.1.1)
- 캣타워/개집 Lv.2 달성 시 보드 30, 31번 칸 자동 해제
- `upgradeGenerator()` 함수에서 레벨업 후 자동 체크

### 보상 구조
| 항목 | 보상 |
|------|------|
| 퀘스트 완료 | 가변 (레벨 스케일링) |
| 누적 코인 1000 | 칸마다 50🪙 |
| 구조 완료 (3마리) | 1000🪙 |
| 스페셜 미션 | 500🪙 + 10💎 |
| 상시 미션 | 100🪙 |
| 레벨업 | ceil(레벨/5)×5 💎 (구간제) |

### 도감 시스템 (v4.2.6)
| 생성기 타입 | 표시 탭 |
|------------|---------|
| cat / dog | 동물, 간식, 업그레이드 |
| bird / fish / reptile | 동물 |
| toy | 🐱장난감, 🐶장난감 |

- `openGuide(type)`: 타입에 따라 탭 표시/숨김
- `switchGuideTab(tab)`: 탭 전환 및 목록 렌더링
- `renderGuideList(tab)`: 발견한 아이템 표시 (NEW 뱃지 10초)

---

## 주요 함수 목록

### 인증
| 함수 | 역할 |
|------|------|
| `startGoogleLogin()` | Google 로그인 (팝업) |
| `handleGoogleLogin()` | 상단바 로그아웃 버튼 |
| `showLoginScreen()` | 로그인 화면 표시 |
| `showGameScreen()` | 게임 화면 표시 |

### 세션
| 함수 | 역할 |
|------|------|
| `generateSessionId()` | 고유 세션 ID 생성 |
| `registerSession()` | Firestore에 세션 등록 |
| `startSessionListener()` | onSnapshot 실시간 감시 시작 |
| `stopSessionListener()` | 리스너 해제 |

### 저장/로드
| 함수 | 역할 |
|------|------|
| `saveGame()` | 로컬 + 클라우드 저장 (디바운스) |
| `saveGameNow()` | 즉시 저장 |
| `saveToCloud()` | Firestore 저장 (isValidSaveData 검증) |
| `loadFromCloud()` | Firestore 로드 (에러/데이터없음 구분) |
| `getGameData()` | 저장할 데이터 객체 생성 |
| `applyGameData()` | 로드한 데이터 적용 (배열 길이 검증) |
| `validateGameData()` | 데이터 무결성 검증 (배열 패딩) |
| `sanitizeForFirestore()` | undefined → null 변환 (v4.2.7) |
| `isValidSaveData()` | 저장 전 데이터 유효성 검증 (v4.2.8) |

### 게임 초기화
| 함수 | 역할 |
|------|------|
| `init()` | UI 셀 생성, 타이머 시작, 이벤트 등록 |
| `initNewGame()` | 새 게임 데이터 초기화 (즉시 저장 안 함) |
| `initApartment()` | 구조 현장 동물 배치 |
| `refreshShop()` | 상점 아이템 갱신 |

### 게임 로직
| 함수 | 역할 |
|------|------|
| `spawnItem()` | 동물/간식 생성 |
| `mergeItems()` | 아이템 합성 |
| `upgradeGenerator()` | 생성기 업그레이드 + 미션 자동 완료 |
| `checkAutoCompleteMissions()` | 7행 미션 자동 완료 체크 |
| `updateAll()` | 전체 UI 갱신 + 저장 |

---

## 상수 (js/constants.js)

### 그리드
```javascript
GRID_COLS = 5
GRID_ROWS = 7
BOARD_SIZE = 35
STORAGE_SIZE = 5
APARTMENT_ROOMS = 3
SHOP_SIZE = 5
```

### 밸런스
```javascript
MAX_ENERGY = 100
RECOVERY_SEC = 30
SHOP_REFRESH_MS = 300000  // 5분
UNLOCK_COST_BOARD = 100
RESCUE_QUEST_REWARD = 1000
SNACK_CHANCE = 0.08       // 8%
```

### 에너지 구매 (v4.1.5)
```javascript
// 가격 = 500 + 구매횟수 × 100
// 3시간마다 리셋
getEnergyPrice() → 500, 600, 700, ...
```

### 퀘스트 난이도 (v4.3.2)
```javascript
// 유저 레벨에 따른 요구 레벨 스케일링
baseLevel = 1 + Math.floor(userLevel / 3)  // Lv.1~3 → 1, Lv.4~6 → 2, ...
maxLevel = baseLevel + 3
최소 보장: 6개 중 2개는 항상 Lv.3 이하

// 아이템 타입 확률
간식 30%, 장난감 20% (Lv.5+), 동물 50%

// 보상 계산
reward = 10 + score + random(0~4)
score = Σ(레벨 × 배수)
  - 동물: 레벨 × 5
  - 간식/장난감: 레벨 × 7

// 퀘스트 요구 개수
1~2개 랜덤 (레벨에 따라 2개 확률 증가: 30%~80%)
```

### 퀘스트 타이머 (v4.2.5)
```javascript
// 퀘스트 생성 시 만료 시간 설정
expiresAt = Date.now() + 10*60*1000  // 10분

// 1초마다 체크
startQuestTimer() → checkExpiredQuests() + updateQuestUI()

// 만료 시 자동 교체
if(now >= quest.expiresAt) → quests.splice(i,1) + generateNewQuest()
```

---

## 배포

### GitHub Pages (게임)
```bash
git add -A
git commit -m "message"
git push
```
→ 자동 배포 (1~2분)

### Firebase Hosting (인증 핸들러)
```bash
firebase deploy --only hosting
```

---

## 트러블슈팅

### 로그인 안 됨 (404 에러)
- **원인**: Firebase Hosting 미배포
- **해결**: `firebase deploy --only hosting`

### 로그인 버튼 반응 없음
- **원인**: JavaScript 에러로 함수 미정의
- **확인**: 개발자 도구(F12) → Console 에러 확인

### 다른 기기 로그인 시 로그아웃 안 됨
- **원인**: onSnapshot 리스너 미시작
- **확인**: `startSessionListener()` 호출 확인

### 유저 데이터 손실 (v4.2.8 이전)
- **원인**: 네트워크 오류 시 `loadFromCloud()` 실패 → `initNewGame()` 호출 → 빈 데이터 저장
- **해결**: 3중 방어 체계 구축 (v4.2.8)
  1. `loadFromCloud()`: 에러/데이터없음 구분, 에러 시 localStorage fallback
  2. `initNewGame()`: 즉시 저장 제거 (첫 액션 시 저장)
  3. `isValidSaveData()`: 생성기 없는 빈 데이터 저장 차단
- **복구**: Firebase Console에서 직접 수정 또는 1회성 복구 코드 사용

---

## To-do

- [x] 로그인 필수 시스템 (v4.0.0) ✅
- [x] 클라우드 데이터 우선 ✅
- [x] 단일 세션 정책 ✅
- [x] 실시간 세션 감지 (v4.1.0) ✅
- [x] Firebase Hosting 배포 ✅
- [x] 파일 분리 (CSS, 상수) ✅
- [x] Firebase Console에서 firestore.rules 배포 ✅
- [x] 모바일 최적화 검증 ✅
- [ ] 사운드 효과 추가
- [ ] 튜토리얼 확장

---

## 변경 이력

### v4.3.2 (2026-02-04)
- 퀘스트 UI 개선
  - 보상/타이머 별도 줄로 분리 (줄바꿈 문제 해결)
  - 둘 다 가운데 정렬
- 퀘스트 밸런스 조정
  - 간식 확률: 40% → 30%
  - 동물 확률: 40% → 50%
  - 보상 50% 감소
    - 기본 보상: 20 → 10
    - 동물 배수: ×10 → ×5
    - 간식/장난감 배수: ×15 → ×7
    - 랜덤 보너스: 0~9 → 0~4
- UI 레이아웃 변경
  - 레벨업 진행도: 맨 위로 이동
  - 누적 코인: 상시 미션 아래로 이동

### v4.3.1 (2026-02-04)
- 에너지 소진 시 기능 개선
  - 에너지 1개 사용 후 0개 되면 즉시 팝업 표시
  - 최초 에너지 소진 시 무료 100개 충전 (1회성)
  - `firstEnergyRewardGiven` 플래그 추가 (저장/로드)
  - `checkEnergyAfterUse()` 함수 추가

### v4.3.0 (2026-02-04)
- 오프라인 에너지 회복 기능 추가
  - `savedAt` 기준 경과 시간 계산
  - 회복량 = 경과 시간 / RECOVERY_SEC (30초)
  - MAX_ENERGY (100) 상한 적용
  - `recoveryCountdown` 남은 시간 자동 조정
  - 콘솔 로그: `[Energy] 오프라인 회복: +n (현재: m)`

### v4.2.9 (2026-02-04)
- 특정 유저 데이터 복구 완료
  - 원인: 네트워크 오류 시 loadFromCloud 실패 → initNewGame 호출 → 빈 데이터 저장
  - Firebase Console에서 직접 수정:
    - boardState[1,2,3] 비움 (새장/어항/사육장 제거)
    - specialMissionCycles = [2, 2, 1] (새21, 물고기24, 파충류18 오픈)
    - totalQuestsCompleted = 100 (7행 퀘스트 미션 달성)
    - discoveredItems에 도감 데이터 추가
  - 1회성 복구 코드 제거 완료

### v4.2.8 (2026-02-04)
- 데이터 손실 방지 3중 방어 체계 구축
  - **원인**: 네트워크 오류 시 loadFromCloud() 실패 → initNewGame() 호출 → 빈 데이터 저장
  - `loadFromCloud`: 에러/데이터없음 구분 반환
    - `{ success, reason: 'loaded' | 'no_data' | 'error' }`
    - 에러 시 localStorage fallback 사용
  - `initNewGame`: 즉시 저장 제거
    - 렌더링만 수행, 첫 액션 시 저장
  - `isValidSaveData`: 저장 전 데이터 유효성 검증
    - boardState 배열 존재/길이 확인
    - 생성기 존재 확인 (빈 데이터 저장 차단)

### v4.2.7 (2026-02-04)
- 데이터 손상 방지 방어 코드 추가
  - `validateGameData`: 배열 길이 검증 강화
    - 배열 없음/오류 시 기본값 사용
    - 길이 부족 시 null로 패딩
    - 모든 요소 null 시 경고 로그
  - `applyGameData`: 배열 무결성 검증
    - boardState/storageState/apartmentState 길이 불일치 시 기존 값 유지
    - 손상 감지 시 콘솔 경고
  - `sanitizeForFirestore`: Firestore 저장 전 데이터 정제
    - 재귀적으로 undefined → null 변환
    - Firestore가 undefined를 무시하는 문제 해결

### v4.2.6 (2026-02-03)
- 장난감 생성기 추가 (🧸)
  - 레벨 5 달성 시 자동 해제
  - 6회 사용 후 1분 쿨다운
  - cat_toy / dog_toy 랜덤 생성
- 장난감 데이터 추가 (constants.js)
  - CAT_TOYS: 🧶털실 → 🪶깃털 → 🐭쥐인형 → 🎣낚싯대 → 🏠숨숨집
  - DOG_TOYS: 🎾공 → 🦆오리인형 → 🥏프리스비 → 🪢터그로프 → 🛝미끄럼틀
- 퀘스트에 장난감 요구 (Lv.5+ 시 20% 확률)
- 합성 최대 레벨 5
- 장난감 생성기 도감 탭 추가
  - 🐱장난감, 🐶장난감 전용 탭
  - 동물/간식/업그레이드 탭 숨김

### v4.2.5 (2026-02-03)
- 일반 퀘스트 10분 타이머 추가
  - 각 퀘스트에 `expiresAt` 타임스탬프 저장
  - 퀘스트 카드에 남은 시간 표시 (⏱m:ss, 빨간색)
  - 만료 시 자동 삭제 → 새 퀘스트 생성
  - `startQuestTimer()`: 1초마다 만료 체크 및 UI 업데이트

### v4.2.4 (2026-02-03)
- 레벨업 보상 구간제 도입
  - 공식: `Math.ceil(레벨/5)*5`
  - Lv.1~5: 5💎, Lv.6~10: 10💎, Lv.11~15: 15💎, ...
- 레벨업 진행도 UI에 보상 금액 동적 표시
  - `(Lv.업 + 💎)` → `(Lv.업 + n💎)`
- 테두리 색상 진하게 변경 (#3b82f6)

### v4.2.3 (2026-02-03)
- 레벨업 진행도 UI 추가
  - 상시 미션 아래에 배치
  - 📋 일반 퀘스트 완료하기 (Lv.업 + 💎) n/레벨*2
  - 파란색 프로그레스바
- 상단바 레벨 UI 간소화
  - `Lv.n 0/n` → `Lv.n`만 표시

### v4.2.2 (2026-02-03)
- 퀘스트 간식 확률 25% → 40%
- 미션 셀 드래그 버그 수정
  - 7행 미션 셀로 아이템 드래그 시 자리 바뀜 방지
  - `locked` + `mission` 타입 모두 드래그 차단
- 퀘스트 미션 셀 클릭 텍스트 수정
  - "퀘스트 n/100 완료" → "일반 퀘스트 n/100 완료"

### v4.2.1 (2026-02-03)
- 퀘스트 카드 아이템 정렬 개선
  - NPC + 아이템 가로 배치
  - 아이템 1개/2개 정렬 통일
  - 간격 조정 (4px)

### v4.2.0 (2026-02-03)
- 구조 현장 실시간 타이머 복구
- 퀘스트 카드 아이템 가로 배치 (NPC + 아이템 한 줄)
- 7행 미션 텍스트 통일 (두 줄 + 가운데 정렬)
  - 캣타워/개집: "캣타워<br>Lv.2"
  - 사자/북극곰: "사자 왕<br>만들기"
  - 퀘스트: "일반 퀘스트<br>n/100"

### v4.1.9 (2026-02-03)
- 구조현장/상점 UI를 창고 스타일로 통일
  - event-bar + 라벨/진행도 헤더 형태
  - 구조현장: 프로그레스바, 타이머 제거
  - 상점: ::before 라벨 제거, 헤더로 변경
- 모든 섹션 UI 완전 통일 완료

### v4.1.8 (2026-02-03)
- 상시 미션 UI를 누적 코인/구조 현장 스타일로 통일
  - flex 레이아웃 (라벨 좌측, 진행도 우측)
  - progress-track 프로그레스바 적용
  - white-space: nowrap으로 줄바꿈 방지

### v4.1.7 (2026-02-03)
- UI 통일: 모든 섹션 event-bar 스타일 적용
  - 일반 퀘스트, 상시 미션, 스페셜 퀘스트, 구조 현장, 창고
- 맵 영역 분리: board-wrapper는 game-board만 포함 (분홍 배경)
- 창고 라벨 추가 (📦 창고)
- 퀘스트 100개 미션 표시: "일반 퀘스트 n/100" 형태
- migrateRow7Missions(): 기존 유저 7행 미션 강제 잠금

### v4.1.6 (2026-02-03)
- 7행 미션 타입 확장 (animal_mission, quest_count_mission)
  - 32번 칸: 사자(Lv.11) 만들기
  - 33번 칸: 북극곰(Lv.11) 만들기
  - 34번 칸: 퀘스트 100개 완료
- 섹션 라벨 추가 (📋 일반 퀘스트, ⭐ 스페셜 퀘스트)
- 미션 자동 완료 기능 (checkAutoCompleteMissions)
- totalQuestsCompleted 변수 추가

### v4.1.5 (2026-02-03)
- 에너지 구매 가격 증가 시스템 (500 + 구매횟수×100, 3시간 리셋)
- 생성기 간식 확률 15%→8%

### v4.1.4 (2026-02-03)
- 모바일 터치 타겟 크기 개선 (퀘스트 버튼, 판매/도움말 버튼)
- 퀘스트 간식 요구 확률 15%→25%
- 쉬운 퀘스트 난이도 상향 (동물 Lv.4~5, 간식 Lv.2~4)
- 모두 구조 보상 500→1000 코인

### v4.1.3 (2026-02-03)
- 최초 발견 시 NEW 뱃지 표시 (좌상단, 10초간)
- 퀘스트 NPC 회색 박스 배경으로 변경
- 일반 퀘스트 6개 중 2개는 항상 Lv.3 이하 보장
- 퀘스트 요구 아이템 최소 Lv.2 보장 (동물/간식 모두)

### v4.1.2 (2026-02-03)
- 사용자 이름 최대 3글자 제한 (UI 밀림 방지)

### v4.1.1 (2026-02-03)
- 업그레이드 미션 자동 완료 (캣타워/개집 레벨업 시 칸 자동 해제)
- 완료 버튼 클릭 과정 생략

### v4.1.0 (2026-02-03)
- 실시간 세션 감지 (10초 폴링 → onSnapshot)
- 다른 기기 로그인 시 즉시 로그아웃
- Firebase Hosting 배포 (인증 핸들러)
- signInWithPopup 방식으로 변경
- 트러블슈팅 섹션 추가

### v4.0.0 (2026-02-03)
- 로그인 필수 시스템 도입
- 랜딩 페이지 (타이틀 + Google 로그인)
- 클라우드 데이터만 사용
- 매 로그인 시 세션 등록

### v3.x (2026-02-03)
- Firebase 아키텍처 개선
- 모바일 redirect 로그인 지원
- Firestore 보안 규칙
- 파일 분리 (CSS, 상수)

### v2.x (2026-02-02)
- Firebase 연동, 클라우드 저장
- 단일 세션 정책
- 구조 시스템 개편
- 퀘스트 시스템 개선

### v1.x (2026-02-02)
- 초기 구현
- 기본 게임 로직
- localStorage 저장
