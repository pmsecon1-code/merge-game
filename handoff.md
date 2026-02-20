# 멍냥 머지 게임 - Architecture (v4.33.0)

## 개요

**멍냥 머지**는 동물을 합성하여 성장시키는 모바일 친화적 웹 게임입니다.

- **URL**: https://pmsecon1-code.github.io/merge-game/
- **버전**: 4.33.0
- **Firebase 프로젝트**: `merge-game-7cf5f`

---

## 파일 구조

```
merge2/
├── index.html          # 메인 HTML (~684줄)
├── css/
│   └── styles.css      # 모든 CSS (~1821줄)
├── js/
│   ├── constants.js    # 상수 + 데이터 + 헬퍼 + ICON (~648줄)
│   ├── state.js        # 전역 변수 + DOM 참조 (~135줄)
│   ├── auth.js         # 인증 + 세션 + 회원탈퇴 (~180줄)
│   ├── save.js         # 저장/로드/검증/클램핑/진단 (~723줄)
│   ├── game.js         # 코어 게임 메커닉 (~1002줄)
│   ├── systems.js      # 7행미션/주사위 여행/상점/기부 (~518줄)
│   ├── album.js        # 앨범 (사진 수집) 시스템 (~243줄)
│   ├── race.js         # 레이스 시스템 (1:1 경쟁) (~1069줄)
│   ├── sound.js        # 사운드 시스템 (효과음+BGM) (~419줄)
│   ├── story.js        # 스토리 이미지 갤러리 시스템 (~335줄)
│   ├── tutorial.js     # 온보딩 튜토리얼 (4스텝) (~194줄)
│   ├── ui.js           # 렌더링/이펙트/드래그/도감/배지바/설정 (~839줄)
│   └── main.js         # 초기화 + 타이머 (~315줄)
├── hooks/
│   └── pre-commit      # Git pre-commit hook (lint+test)
├── tests/
│   ├── helpers/        # 테스트 헬퍼 (loadConstants, loadSave)
│   ├── constants.test.js  # constants.js 테스트 (54개)
│   └── save.test.js    # save.js 테스트 (32개)
├── images/
│   ├── icons/          # UI 아이콘 27종 (128×128 PNG)
│   ├── effects/        # 이펙트 아이콘 3종
│   ├── race/           # 레이스 아이콘 5종
│   ├── spawners/       # 생성기 이미지 7종
│   ├── badges/         # 배지 바 아이콘
│   ├── story/          # 보스 이미지 7종 + scenes/ 24장
│   │   └── scenes/     # 스토리 씬 이미지 24장 (EP.1~7)
│   ├── cats/           # 고양이 동물 이미지 11종
│   ├── dogs/           # 강아지 동물 이미지 11종
│   ├── birds/          # 새 동물 이미지 7종
│   ├── fish/           # 물고기 동물 이미지 7종
│   ├── reptiles/       # 파충류 동물 이미지 7종
│   ├── cat_snacks/     # 고양이 간식 이미지 5종
│   ├── dog_snacks/     # 강아지 간식 이미지 5종
│   ├── cat_toys/       # 고양이 장난감 이미지 5종
│   └── dog_toys/       # 강아지 장난감 이미지 5종
├── firestore.rules     # Firebase 보안 규칙
├── firebase.json       # Firebase Hosting + Firestore 설정
├── .firebaserc         # Firebase 프로젝트 연결
├── 404.html            # 404 페이지
└── handoff.md          # 이 문서
```

**script 로드 순서**: constants → state → auth → save → game → systems → album → race → sound → **story** → ui → tutorial → main

**총 JS**: ~6620줄, **함수**: ~192개

---

## UI 레이아웃 (위→아래)

| 순서 | 요소 | 스타일 |
|------|------|--------|
| 0 | 로그인 화면 (비로그인 시) | 전체 화면 |
| 1 | 상단바 (⚡에너지, 🪙코인, 💎다이아, 🃏카드, Lv.n + n/n, ⚙️설정) | status-bar |
| 2 | 📋 퀘스트 (7개, 3개씩 페이지) | event-bar 보라 |
| 4 | 맵 (5×7 = 35칸) | board-wrapper 분홍 |
| 5 | 📋 일일 미션 (합성/생성/코인) | event-bar 황색 |
| 6 | 콘텐츠 영역 (배지 탭 시 일일미션 대체) | #bottom-content |
| 7 | 하단 배지 바 (🏁📸🎲🛒📦🎁) | #bottom-nav 6열 그리드 |

### 하단 배지 바 (v4.33.0)
```
┌─────┬──────┬──────┬─────┬─────┬─────┐
│ 🏁  │  📸  │  🎲  │ 🛒  │ 📦  │ 🎁  │
│레이스│ 앨범 │주사위│ 상점│ 창고│ 기부│
│참가  │0/81  │1/50  │4:32 │0/0  │칭호  │
└─────┴──────┴──────┴─────┴─────┴─────┘
```
- 배지 탭 → 해당 콘텐츠 표시 (일일미션 자리 대체, CSS calc 동적 높이)
- 같은 배지 재탭 → 닫힘 (일일미션 복원)
- 배지 요약 정보: 레이스(상태별), 앨범(진행도), 주사위(위치), 상점(갱신타이머), 창고(보관/열린칸), 기부(현재칭호)
- 각 콘텐츠는 기본 숨김 (`display:none`)

| 배지 | data-tab | 콘텐츠 ID | 요약정보 |
|------|----------|-----------|----------|
| 🏁 레이스 | race | #race-bar | 참가하기/⏱초대타이머/n/10 |
| 📸 앨범 | album | #album-bar | n/81 (테마 미니칩 9개) |
| 🎲 주사위 여행 | dice | #dice-trip-wrapper | n/50 |
| 🛒 상점 | shop | #shop-wrapper | m:ss (갱신 타이머) |
| 📦 창고 | storage | #storage-wrapper | 보관중/열린칸 |
| 🎁 기부 | donate | #donate-wrapper | 현재 칭호/기부하기 |

---

## 인증 시스템 (v4.1.0)

### 흐름
```
[접속] → 로그인 화면 (게임 숨김)
  ↓ Google 팝업 로그인
[로그인 성공] → 세션 등록 → 세션 리스너 → 클라우드 로드 → 게임 표시
  ↓ (다른 기기 로그인 감지 - onSnapshot 실시간)
[즉시 로그아웃] → 로그인 화면
```

### 관련 함수 (auth.js, 9개)
| 함수 | 역할 |
|------|------|
| `generateSessionId()` | 세션 ID 생성 |
| `registerSession()` | Firestore 세션 등록 |
| `startSessionListener()` | onSnapshot 실시간 감시 |
| `stopSessionListener()` | 리스너 해제 |
| `startGoogleLogin()` | Google 팝업 로그인 |
| `handleGoogleLogin()` | 로그아웃 버튼 |
| `deleteAccount()` | 회원탈퇴 (Firestore+Auth 삭제) |
| `showLoginScreen()` / `showGameScreen()` | 화면 전환 |

---

## 데이터 저장 시스템

### 저장 흐름
```
[게임 액션] → updateAll() → saveGame()
  ├── localStorage (즉시)
  └── Firestore (500ms 디바운스)

[중요 액션] → saveGameNow() → 즉시 저장
[페이지 이탈] → beforeunload/visibilitychange → 저장
```

### 저장 데이터 구조
```javascript
{
  // 보드 (아이템: {type, level} | 생성기: {type, clicks, cooldown} | 저금통: {type:'piggy_bank', coins, openAt} | 보스: {type:'boss', bossId} | 버블: {type:'bubble', itemType, itemLevel, expiresAt})
  boardState: [{type, level}, ...],      // 35칸
  storageState: [{type, level}, ...],    // 5칸

  // 재화
  coins, cumulativeCoins, diamonds, energy,
  energyRecoverAt,          // 에너지 회복 절대 시간 (ms timestamp, v4.27.0+)

  // 진행도
  userLevel, questProgress,
  quests: [{id, npc, reqs, reward, cardReward, expiresAt}, ...],
  totalQuestsCompleted,

  // 주사위 여행 (v4.11.0+)
  diceTripPosition,       // 현재 위치 (0~50)
  diceCount,              // 보유 주사위 수
  visitedSteps,           // 밟았던 칸 인덱스 배열 (v4.12.0+)

  // 생성기
  genLevels: {cat, dog, bird, fish, reptile},

  // 상점
  shopItems: [...],  shopNextRefresh,

  // 앨범 (v4.4.0+)
  cards,                    // 보유 카드 수
  album: ["0_3", "2_7"],   // 수집한 사진 키
  albumResetTime,           // 다음 초기화까지 ms

  // 7일 출석 보너스 (v4.9.0+)
  lastDailyBonusDate,              // "YYYY-MM-DD" 형식
  loginStreak,                     // 0~6 (7일 중 현재 일차-1)

  // 레이스 (v4.7.0+)
  currentRaceId,            // 현재 참여 중인 레이스 ID
  myRaceCode,               // 내 영구 코드 (6자리)
  raceWins,                 // 누적 승리
  raceLosses,               // 누적 패배
  recentRaceOpponents,      // 최근 상대 [{code, name}, ...] (최대 3명)

  // 일일 미션 (v4.10.0+)
  dailyMissions: {
    tier,               // 0=1단계, 1=2단계, 2=3단계, 3=완료 (v4.19.1+)
    merge,              // 합성 횟수
    spawn,              // 생성 횟수
    coins,              // 획득 코인
    claimed,            // [false, false, false] 개별 보상 수령
    bonusClaimed,       // false 전체 완료 보너스 수령
    lastResetDate,      // "YYYY-MM-DD" 마지막 리셋 날짜
  },

  // 튜토리얼 (v4.15.0+)
  tutorialStep,             // 0=완료, 1~4=진행 중 스텝

  // 스토리 갤러리 (v4.29.0+)
  storyProgress: {
    unlockedImages,         // [0, 1, 2, ...] 해제된 이미지 ID (최대 24)
    activeQuestId,          // 현재 활성 퀘스트의 이미지 ID (null이면 없음)
    bosses,                 // [{bossId, hp, maxHp, boardIdx}, ...] 보드 위 보스들 (최대 7)
    pendingBoss,            // 보드 가득 시 대기 중인 EP번호 (null이면 없음)
  },

  // 기부 (v4.33.0+)
  donationTotal,              // 누적 기부 코인 (0~9999999)

  // 기타
  discoveredItems, currentSpecialIndex,
  firstEnergyRewardGiven, savedAt
}
```

### 관련 함수 (save.js, 18개)
`getGameData`, `migrateEnergyRecovery`, `loadDailyMissions`, `loadStoryProgress`, `cleanupLegacyItems`, `applyGameData`, `migrateRow7Missions`, `saveGame`, `saveGameNow`, `updateSaveStatus`, `sanitizeForFirestore`, `clampSaveData`, `isValidSaveData`, `diagnoseSaveData`, `saveToCloud`, `loadFromCloud`, `validateGameData`, `initNewGame`

---

## Firebase 구조

| 컬렉션 | 문서 | 용도 |
|--------|------|------|
| `saves` | `{uid}` | 게임 전체 상태 |
| `sessions` | `{uid}` | 세션 관리 (단일 로그인) |
| `races` | `{raceId}` | 레이스 상태 (player1/player2/진행도) |
| `raceCodes` | `{code}` | 유저별 영구 코드 |

### 보안 규칙 (firestore.rules)
- 본인 문서만 접근
- saves/sessions: `allow create, update` (검증) + `allow delete` (본인만, 회원탈퇴용) 분리 (v4.27.0)
- saves: `isValidSaveData()` 검증 (숫자 범위, 배열 크기, 타임스탬프)
- 앨범: `cards 0~9999`, `album 최대 100`
- races: 참가자만 읽기/쓰기, 진행도 0~15 검증
- raceCodes: 로그인 사용자만 생성/삭제 (`allow delete` 분리)

---

## 게임 시스템

### 보드 (5×7)
```
[0 ][1 ][2 ][3 ][4 ]   ← 캣타워(0), 개집(4)
[5 ][6 ][7 ][8 ][9 ]
[10][11][12][13][14]
[15][16][17][18][19]
[20][21][22][23][24]
[25][26][27][28][29]
[30][31][32][33][34]   ← 7행 미션
```

### 7행 미션
| 칸 | 조건 |
|----|------|
| 30 | 캣타워 Lv.2 |
| 31 | 개집 Lv.2 |
| 32 | 🦁 사자 (cat Lv.11) |
| 33 | 🐻‍❄️ 북극곰 (dog Lv.11) |
| 34 | 퀘스트 100개 완료 |

### 생성기
| 타입 | 이름 | 최대Lv | 생성물 | 해제 |
|------|------|--------|--------|------|
| cat | 캣타워 | 5 | 고양이(11) + 간식 | 기본 |
| dog | 개집 | 5 | 강아지(11) + 간식 | 기본 |
| toy | 장난감 | - | 장난감(5) | Lv.5 |
| bird | 새장 | 5 | 새(7) | 스페셜 |
| fish | 어항 | 5 | 물고기(7) | 스페셜 |
| reptile | 사육장 | 5 | 파충류(7) | 스페셜 |

### 퀘스트 (game.js)
- 6개 동시, 3개씩 페이지 (좌우 네비)
- 10분 타이머 (만료 시 자동 교체)
- 보상 타입 (생성 시 결정, 배타적): easy 20% 저금통 → Lv.3+ 30% 카드 → 나머지 코인
- 카드 퀘스트: 카드만 지급 / 저금통 퀘스트: 🐷만 지급 / 일반: 코인만 지급
- 난이도: easy `minLv=4`, 일반 `max(3, floor(lv/2)+1)` (상한 7), 6개 중 2개는 Lv.4 이하 보장
- 보상: `10 + score + random(0~4)` (동물×5, 간식/장난감×7)

### 상점 (systems.js)
| 칸 | 내용 | 가격 |
|----|------|------|
| 1 | cat/dog Lv.6 (고정) | 📺 광고 |
| 2~3 | 랜덤 아이템 (동물/간식/장난감) | 레벨×2 💎 |
| 4 | 🃏 카드팩 ×15 (고정) | 15💎 |
| 5 | 💎 다이아팩 ×5 (고정) | 500🪙 |

- 5분마다 갱신 (카드팩/다이아팩은 재구매 가능, 품절 안 됨)
- 1번 칸 광고 아이템: 구매 시 광고 팝업 → 시청 → 보드/창고 배치 + 품절

### 보상 구조
| 항목 | 보상 |
|------|------|
| 퀘스트 완료 (코인) | 가변 코인 (레벨 스케일링) |
| 퀘스트 완료 (카드) | 2~6장 🃏 |
| 퀘스트 완료 (저금통) | 🐷 저금통 (easy 20% 확률) |
| 누적 코인 1000 | 칸마다 100🪙 |
| 스페셜 퀘스트 (7번째 슬롯) | 🐷 저금통 (100~200🪙, 1시간 타이머) |
| 저금통 개봉 (1시간 대기) | 100~200🪙 |
| 저금통 개봉 (광고 시청) | 200~400🪙 (×2) + 즉시 개봉 |
| 주사위 여행 완주 | 500🪙 + 20💎 |
| 레벨업 | ceil(레벨/10)×3 💎 |
| 테마 완성 (9/9) | 500🪙 (×9 테마) |
| 앨범 완성 (81/81) | 500💎 + 리셋 |
| 7일 출석 보상 | D1:10💎 → D2:20🪙 → D3:5🃏 → D4:30💎 → D5:50🪙 → D6:10🃏 → D7:100💎 (연속 출석) |

---

## 앨범 시스템 (v4.4.0~v4.5.0)

### 구조
- 9 테마 × 9장 = **81장** 사진
- 등급: **N**(6장, 72%) / **R**(2장, 20%) / **SR**(1장, 8%)

### 상수
```javascript
ALBUM_CARD_COST = 15        // 뽑기 필요 카드
ALBUM_DRAW_COUNT = 3         // 1회 뽑기 사진 수
ALBUM_CARD_CHANCE = 0.30     // 퀘스트 카드 보상 확률 (30%, Lv.3+만)
ALBUM_CARD_MIN = 2           // 카드 최소
ALBUM_CARD_MAX = 6           // 카드 최대
ALBUM_DUPE_REWARD = { N: 1, R: 3, SR: 8 }
ALBUM_COMPLETE_COINS = 500   // 테마 완성 보상
ALBUM_ALL_COMPLETE_DIAMONDS = 500  // 전체 완성 보상
ALBUM_CYCLE_MS = 42일        // 초기화 주기
```

### 흐름
```
[퀘스트 완료] → 30% 확률 카드 2~6장 (생성 시 결정, Lv.3+)
      ↓
[카드 15장] → 뽑기 → 사진 3장
      ↓         ↓
   [신규]    [중복] → 등급별 카드 반환 (N:1, R:3, SR:8)
      ↓
[테마 9/9] → +500🪙 (최대 9회 = 4500🪙)
      ↓
[전체 81/81] → +500💎 → 앨범 리셋 → 새 주기
```

### 리셋 조건 (둘 중 먼저)
| 조건 | 동작 |
|------|------|
| 81장 수집 | 500💎 + cards/album/timer 초기화 |
| 42일 경과 | 토스트 알림 + 초기화 (보상 없음) |

### 테마 목록
| # | 테마 | 아이콘 |
|---|------|--------|
| 0 | 고양이의 하루 | 🐱 |
| 1 | 강아지의 하루 | 🐶 |
| 2 | 새들의 세계 | 🐦 |
| 3 | 수중 모험 | 🐟 |
| 4 | 파충류 탐험 | 🦎 |
| 5 | 간식 파티 | 🍰 |
| 6 | 장난감 왕국 | 🧸 |
| 7 | 구조 이야기 | 🚑 |
| 8 | 특별한 순간 | 🌟 |

### UI
- **앨범바** (배지 탭 콘텐츠, 90px): 뽑기 버튼(🃏15) + 테마 미니칩 9개 (아이콘+진행도, 클릭→앨범모달)
- **상단바**: 🃏카드 수 표시 (다이아와 레벨 사이)
- **뽑기 버튼**: 항상 활성화, 카드 부족 시 토스트 메시지
- **앨범 모달**: 9개 테마 탭 + 3×3 사진 그리드 + 등급별 테두리색 (N:회색, R:파랑, SR:금색)
- **미발견 사진**: opacity 0.5, 등급 테두리색 유지 (grayscale 없음)
- **테마 미니칩**: 1행 9열 그리드, 완성 테마 금색 배경, 클릭 시 해당 테마 앨범 모달 오픈

### 관련 함수 (album.js, 17개)
| 함수 | 역할 |
|------|------|
| `getThemeCollectedCount(themeIdx)` | 테마별 수집 수 계산 |
| `getRandomPhoto()` | 등급 확률로 랜덤 사진 선택 |
| `processDrawResult()` | 신규/중복 처리 |
| `drawPhotos()` | 15카드 소비 → 3장 뽑기 |
| `openPhotoDraw()` / `closePhotoDraw()` | 뽑기 팝업 |
| `checkAlbumReset()` | 42일 주기 초기화 |
| `openAlbum()` / `closeAlbum()` | 앨범 모달 |
| `renderAlbumTabs()` | 테마 탭 (진행도) |
| `switchAlbumTheme()` | 테마 전환 |
| `renderAlbumGrid()` | 3×3 사진 그리드 |
| `checkThemeComplete()` | 테마 완성 → 500🪙 |
| `checkAlbumAllComplete()` | 전체 완성 → 500💎 + 리셋 |
| `getAlbumProgress()` | 수집 수 계산 |
| `formatAlbumTimer()` | 앨범 리셋 타이머 포맷 |
| `updateAlbumBarUI()` | 앨범바 + 상단바 카드 업데이트 |

---

## 주사위 여행 (v4.17.0)

### 개요
합성 시 주사위 드랍 → 50칸 보드게임 → 완주 시 보상 + 즉시 리셋 (반복)

### 상수
```javascript
DICE_TRIP_SIZE = 50              // 보드 칸 수
DICE_DROP_CHANCE = 0.05          // 합성 시 5% 드랍
DICE_TRIP_COMPLETE_REWARD = { coins: 500, diamonds: 20 }
```

### 흐름
```
[합성] → 5% 확률 주사위 드랍
    ↓
[주사위 사용] → 1~6 이동 → 착지 칸 보상
    ↓
[50칸 완주] → 500🪙 + 20💎 → 즉시 리셋 (position=0, visited=[0], dice=0)
    ↓
[다시 시작] ← 반복
```

### 칸 보상 (50칸)
| 구간 | 보상 타입 | 범위 |
|------|-----------|------|
| 1~10 | 코인/에너지/카드/다이아 | 1~25 |
| 11~20 | 코인/에너지/카드/다이아 | 1~42 |
| 21~30 | 코인/에너지/카드/다이아 | 1~60 |
| 31~40 | 코인/에너지/카드/다이아 | 2~85 |
| 41~50 | 코인/에너지/카드/다이아 | 2~150 |

### 관련 함수 (systems.js, 8개)
| 함수 | 역할 |
|------|------|
| `tryDropDice()` | 5% 확률 주사위 드랍 |
| `useDice()` | 주사위 사용 |
| `rollDice()` | 1~6 결과 → 이동 |
| `executeMove(steps)` | 위치 이동 + 보상 |
| `giveStepRewardWithInfo(pos)` | 칸 보상 지급 (보상 문자열 반환) |
| `completeTrip()` | 완주 → 보상 + 즉시 리셋 |
| `updateDiceTripUI()` | 주사위 여행 바 업데이트 |
| `renderDiceTripBoard()` | 50칸 보드 렌더링 |

---

## 사운드 시스템 (v4.23.0)

### 개요
Web Audio API 기반 합성음 효과음 + BGM. 외부 파일 없이 코드로 생성.

### 구조
- **효과음**: `playSound(id)` → `createSynthSound(id)` → Web Audio oscillator 합성
- **BGM**: C 펜타토닉 뮤직박스 루프 (멜로디 + 베이스, 220ms interval)
- **iOS 대응**: 첫 터치 시 `unlockAudio()` → AudioContext resume
- **설정 저장**: `soundEnabled`, `musicEnabled` → saveGame()으로 저장/복원

### 효과음 목록 (17종, 카테고리별)

**A. UI (기본 인터랙션)**
| ID | 용도 | 사용처 |
|----|------|--------|
| `click` | 기본 UI 탭 (800→600Hz, 60ms) | 탭전환, 설정, 도감, 앨범, 레이스팝업, 코드복사 |

**B. Action (게임 액션)**
| ID | 용도 | 사용처 |
|----|------|--------|
| `spawn` | 아이템 생성 (440→880Hz) | spawnItem, spawnToy |
| `merge` | 합성 성공 (330→660Hz) | moveItem |
| `dice_roll` | 주사위 굴리기 (triangle 랜덤) | rollDice |

**C. Purchase (구매/거래/충전)**
| ID | 용도 | 사용처 |
|----|------|--------|
| `purchase` | 재화 소비/획득 거래 (2음 화음) | 상점구매, 에너지충전, 광고보상, 업그레이드, 보드해제, 카드팩, 다이아팩 |

**D. Reward (보상/달성)**
| ID | 용도 | 사용처 |
|----|------|--------|
| `quest_complete` | 개별 완료 (G4-C5 차임) | 퀘스트완료, 일일미션 개별완료 |
| `milestone` | 대형 달성 (E5-G5-C6) | 주사위완주, 일일올클, 7행미션, 첫에너지, 생성기해제, 단계승급 |
| `levelup` | 레벨업 (C5-E5-G5-C6 팡파레) | 레벨업 |
| `daily_bonus` | 출석 보상 (3음 아르페지오) | 7일출석 |
| `piggy_open` | 저금통 개봉 (500→1000Hz) | 저금통 터치 개봉 |
| `lucky` | 럭키 드랍 (고음 반짝임) | 럭키 아이템 생성 |
| `dice_drop` | 주사위 획득 (1200→1800Hz) | 합성 시 주사위 드랍 |

**E. Album (앨범 전용)**
| ID | 용도 | 사용처 |
|----|------|--------|
| `album_draw` | 카드 뽑기 (스윕+딩) | drawPhotos |
| `theme_complete` | 테마/앨범 완성 (5음 팡파레) | 테마완성, 앨범전체완성 |

**F. Race (레이스 전용)**
| ID | 용도 | 사용처 |
|----|------|--------|
| `race_start` | 출발 신호 (square wave) | 초대 수락 |
| `race_win` / `race_lose` | 승리·무승부 / 패배 | 레이스 결과 |

**G. Error (실패/제한/부족)**
| ID | 용도 | 사용처 |
|----|------|--------|
| `error` | 거부/실패 (sawtooth 110Hz) | 재화부족, 공간부족, 과열, 판매불가, 최대레벨, 잠금 터치 |

### 관련 함수 (sound.js, 9개)
| 함수 | 역할 |
|------|------|
| `initSound()` | AudioContext 생성 + UI 초기화 |
| `unlockAudio()` | iOS 첫 터치 오디오 unlock |
| `createSynthSound(id)` | ID별 합성음 생성/재생 |
| `playSound(id)` | 통합 재생 API |
| `playBGM()` | BGM 루프 시작 |
| `stopBGM()` | BGM 정지 |
| `toggleSound()` | 효과음 ON/OFF |
| `toggleMusic()` | BGM ON/OFF |
| `updateSoundUI()` | 설정 팝업 토글 버튼 동기화 |

---

## 온보딩 튜토리얼 (v4.15.0)

### 개요
새 유저 첫 로그인 시 4스텝 가이드 진행. 스포트라이트 + 말풍선으로 핵심 조작 안내.

### 4스텝 흐름
```
[Step 1] 캣타워 터치 → 고양이 생성
    ↓ (200ms)
[Step 2] 캣타워 한번 더 → 2마리 생성
    ↓ (200ms)
[Step 3] 같은 동물 드래그 합성
    ↓ (200ms)
[Step 4] 퀘스트 완료 버튼 터치
    ↓
[완료] → tutorialStep=0, 출석보상/레이스 초기화
```

### 튜토리얼 중 제한사항
| 제한 | 구현 위치 |
|------|-----------|
| `?` 도움말 버튼 숨김 | ui.js createItem() |
| `ⓒ` 판매 버튼 숨김 | ui.js createItem() |
| 비타겟 셀 클릭 차단 | game.js handleCellClick() + tutorial.js isTutorialClickAllowed() |
| 퀘스트 만료 스킵 | game.js checkExpiredQuests() |
| 주사위 드랍 스킵 | game.js moveItem() |
| 럭키 드랍 스킵 | game.js spawnItem() |
| 드래그 제한 (Step 3만 허용) | ui.js handleDragEnd() |
| 출석보상/레이스 지연 | main.js onAuthStateChanged(), tutorial.js completeTutorial() |

### UI 구조
- **tutorial-overlay**: 전체 화면 반투명 오버레이 (pointer-events: none)
- **tutorial-spotlight**: 타겟 요소 주변 강조 박스 (z-index: 10001)
- **tutorial-bubble**: 말풍선 (arrow-up/arrow-down)
- **tutorial-target**: 클릭/드래그 허용 요소 (z-index: 10002)

### 관련 함수 (tutorial.js, 10개)
| 함수 | 역할 |
|------|------|
| `startTutorial()` | 튜토리얼 시작 (Step 3 재개 시 페어 체크) |
| `showTutorialStep(step)` | 스포트라이트 + 말풍선 배치 |
| `positionSpotlight(targets, el)` | 타겟 바운딩 박스 계산 → 스포트라이트 위치 |
| `positionBubble(targets, arrow, el)` | 말풍선 위치 (위/아래) |
| `advanceTutorial()` | 다음 스텝 진행 |
| `completeTutorial()` | 튜토리얼 종료 → 출석보상/레이스 초기화 |
| `isTutorialClickAllowed(zone, idx)` | 스텝별 허용 셀 필터 |
| `findSameLevelPair(type)` | Step 3용 같은 레벨 동물 쌍 찾기 |
| `findReadyQuestBtn()` | Step 4용 완료 가능 퀘스트 버튼 찾기 |
| `repositionTutorial()` | DOM 변경 후 스포트라이트 재배치 |

### 스포트라이트 유지 메커니즘
- `updateAll()` 끝에 `repositionTutorial()` 호출
- `startQuestTimer()` 1초 타이머에 `repositionTutorial()` 호출
- `window.resize` 이벤트에 `repositionTutorial()` 호출

---

## 스토리 이미지 갤러리 시스템 (v4.29.0)

### 개요
모모타로 설화를 차용한 스토리 시스템. 24장의 이미지를 레벨 기반으로 개별 해제하며, 보스는 보드 위 아이템으로 존재. 동물 마을에 도깨비(거대 들쥐)가 나타나 동물들을 잡아먹고, 아기 고양이가 동료를 모아 도깨비섬으로 원정하는 어두운 톤의 이야기.

### 해제 조건
- `userLevel >= 5` (STORY_UNLOCK_LEVEL)
- 레벨 도달 시 자동으로 퀘스트 활성

### 핵심 흐름
```
[레벨 도달] → 이미지 퀘스트 자동 활성 (퀘스트바 맨 앞)
    → [아이템 제출] → 이미지 해제 + 슬라이드쇼
    → [EP 마지막 이미지] → 보스 보드 스폰
    → [합성 = 데미지] → 보스 HP 0 → 격파 보상
    → [다음 이미지 퀘스트]
```

### 이미지 갤러리 (24장, EP.1~7)

| EP | 제목 | 이미지 수 | 레벨 구간 | 보스 (HP) | 보스 보상 |
|----|------|----------|----------|-----------|----------|
| 1 | 텅 빈 마을 | 3 | Lv.5/10/15 | 도깨비 그림자 (500) | 50🪙 |
| 2 | 떠나는 발걸음 | 3 | Lv.20/25/30 | 도깨비 정찰병 (1,000) | 100🪙 |
| 3 | 첫 번째 동료 | 3 | Lv.35/40/45 | 도깨비 포수 (1,500) | 150🪙 |
| 4 | 하늘의 눈 | 3 | Lv.50/55/60 | 도깨비 궁수 (2,000) | 200🪙 |
| 5 | 검은 바다 | 3 | Lv.65/70/75 | 바다 도깨비 (2,500) | 250🪙 |
| 6 | 도깨비섬 | 4 | Lv.80/85/90/95 | 도깨비 문지기 (3,000) | 300🪙 |
| 7 | 도깨비 | 5 | Lv.100/105/110/115/120 | 도깨비 두목 (3,500) | 350🪙 |

### 보스 메커닉
- **보스 = 보드 아이템**: `{type: 'boss', bossId: N}` (N = EP번호)
- **보스 HP**: `STORY_BOSS_HP_BASE(500) × EP번호`
- **데미지**: 합성 결과 레벨 = 데미지 (mergeLevel이 곧 dmg)
- **동시 다수 보스**: 보드에 여러 보스가 동시 존재 가능
- **합성 시 모든 보스에 데미지**: 합성마다 살아있는 모든 보스에 동일 데미지
- **보스 클릭 → 정보 팝업**: 이름, 이미지, HP바, 공략 안내
- **보스 미니 HP**: 보드 셀에 n/max 형식 표시 + 미니 HP바
- **교환 가능**: 저금통처럼 보드 내 위치 교환 허용
- **이동 제한**: 합성 불가, 판매 불가, 창고 이동 불가
- **보드 가득**: pendingBoss에 저장 → 빈 칸 생기면 자동 스폰 (updateAll에서 trySpawnPendingBoss 호출)
- **HP바 색상**: 초록(>50%) → 노랑(25~50%) → 빨강(<25%)
- **합성 시 빨간 floatText로 데미지 표시**
- **격파 보상**: EP번호 × 50🪙
- **기존 게임 유지**: 보스가 있어도 생성기/에너지/퀘스트 정상 작동

### 보스 UI (보드 셀 아이템)
```
┌─────────┐
│  [보스]  │ ← 보스 이미지 (80%)
│  ████░░  │ ← 미니 HP바
│ 132/200  │ ← HP 숫자
└─────────┘
```

### 퀘스트 메커닉
- **한 번에 1개** 이미지 퀘스트만 활성 (storyProgress.activeQuestId)
- **레벨 기반 자동 활성**: checkStoryQuests()에서 레벨 체크 → 자동 퀘스트 생성
- **퀘스트바 맨 앞** 고정, 인디고 테두리
- **퀘스트 완료 시** 이미지 해제 + 슬라이드쇼 + 보상 지급
- **레벨업/일일미션 카운트에 포함** (v4.29.0 변경)
- **퀘스트 헤더에 📖 버튼** → 스토리 갤러리 모달

### 갤러리 모달
- EP별 그룹핑 (EP.1 "텅 빈 마을" 3/3 등)
- 해제된 이미지: 클릭 → 슬라이드쇼로 다시 보기
- 미해제 이미지: 자물쇠 아이콘 + 흐림 처리

### 이미지 리소스

**보스 이미지** (`images/story/`, 7종)
| 파일명 | EP |
|--------|-----|
| `boss_shadow.png` | EP.1 |
| `boss_scout.png` | EP.2 |
| `boss_trapper.png` | EP.3 |
| `boss_archer.png` | EP.4 |
| `boss_pirate.png` | EP.5 |
| `boss_guard.png` | EP.6 |
| `boss_king.png` | EP.7 |

**씬 이미지** (`images/story/scenes/`, 24종)
`ep1_intro_1.png`, `ep1_intro_2.png`, `ep1_outro_1.png`, `ep2_intro_1.png`, `ep2_intro_2.png`, `ep2_outro_1.png`, `ep3_intro_1.png`, `ep3_intro_2.png`, `ep3_outro_1.png`, `ep4_intro_1.png`, `ep4_intro_2.png`, `ep4_outro_1.png`, `ep5_intro_1.png`, `ep5_intro_2.png`, `ep5_outro_1.png`, `ep6_intro_1.png`, `ep6_intro_2.png`, `ep6_intro_3.png`, `ep6_outro_1.png`, `ep7_intro_1.png`, `ep7_intro_2.png`, `ep7_intro_3.png`, `ep7_outro_1.png`, `ep7_outro_2.png`

NPC 이미지: 기존 동물 이미지 재활용 (cat1)

### 상수
```javascript
STORY_UNLOCK_LEVEL = 5              // 해제 레벨
STORY_BOSS_HP_BASE = 500            // 보스 HP = 500 × EP번호
STORY_IMAGES = [{ id, ep, title, img, text, reqLevel, reqs, reward, isLastInEp, bossName, bossImg }, ...]  // 24항목
```

### 관련 함수 (story.js, 19개)
| 함수 | 역할 |
|------|------|
| `getNextStoryImage()` | 다음 해제 가능 이미지 조회 |
| `checkStoryQuests()` | 레벨 체크 → 퀘스트 자동 활성 |
| `activateImageQuest(img)` | 이미지 퀘스트 생성 → 퀘스트바 맨 앞 |
| `completeImageQuest(imageId)` | 이미지 해제 + 슬라이드쇼 + 보스 스폰 |
| `spawnBossOnBoard(epNumber)` | 보스를 보드 빈 칸에 배치 |
| `trySpawnPendingBoss()` | 대기 중 보스 재시도 (빈 칸 생기면) |
| `dealBoardBossDamage(mergeLevel)` | 합성 시 모든 보스에 데미지 |
| `defeatBoardBoss(boss)` | 보스 HP 0 → 보드 제거 + 보상 |
| `createBossItem(item, bossData, imgData)` | 보스 셀 DOM 렌더링 |
| `showBossInfoPopup(bossData, imgData)` | 보스 클릭 → 정보 팝업 |
| `closeBossInfoPopup()` | 정보 팝업 닫기 |
| `showStoryPopup(slides, npcImg, title, onClose)` | 슬라이드쇼 모달 |
| `showStorySlide(idx)` | 슬라이드 렌더링 (이미지+텍스트+도트) |
| `advanceStorySlide()` | 다음 슬라이드 |
| `closeStoryPopup()` | 슬라이드쇼 닫기 |
| `openStoryGallery()` | 갤러리 모달 열기 |
| `renderStoryGallery()` | EP별 이미지 그리드 렌더링 |
| `viewStoryImage(imageId)` | 해제된 이미지 다시 보기 |
| `updateStoryUI()` | 퀘스트 헤더 진행도 (n/24) |

---

## 레이스 시스템 (v4.8.0)

### 개요
친구 코드를 입력해서 퀘스트 10개를 먼저 완료하는 1:1 경쟁 콘텐츠

### 규칙
- **목표**: 퀘스트 10개 먼저 완료
- **시간 제한**: 1시간 (레이스 시작 후)
- **초대 만료**: 10분 (응답 없으면 자동 만료)
- **영구 코드**: 각 유저별 고유 6자리 코드 (만료 없음)
- **초대 방식**: 코드 입력 → 초대 전송 → 상대방 수락 시 시작
- **퀵 조인**: 최근 상대 3명 버튼으로 빠른 재대결

### 흐름
```
[A가 B 코드 입력]
    ↓
races/{raceId} 생성 (status: 'pending')
    ↓
A 화면: "초대 대기 중... ⏱️ 9:45 [취소]"
B 화면: 팝업 "A님이 레이스 초대! [수락] [거절]"
    ↓
[B가 수락] → status: 'active' → 레이스 시작!
[B가 거절] → status: 'declined' → A에게 알림
[10분 경과] → status: 'expired' → 거절 처리
[A가 취소] → status: 'cancelled' → 초대 취소
    ↓
[레이스 진행] → 퀘스트 완료 → 진행도 +1 (onSnapshot)
    ↓
[10개 먼저 완료] → 승리! → 보상 지급
```

### 보상
| 결과 | 보상 |
|------|------|
| 승리 | 150🪙 + 5💎 |
| 패배 | 30🪙 |
| 무승부 | 80🪙 + 3💎 |
| 시간 초과 | 30🪙 |

### Firestore 구조

**races/{raceId}**
```javascript
{
  player1Uid, player1Name,     // 초대한 유저 (코드 입력자)
  player2Uid, player2Name,     // 초대받은 유저 (코드 주인)
  status: 'pending' | 'active' | 'completed' | 'declined' | 'expired' | 'cancelled',

  // pending 상태용
  inviteExpiresAt,             // createdAt + 10분

  // active 상태용
  player1Progress, player2Progress, // 0~10
  expiresAt,                   // 레이스 시작 + 1시간

  // completed 상태용
  winnerUid,                   // uid, 'draw', 또는 'timeout_draw'
  timedOut,                    // 시간 초과 여부
  rewardClaimed: { [uid]: boolean },

  createdAt
}
```

**raceCodes/{code}** (영구)
```javascript
{
  ownerUid, ownerName,
  createdAt
}
```

### 상수
```javascript
RACE_GOAL = 7                  // 퀘스트 7개 완료
RACE_EXPIRE_MS = 60분          // 레이스 1시간 제한
RACE_INVITE_EXPIRE_MS = 10분   // 초대 10분 만료
```

### UI
- **레이스바**: 내 코드 + 복사 버튼 + 코드 입력 버튼 (같은 행)
- **대기 상태**: 타이머(mm:ss) + 취소 버튼 + "초대 대기 중..." 메시지
- **레이싱 트랙**: 도로 배경 + 자동차 이모지 + 결승선
- **참가 팝업**: 코드 입력 + 최근 상대 퀵 조인 버튼 (최대 3명)
- **초대 팝업**: 초대자 이름 + 타이머 + 수락/거절 버튼

### 엣지케이스 처리
| 케이스 | 처리 |
|--------|------|
| 수락/거절 동시 | Transaction으로 atomic 처리 |
| 수락 시 만료 | Transaction에서 inviteExpiresAt 검증 |
| 팝업 10분 방치 | 0:00 되면 팝업 자동 닫기 + 토스트 |
| 만료된 초대 표시 | showRaceInvitePopup에서 만료 체크 후 무시 |
| 새로고침 후 복원 | validateCurrentRace에서 상태별 처리 |

### 관련 함수 (race.js, 30개)
| 함수 | 역할 |
|------|------|
| `generateRaceCode()` | 6자리 코드 생성 |
| `getOrCreateMyCode()` | 내 영구 코드 생성/조회 |
| `findActiveRace()` | 유저의 active 레이스 찾기 |
| `findActiveOrPendingRace()` | active + pending 레이스 찾기 |
| `joinRaceByCode()` | 코드 입력 → 초대 전송 (pending) |
| `copyRaceCode()` | 클립보드 복사 |
| `startRaceListener()` | onSnapshot (pending/active/completed 처리) |
| `stopRaceListener()` | 리스너 + 타이머 해제 |
| `startPlayer2Listener()` | pending 초대 감지 |
| `stopPlayer2Listener()` | player2 리스너 해제 |
| `showRaceInvitePopup()` | 초대 팝업 표시 (만료 검증) |
| `closeRaceInvitePopup()` | 초대 팝업 닫기 |
| `startInviteTimer()` | 초대 타이머 시작 (만료 시 자동 닫기) |
| `stopInviteTimer()` | 초대 타이머 해제 |
| `acceptRaceInvite()` | 초대 수락 (Transaction) |
| `declineRaceInvite()` | 초대 거절 (Transaction) |
| `cancelPendingInvite()` | 초대 취소 (Transaction) |
| `expireInvite()` | 초대 만료 처리 |
| `updatePendingInviteUI()` | 대기 상태 UI 업데이트 |
| `updateRaceProgress()` | completeQuest에서 호출 |
| `checkRaceWinner()` | 승리자 판정 |
| `checkRaceTimeout()` | 시간 초과 처리 |
| `showRaceResult()` | 결과 표시 + 보상 지급 + 상대 저장 |
| `claimRaceReward()` | 보상 수령 기록 |
| `addRecentOpponent()` | 최근 상대 저장 (최대 3명) |
| `quickJoinRace()` | 최근 상대로 빠른 초대 |
| `updateRaceUI()` | 레이스바 업데이트 |
| `updateRaceUIFromData()` | 실시간 트랙 + 타이머 업데이트 |
| `openRaceJoinPopup()` | 참가 팝업 + 최근 상대 렌더링 |
| `submitRaceCode()` | 코드 입력 제출 |
| `validateCurrentRace()` | 레이스 유효성 검증 (상태별 처리) |
| `initRace()` | 초기화 |

---

## 주요 함수 목록 (파일별)

### game.js (43개)
`addCoins`, `spawnPiggyBank`, `discoverItem`, `countEasyQuests`, `generateNewQuest`, `generateSpecialQuest`, `trySpawnSpecialGenerator`, `removeQuestItems`, `handleLevelUp`, `completeQuest`, `checkExpiredQuests`, `formatQuestTimer`, `spawnItem`, `spawnToy`, `handleCellClick`, `handleLockedCell`, `handleMissionCell`, `handleSpecialItem`, `triggerGen`, `openCooldownPopup`, `confirmCooldownReset`, `getEnergyPrice`, `checkEnergyAfterUse`, `openEnergyPopup`, `closeEnergyPopup`, `buyEnergy`, `getActiveTypes`, `checkToyGeneratorUnlock`, `moveItem`, `tryMergeItems`, `updateBossIdx`, `checkDailyReset`, `addDailyProgress`, `checkDailyMissionComplete`, `claimDailyBonus`, `spawnBubble`, `showBubblePopup`, `openBubbleByAd`, `openBubbleByDiamond`, `adEnergy`, `openAdPopup`, `confirmAd`, `checkDailyBonus`

### systems.js (23개)
`hasItemOfType`, `hasItemOfTypeAndLevel`, `getMaxLevelOfType`, `checkAutoCompleteMissions`, `startShopTimer`, `refreshShop`, `generateRandomShopItem`, `renderShop`, `buyShopItem`, `askSellItem`, `tryDropDice`, `useDice`, `rollDice`, `executeMove`, `closeDiceRollPopup`, `giveStepRewardWithInfo`, `completeTrip`, `updateDiceTripUI`, `renderDiceTripBoard`, `getDonationTitle`, `getNextMilestone`, `donate`, `updateDonationUI`

### ui.js (35개)
`renderGrid`, `createItem`, `updateAll`, `updateUI`, `updateLevelupProgressUI`, `updateTimerUI`, `updateQuestUI`, `spawnParticles`, `spawnItemEffect`, `showLuckyEffect`, `showFloatText`, `showError`, `showToast`, `showMilestonePopup`, `openOverlay`, `closeOverlay`, `openSettings`, `closeSettings`, `formatTime`, `updateEnergyPopupTimer`, `handleDragStart`, `handleDragMove`, `handleDragEnd`, `openGuideForItem`, `openGuide`, `closeModal`, `switchGuideTab`, `renderGuideList`, `getGenSpawnLevels`, `renderSpawnPreview`, `updateUpgradeUI`, `upgradeGenerator`, `toggleBottomTab`, `updateBottomBadges`, `updateDailyMissionUI`

### race.js (32개)
`generateRaceCode`, `getOrCreateMyCode`, `findActiveRace`, `joinRaceByCode`, `findActiveOrPendingRace`, `copyRaceCode`, `startRaceListener`, `stopRaceListener`, `updateRaceProgress`, `checkRaceWinner`, `checkRaceTimeout`, `showRaceResult`, `claimRaceReward`, `addRecentOpponent`, `updateRaceUI`, `updateRaceUIFromData`, `openRaceJoinPopup`, `quickJoinRace`, `submitRaceCode`, `validateCurrentRace`, `startPlayer2Listener`, `stopPlayer2Listener`, `showRaceInvitePopup`, `closeRaceInvitePopup`, `startInviteTimer`, `stopInviteTimer`, `acceptRaceInvite`, `declineRaceInvite`, `cancelPendingInvite`, `expireInvite`, `updatePendingInviteUI`, `initRace`

### sound.js (9개)
`initSound`, `unlockAudio`, `createSynthSound`, `playSound`, `playBGM`, `stopBGM`, `toggleSound`, `toggleMusic`, `updateSoundUI`

### story.js (20개)
`getBossHpColor`, `getNextStoryImage`, `checkStoryQuests`, `activateImageQuest`, `completeImageQuest`, `spawnBossOnBoard`, `trySpawnPendingBoss`, `dealBoardBossDamage`, `defeatBoardBoss`, `createBossItem`, `showBossInfoPopup`, `closeBossInfoPopup`, `showStoryPopup`, `showStorySlide`, `advanceStorySlide`, `closeStoryPopup`, `openStoryGallery`, `renderStoryGallery`, `viewStoryImage`, `updateStoryUI`

### tutorial.js (10개)
`startTutorial`, `showTutorialStep`, `positionSpotlight`, `positionBubble`, `advanceTutorial`, `completeTutorial`, `isTutorialClickAllowed`, `findSameLevelPair`, `findReadyQuestBtn`, `repositionTutorial`

### main.js (8개)
`init`, `createBoardCells`, `createStorageCells`, `createShopCells`, `startEnergyRecovery`, `startCooldownTimer`, `startQuestTimer`, `startDailyMissionTimer`

---

## 상수 (constants.js)

### 그리드
`GRID_COLS=5`, `GRID_ROWS=7`, `BOARD_SIZE=35`, `STORAGE_SIZE=5`, `SHOP_SIZE=5`

### 밸런스
`MAX_ENERGY=100`, `RECOVERY_SEC=30`, `SHOP_REFRESH_MS=300000`, `UNLOCK_COST_BOARD=100`, `SNACK_CHANCE=0.08`, `AD_ENERGY_AMOUNT=30`

### 저금통
`PIGGY_BANK_TIMER_MS=3600000`, `PIGGY_BANK_MIN_COINS=100`, `PIGGY_BANK_MAX_COINS=200`

### 주사위 여행
`DICE_TRIP_SIZE=50`, `DICE_DROP_CHANCE=0.03`, `DICE_TRIP_COMPLETE_REWARD={coins:500, diamonds:20}`

### 에너지 구매
`getEnergyPrice()` → 500 + 구매횟수×50 (KST 자정 리셋)
- 광고 시청 → +30⚡ (에너지 팝업 내 광고 버튼)

### 데이터 배열 (11개)
`CATS`(11), `DOGS`(11), `BIRDS`(7), `FISH`(7), `REPTILES`(7), `CAT_SNACKS`(5), `DOG_SNACKS`(5), `CAT_TOYS`(5), `DOG_TOYS`(5), `ALBUM_THEMES`(9테마×9장), `NPC_AVATARS`, `DAILY_MISSIONS`(3단계×3개), `ATTENDANCE_REWARDS`(7일), `DICE_TRIP_REWARDS`(50칸)

### 퀘스트/럭키 (v4.25.1)
`SPECIAL_QUEST_REWARD=300`, `QUEST_EXPIRE_MS=600000`, `QUEST_SNACK_CHANCE=0.3`, `QUEST_PIGGY_CHANCE=0.2`, `QUEST_MULTI_BASE_CHANCE=0.3`, `QUEST_MULTI_LEVEL_FACTOR=0.05`, `QUEST_MULTI_MAX_CHANCE=0.8`, `LUCKY_BASE_CHANCE=0.05`, `LUCKY_LEVEL_BONUS=0.01`, `LUCKY_SNACK_CHANCE=0.5`, `QUEST_COUNT_MISSION_GOAL=100`, `CLOUD_SAVE_DEBOUNCE_MS=500`

### 유저 이름 (v4.25.2)
`MAX_NAME_LENGTH=6`, `getDisplayName(user)` → 첫 단어 기준 최대 6자

### 생성기
`CAGE_UPGRADE_COST=1000`, `CAGE_MAX_LEVEL=5`, `GENERATOR_MAX_CLICKS=6`, `GENERATOR_COOLDOWN_MS=60000`

### 버블 아이템 (v4.30.0)
`BUBBLE_MIN_LEVEL=4`, `BUBBLE_CHANCE=0.05`, `BUBBLE_EXPIRE_MS=180000`, `BUBBLE_DIAMOND_PER_LEVEL=10`

### 스토리 갤러리 (v4.29.0)
`STORY_UNLOCK_LEVEL=5`, `STORY_BOSS_HP_BASE=500`, `STORY_IMAGES`(24항목, EP.1~7)

### 스페셜 생성기 업그레이드 (v4.31.0)
`SPECIAL_UPGRADE_COST=1500`, `SPECIAL_COOLDOWNS=[300000,240000,180000,120000,60000]` (Lv.1~5: 5분→1분), `getSpecialCooldown(type)`

### 쿨다운 즉시 해제 (v4.33.0)
`COOLDOWN_COIN_PER_SEC=5` (남은 초 × 5코인)

### 기부 시스템 (v4.33.0)
`DONATION_AMOUNTS=[100, 500, 1000, 5000]`, `DONATION_MILESTONES` (6단계: 1K~500K, 칭호+다이아 보상)

### 생성기 이름 매핑 (v4.31.2)
`GENERATOR_NAMES={cat:'캣타워', dog:'개집', bird:'새장', fish:'어항', reptile:'사육장', toy:'장난감 상자'}`, `getGeneratorName(type)`

### 헬퍼 함수 (11개)
`getItemList`, `getMaxLevel`, `getItemData`, `getDisplayName`, `formatMinSec`, `getSpecialCooldown`, `getLevelUpGoal`, `getLevelUpReward`, `getKSTDateString`, `getMsUntilKSTMidnight`, `getGeneratorName`

---

## 배포

### 개발 명령어
```bash
npm run lint          # ESLint 검사
npm test              # Vitest 테스트 (86개)
npm run format        # Prettier 포맷팅
npm run setup-hooks   # pre-commit hook 설치
```

### GitHub Pages (게임)
```bash
git push   # → 자동 배포 (1~2분), pre-commit hook이 lint+test 자동 실행
```

### Firebase (인증 + 규칙)
```bash
firebase deploy --only hosting           # 인증 핸들러
firebase deploy --only firestore:rules   # 보안 규칙
```

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 로그인 404 | Firebase Hosting 미배포 | `firebase deploy --only hosting` |
| 로그인 버튼 무반응 | JS 에러 | F12 콘솔 확인 |
| 다중 기기 로그아웃 안 됨 | onSnapshot 미시작 | `startSessionListener()` 확인 |
| 데이터 손실 | 네트워크 오류 + 빈 데이터 저장 | v4.2.8 3중 방어 체계로 해결 |
| 스토리 퀘스트 안 나옴 | expiresAt:null이 로드 시 10분 타이머로 덮어씌워짐 → 만료 후 데드락 | v4.31.2 isStory 체크 + desync 복구 |

---

## 변경 이력

### v4.33.0 (2026-02-20) - 쿨다운 즉시 해제 + 기부 시스템
- 🔥 **쿨다운 즉시 해제** 추가
  - 과열 중 생성기 클릭 → 팝업 → 코인으로 즉시 해제 (남은초 × `COOLDOWN_COIN_PER_SEC=5` 코인)
  - bird/fish/reptile/toy 모든 생성기 적용 (기존 `showError('과열!')` → `openCooldownPopup()`)
  - 팝업에 남은 시간 + 해제 비용 표시, 쿨다운 만료 시 자동 무료 해제 (cost=0)
  - 코인 부족 시 에러 토스트, 보드 아이템 null 방어
- 🎁 **기부 시스템** 추가
  - 하단 배지 바 6번째 탭 "기부" (5열→6열 grid)
  - NPC에게 코인 기부 (100/500/1000/5000 4단계 버튼)
  - 6단계 칭호 마일스톤: 작은 나눔(1K)→따뜻한 마음(5K)→마을의 은인(20K)→동물 수호자(50K)→전설의 후원자(100K)→동물 마을의 영웅(500K)
  - 마일스톤 달성 시 다이아 보상 (2/5/10/20/30/50💎) + 마일스톤 팝업
  - 설정 팝업에 유저 이름 옆 칭호 표시
  - 기부 탭 UI: NPC 이미지 + 칭호 + 누적액 + 다음 목표 + 버튼 disabled 상태
  - 교환율이 갈수록 나빠짐 = 진정한 코인 싱크 (Lv.30+ 코인 잉여 해결)
- 수정 파일: js/constants.js, js/state.js, js/game.js, js/systems.js, js/ui.js, js/save.js, index.html, css/styles.css, firestore.rules, eslint.config.js (10개)
- 신규 상수 (3개): `COOLDOWN_COIN_PER_SEC`, `DONATION_AMOUNTS`, `DONATION_MILESTONES`
- 신규 변수 (1개): `donationTotal` (state.js)
- 신규 함수 (6개): `openCooldownPopup`, `confirmCooldownReset` (game.js), `getDonationTitle`, `getNextMilestone`, `donate`, `updateDonationUI` (systems.js)
- 신규 저장 필드: `donationTotal`
- 신규 HTML: `#cooldown-popup` (쿨다운 해제 팝업), `#donate-wrapper` (기부 콘텐츠), 6번째 배지 버튼, `#settings-title` (칭호 span)
- CSS: `#bottom-nav` grid 5→6열
- firestore.rules: `donationTotal` 검증 (0~9999999)
- 수정 함수: `triggerGen()` (game.js - openCooldownPopup 호출), `toggleBottomTab()` (ui.js - donate 매핑), `updateBottomBadges()` (ui.js - 기부 배지), `openSettings()` (ui.js - 칭호 표시)

### v4.31.2 (2026-02-20) - 스토리 퀘스트 데드락 수정 + 코드 리팩토링
- 🐛 **스토리 퀘스트 데드락 수정**
  - 근본 원인: `save.js` 퀘스트 로딩 시 `expiresAt` 매핑이 `isSpecial`만 체크 → 스토리 퀘스트(`isStory`)의 `null`이 10분 타이머로 덮어씌워짐 → 만료 후 `activeQuestId` desync → 영구 데드락
  - fix(save.js): `(q.isSpecial || q.isStory) ? null` 로 스토리 퀘스트 타이머 방지
  - fix(story.js): `checkStoryQuests()`에 desync 복구 로직 추가 (activeQuestId 있으나 퀘스트 없으면 재활성)
  - fix(ui.js): `updateAll()`에 `checkStoryQuests()` 추가 (모든 게임 액션 후 자동 활성화)
- 🔧 **함수 크기 축소** (80줄+ 함수 3개 분리)
  - `applyGameData` 217줄 → ~65줄 (4개 헬퍼: `migrateEnergyRecovery`, `loadDailyMissions`, `loadStoryProgress`, `cleanupLegacyItems`)
  - `handleCellClick` 87줄 → ~15줄 (3개 핸들러: `handleLockedCell`, `handleMissionCell`, `handleSpecialItem`)
  - `moveItem` 90줄 → ~30줄 (2개 헬퍼: `tryMergeItems`, `updateBossIdx`)
- 🔧 **중복 매핑 상수화**
  - `GENERATOR_NAMES` 객체 + `getGeneratorName(type)` 헬퍼 (constants.js)
  - `ui.js` 4곳 하드코딩 제거 (createItem ×2, openGuide, upgradeGenerator)
- 🔧 **Pre-commit Hook**
  - `hooks/pre-commit`: commit 시 lint+test 자동 실행
  - `package.json`: `setup-hooks` script 추가
- 🧪 **테스트 인프라**
  - Vitest 설정 + 테스트 83개 (constants 51개 + save 32개)
  - `tests/helpers/loadConstants.js`, `tests/helpers/loadSave.js` (vm context 기반)
- 수정 파일: js/save.js, js/story.js, js/ui.js, js/game.js, js/constants.js, eslint.config.js, package.json (7개)
- 신규 파일: hooks/pre-commit, vitest.config.js, tests/ (4파일)
- 신규 상수 (1개): `GENERATOR_NAMES`
- 신규 헬퍼 (1개): `getGeneratorName(type)` (constants.js)
- 신규 함수 (9개): `migrateEnergyRecovery`, `loadDailyMissions`, `loadStoryProgress`, `cleanupLegacyItems` (save.js), `handleLockedCell`, `handleMissionCell`, `handleSpecialItem`, `tryMergeItems`, `updateBossIdx` (game.js)
- 수정 함수: `applyGameData()` (save.js - 헬퍼 추출 + expiresAt 수정), `checkStoryQuests()` (story.js - desync 복구), `updateAll()` (ui.js - checkStoryQuests 추가), `handleCellClick()` (game.js - 핸들러 분리), `moveItem()` (game.js - 헬퍼 분리), `createItem()` (ui.js - getGeneratorName), `openGuide()` (ui.js - getGeneratorName), `upgradeGenerator()` (ui.js - getGeneratorName)

### v4.31.0 (2026-02-20) - 스페셜 생성기 업그레이드 시스템
- ⬆️ **스페셜 생성기(새장/어항/사육장) Lv.1~5 업그레이드** 추가
  - 핵심 효과: 과열 쿨다운 감소 (Lv.1=5분 → Lv.5=1분)
  - 업그레이드 비용: 1,500🪙 (cat/dog는 기존 1,000🪙 유지)
  - 럭키 보너스 없음 (쿨다운 감소만)
  - 도감 업그레이드 탭: cat/dog 섹션(행운%, 생성 미리보기)과 스페셜 섹션(쿨다운 비교) 분리
  - 쿨다운 오버레이: 초(s) → 분:초(m:ss) 포맷으로 변경
  - 생성기 라벨에 레벨 표시: `새장 (Lv.n)`
- 💾 **하위 호환**: 기존 유저 genLevels `{cat, dog}` → `{cat, dog, bird:1, fish:1, reptile:1}` 자동 확장
- 수정 파일: js/constants.js, js/state.js, js/game.js, js/ui.js, js/save.js, index.html, eslint.config.js (7개)
- 신규 상수 (2개): `SPECIAL_UPGRADE_COST`, `SPECIAL_COOLDOWNS`
- 신규 헬퍼 (1개): `getSpecialCooldown(type)` (constants.js)
- genLevels 확장: `{cat, dog}` → `{cat, dog, bird, fish, reptile}`
- 신규 HTML: `#upg-catdog-section`, `#upg-special-section` (업그레이드 UI 분리), `#upg-cost` (동적 비용)
- 수정 함수: `triggerGen()` (game.js - 동적 쿨다운), `createItem()` (ui.js - 레벨 라벨+mm:ss 포맷), `updateUpgradeUI()` (ui.js - 섹션 분기), `upgradeGenerator()` (ui.js - 스페셜 비용), `applyGameData()` (save.js - 5타입 호환), `initNewGame()` (save.js - 5타입 초기화)
- 캐시 버스팅: `?v=4.30.0` → `?v=4.31.0`

### v4.30.0 (2026-02-19) - 버블 아이템 시스템 + 코드 리팩토링
- 🫧 **버블 아이템 시스템** 추가
  - 합성 결과 Lv.4+ 시 5% 확률로 버블 아이템 스폰 (스페셜 타입 제외)
  - 버블 = 합성 결과와 같은 타입/레벨 아이템이 담긴 캡슐
  - 3분 제한 시간 (만료 시 자동 소멸)
  - 획득 방법: 광고 시청(무료) 또는 다이아(레벨×10💎) 구매
  - 합성/판매/이동 불가, 보드 위에서만 존재
- 🔧 **코드 리팩토링** (v4.30.0)
  - `removeQuestItems()` 헬퍼 추출 (completeQuest에서 분리)
  - `handleLevelUp()` 헬퍼 추출 (completeQuest에서 분리)
  - `getGenSpawnLevels()`, `renderSpawnPreview()` 헬퍼 추출 (ui.js)
- 🐛 **스페셜 타입 버블 생성 차단** (bird/fish/reptile)
- 수정 파일: js/game.js, js/ui.js, js/constants.js, js/save.js, index.html, css/styles.css, eslint.config.js
- 신규 상수 (4개): `BUBBLE_MIN_LEVEL`, `BUBBLE_CHANCE`, `BUBBLE_EXPIRE_MS`, `BUBBLE_DIAMOND_PER_LEVEL`
- 신규 함수 (6개): `spawnBubble`, `showBubblePopup`, `openBubbleByAd`, `openBubbleByDiamond`, `removeQuestItems`, `handleLevelUp` (game.js)
- 신규 함수 (2개): `getGenSpawnLevels`, `renderSpawnPreview` (ui.js)
- 캐시 버스팅: `?v=4.29.1` → `?v=4.30.0`

### v4.29.0 (2026-02-19) - 스토리 시스템 전면 리디자인
- 📖 **스토리 시스템 전면 리디자인** (v4.28.0 챕터/에피소드 구조 폐기)
  - 기존: 챕터 1개 × 에피소드 8개 → 퀘스트 → 보스전 (오버레이 HP바)
  - 신규: 24장 이미지 (EP.1~7) → 레벨 기반 개별 해제 → 보스는 보드 아이템
  - `STORY_CHAPTERS` 삭제 → `STORY_IMAGES` (24항목) + `STORY_BOSS_HP_BASE = 500`
  - `STORY_UNLOCK_LEVEL` 3 → 5
  - `STORY_DMG_MULTIPLIER` 삭제 → 합성 레벨 = 데미지 (mergeLevel이 곧 dmg)
  - 해제 조건: userLevel >= next.reqLevel (이미지별 개별 레벨)
- 🎮 **보스 보드 아이템화**
  - 보스가 보드 위 아이템으로 존재 (`{type: 'boss', bossId: N}`)
  - 보스 HP = 500 × EP번호 (EP.1=500, EP.7=3,500)
  - 합성마다 모든 살아있는 보스에 데미지 (합성 결과 레벨 = 데미지)
  - 다수 보스 동시 존재 가능
  - 보스 클릭 → 정보 팝업 (이름, 이미지, HP바, 공략 안내)
  - 보스 미니 HP 표시: n/max 형식 + 미니 HP바
  - 보스 교환 가능 (저금통처럼), 합성/판매/창고 이동 불가
  - 보드 가득 → pendingBoss → 빈 칸 생기면 trySpawnPendingBoss 자동 재시도
  - 격파 보상: EP번호 × 50🪙
- 🖼️ **이미지 갤러리 시스템**
  - 퀘스트 헤더 📖 버튼 → 스토리 갤러리 모달
  - EP별 그룹핑 + 진행도 표시 (n/n)
  - 해제된 이미지 클릭 → 슬라이드쇼로 다시 보기
  - 미해제 이미지: 자물쇠 아이콘 + 흐림 처리
- 📋 **스토리 퀘스트 변경**
  - 레벨 도달 시 자동 퀘스트 활성 (checkStoryQuests)
  - 퀘스트 완료 → 이미지 해제 + 슬라이드쇼
  - 레벨업/일일미션 카운트에 포함 (v4.28.0에서는 미포함이었음)
- 💾 **save.js 강화**
  - `clampSaveData()` 추가: 숫자 범위 + 배열 크기 클램핑 (Firestore 저장 전)
  - `diagnoseSaveData()` 추가: Firestore 규칙 23개 항목 개별 진단 로깅
  - 저장 실패 시 clampSaveData → 재시도 → diagnoseSaveData 순서
  - storyProgress 마이그레이션: v4.28.0 구조(currentChapter 등) → v4.29.0 구조(unlockedImages 등)
  - 보드 위 보스 아이템 자동 복원 (applyGameData에서 bosses.boardIdx 기반)
- storyProgress 구조 변경:
  ```
  기존: { currentChapter, currentEpisode, completed, chaptersCompleted, phase, bossHp, bossMaxHp }
  신규: { unlockedImages, activeQuestId, bosses, pendingBoss }
  ```
- story.js 전면 재작성 (~230줄 → ~319줄)
  - 삭제 함수 (14개): checkStoryUnlock, getCurrentStoryEpisode, startStoryEpisode, activateStoryQuest(기존), completeStoryQuest, startBossBattle, dealBossDamage, updateBossUI, defeatBoss, giveStoryReward, completeStoryChapter, renderStoryChapterList, openStoryChapterList, updateStoryUI(기존)
  - 신규 함수 (19개): getNextStoryImage, checkStoryQuests, activateImageQuest, completeImageQuest, spawnBossOnBoard, trySpawnPendingBoss, dealBoardBossDamage, defeatBoardBoss, createBossItem, showBossInfoPopup, closeBossInfoPopup, showStoryPopup, showStorySlide, advanceStorySlide, closeStoryPopup, openStoryGallery, renderStoryGallery, viewStoryImage, updateStoryUI(새)
- 수정 파일: js/story.js (전면 재작성), js/constants.js, js/state.js, js/save.js, js/game.js, index.html, css/styles.css, eslint.config.js, firestore.rules
- 신규 상수 (2개): `STORY_BOSS_HP_BASE`, `STORY_IMAGES`
- 삭제 상수 (2개): `STORY_DMG_MULTIPLIER`, `STORY_CHAPTERS`
- 변경 상수: `STORY_UNLOCK_LEVEL` 3 → 5
- 신규 변수 (state.js): `storySlides`, `storySlideIdx`, `storySlideOnClose`
- storyProgress 구조 변경: `unlockedImages`, `activeQuestId`, `bosses`, `pendingBoss`
- 신규 HTML: `#boss-info-popup` (보스 정보 팝업), `#story-gallery-modal` (갤러리 모달), `#story-slide-area`, `#story-slide-img`, `#story-slide-text`, `#story-slide-dots`
- 삭제 HTML: `#boss-overlay` (HP바 오버레이), `#story-chapter-modal` (챕터 목록)
- 신규 CSS: `.boss-board-item`, `.boss-mini-hp`, `.boss-mini-hp-fill`, `.gallery-image`, `.gallery-image.locked`, `.story-gallery-grid`, `.story-ep-header`, `.story-npc-img`, `.story-slide-img`, `.story-slide-text`, `.story-slide-dots`, `.story-dot`
- 삭제 CSS: `.boss-overlay`, `.boss-hp-track`, `.boss-hp-fill`, `.boss-dmg-text`, `@keyframes bossDmg`
- 신규 이미지 (24개): `images/story/scenes/` 폴더에 ep1_intro_1.png ~ ep7_outro_2.png
- save.js 신규 함수 (2개): `clampSaveData()`, `diagnoseSaveData()`
- firestore.rules: storyProgress 검증 변경 (unlockedImages 최대 30, bosses 최대 10)
- eslint.config.js: story.js 전역 전면 교체 (STORY_IMAGES, STORY_BOSS_HP_BASE, 19개 함수, 슬라이드 변수 3개)
- 캐시 버스팅: `?v=4.28.0` → `?v=4.29.0` (전체 JS/CSS)
- 수정 함수: `completeQuest()` (game.js - 스토리 퀘스트 레벨업/진행도 포함), `moveItem()` (game.js - 보스 교환/이동 제한/boardIdx 갱신), `handleCellClick()` (game.js - 보스 클릭 → 정보 팝업), `applyGameData()` (save.js - v4.29.0 storyProgress 로드/마이그레이션 + 보스 보드 복원), `createItem()` (ui.js - 보스 셀 렌더링 분기)

### v4.28.0 (2026-02-19) - 스토리 미션 시스템 추가
- 📖 **스토리 미션 시스템** 추가
  - 모모타로 설화 차용, 어두운 톤의 스토리 (도깨비=거대 들쥐)
  - 챕터 1 "도깨비섬으로" 8화 구현
  - 에피소드 2단계 구조: 퀘스트(아이템 제출) → 보스전(합성=데미지)
  - 해제 조건: userLevel >= 3
  - 한 번에 1개 에피소드만 활성, 타이머 없음
- ⚔️ **보스전 메커닉**
  - 합성 시 보스에게 데미지 (합성 결과 레벨 × 3)
  - 보스 HP바 오버레이 (보드 위, 색상 변화: 초록→노랑→빨강)
  - 합성 시 빨간 floatText로 데미지 팝업
  - 패배 없음 (시간 제한 없이 HP 깎으면 됨, 캐주얼 친화)
  - 보스전 중 기존 게임 정상 작동 (생성기, 에너지, 일반 퀘스트)
- 📋 **스토리 퀘스트 UI**
  - 퀘스트바 맨 앞 고정, 인디고 테두리/그라데이션
  - 레벨업/일일미션 카운트에 미포함
  - NPC 이미지 표시 (기존 동물 이미지 재활용)
- 📖 **챕터 목록 모달**
  - 퀘스트 헤더 📖 버튼으로 접근
  - 에피소드별 상태 표시 (완료✓/진행중→/잠금🔒)
- 🔄 **보스전 복원**
  - 페이지 새로고침 후 보스전 상태 자동 복원 (main.js onAuthStateChanged)
  - 퀘스트 진행 중이면 스토리 퀘스트 자동 재활성
- 신규 파일: `js/story.js` (~230줄, 16개 함수)
- 수정 파일: js/constants.js, js/state.js, js/save.js, js/game.js, js/ui.js, js/main.js, index.html, css/styles.css, firestore.rules, eslint.config.js
- 신규 상수 (3개): `STORY_UNLOCK_LEVEL`, `STORY_DMG_MULTIPLIER`, `STORY_CHAPTERS`
- 신규 변수: `storyProgress` (state.js)
- 신규 함수 (16개): `checkStoryUnlock`, `getCurrentStoryEpisode`, `startStoryEpisode`, `activateStoryQuest`, `completeStoryQuest`, `startBossBattle`, `dealBossDamage`, `updateBossUI`, `defeatBoss`, `giveStoryReward`, `completeStoryChapter`, `showStoryPopup`, `closeStoryPopup`, `openStoryChapterList`, `renderStoryChapterList`, `updateStoryUI`
- 신규 저장 필드: `storyProgress` (currentChapter, currentEpisode, completed, chaptersCompleted, phase, bossHp, bossMaxHp)
- 신규 HTML: `#boss-overlay` (HP바), `#story-popup` (인트로/아웃트로), `#story-chapter-modal` (챕터 목록), `#story-chapter-btn` (📖 버튼), `#story-progress-info`
- 신규 CSS: `.story-quest-card`, `.boss-overlay`, `.boss-hp-track`, `.boss-hp-fill`, `.boss-dmg-text`, `@keyframes bossDmg`, `.story-popup-content`, `.story-episode-item`
- 신규 이미지 (8개 필요): `images/story/boss_shadow.png`, `boss_scout.png`, `boss_trapper.png`, `boss_archer.png`, `boss_pirate.png`, `boss_guard.png`, `boss_king.png`, `boss_remnants.png`
- firestore.rules: `storyProgress` map 검증 추가
- eslint.config.js: 19개 전역 추가 (상수 3 + 변수 1 + 함수 16 - 1 writable)
- script 로드 순서 변경: sound → **story** → ui → tutorial → main
- 캐시 버스팅: `?v=4.25.0` → `?v=4.28.0` (전체 JS/CSS)
- 수정 함수: `completeQuest()` (game.js - isStory 분기), `moveItem()` (game.js - 보스 데미지 호출), `updateQuestUI()` (ui.js - 스토리 카드 렌더링+정렬), `updateAll()` (ui.js - updateStoryUI 호출), `onAuthStateChanged` (main.js - 보스전 복원)

### v4.27.0 (2026-02-13) - 에너지 리팩토링 + 이모지 교체 완료 + Firestore 수정
- ⚙️ **에너지 회복 절대 시간 방식 전환**
  - `recoveryCountdown` (카운트다운 초) → `energyRecoverAt` (절대 ms timestamp) 변경
  - 오프라인/탭 전환 시 별도 보정 불필요 (모든 타이머가 절대 시간 기반)
  - `recoverOfflineEnergy()` 함수 삭제
  - `startEnergyRecovery()`: while 루프로 밀린 에너지 일괄 회복
  - 기존 `recoveryCountdown` 데이터 자동 마이그레이션 (save.js)
- 🎨 **레벨 진행도 표시 분리**
  - `#level-val` (Lv.N, bold purple-600) + `#level-progress` (n/n, 9px purple-400) 2개 span
- 🎨 **이모지 → 커스텀 아이콘 교체 카테고리 B/C + 잔여**
  - 신규 ICON 6종: timer, check, sleep, offline, star, merge
  - 카테고리 B/C 5개 이미지 rembg+128×128 정규화 (이전 세션 누락분)
  - 일일 미션: 🔨→ICON.merge, ✨→ICON.sparkle, 👑→ICON.coin, ★→ICON.star, ✓→ICON.check
  - 주사위 여행: ✓→ICON.check
  - 저장 상태: ⏳→ICON.timer, ✓→ICON.check
  - `#daily-mission-bar .icon { width:12px; height:12px }` 아이콘 크기 제한
- 🐛 **회원탈퇴 Firestore 삭제 권한 수정**
  - 원인: `allow write` + 데이터 검증 → `delete()`는 `request.resource.data` 없음 → 검증 실패
  - 수정: `allow write` → `allow create, update` (검증) + `allow delete` (본인만) 분리
  - 적용: saves, sessions, raceCodes 3개 컬렉션
- 🐛 **주사위 여행 리셋 후 스크롤 수정**
  - `renderDiceTripBoard()` 호출을 `requestAnimationFrame`으로 감싸서 레이아웃 계산 보장
- 수정 파일: js/constants.js, js/state.js, js/save.js, js/main.js, js/game.js, js/ui.js, js/systems.js, js/album.js, js/race.js, css/styles.css, firestore.rules, eslint.config.js, index.html
- 신규 이미지 (6개): icons/timer, check, sleep, offline, merge + effects/star
- 신규 ICON 항목 (6종): timer, check, sleep, offline, star, merge (총 37종)
- 삭제 함수: `recoverOfflineEnergy()` (save.js)
- 저장 필드 변경: `recoveryCountdown` → `energyRecoverAt`
- 신규 HTML: `#level-progress` span
- 수정 함수: `startEnergyRecovery()` (main.js), `updateTimerUI()` (ui.js), `updateUI()` (ui.js), `updateLevelupProgressUI()` (ui.js), `updateDailyMissionUI()` (ui.js), `renderDiceTripBoard()` (systems.js), `updateSaveStatus()` (save.js)

### v4.26.0 (2026-02-13) - 레벨업 진행도 바 제거 + UI 정리
- 🗑️ **레벨업 진행도 바 제거**
  - `#levelup-progress-bar` HTML 전체 삭제 (event-bar 파랑)
  - 상단바 Lv 표시에 진행도 통합: `Lv.1` → `Lv.1 0/2`
  - `updateUI()`: levelEl에 `Lv.${userLevel} ${questProgress}/${goal}` 표시
  - `updateLevelupProgressUI()`: 동일 형식 (호출부 호환 유지)
  - 레벨업 로직/보상은 변경 없음
- 🎨 **설정 팝업 개인정보/회원탈퇴 2단 균등 정렬**
  - `flex-1 text-center`로 좌우 균등 분할, `|` 구분자 중앙
- 수정 파일: index.html, js/ui.js
- 삭제 HTML: `#levelup-progress-bar`, `#levelup-progress-text`, `#levelup-progress-fill`, `#levelup-reward-preview`

### v4.25.6 (2026-02-13) - 기본 클릭 사운드 추가
- 🔊 **기본 클릭 사운드 추가** (UI 인터랙션 8곳)
  - `sound.js`: `'click'` 합성음 추가 (800→600Hz sine, 60ms, 부드러운 탭)
  - 적용 대상: 전용 사운드가 없는 UI 탭/버튼 인터랙션
  - `ui.js`: `openSettings`, `openGuide`, `switchGuideTab`, `toggleBottomTab`
  - `album.js`: `openAlbum`, `switchAlbumTheme`
  - `race.js`: `copyRaceCode`, `openRaceJoinPopup`
- 수정 파일: js/sound.js, js/ui.js, js/album.js, js/race.js
- 효과음 총 수: 16종 → **17종** (click 추가)

### v4.25.5 (2026-02-13) - 보드 클릭 + 레이스 초대 버그 수정
- 🐛 **보드 클릭/드래그 완전 불가 버그 수정**
  - 원인: `handleDragStart`에서 미정의 변수 `p` 참조 → ReferenceError → `dragData` 미설정 → `handleDragEnd` 무동작
  - 수정: `const p = t.closest('.cell')` 추가 (부모 셀 참조)
- 🐛 **레이스 초대 실패 버그 수정**
  - 원인: `joinRaceByCode`에서 `findActiveOrPendingRace(codeData.ownerUid)` 호출 시 Firestore 읽기 권한 부족 (상대방 레이스 조회 불가)
  - Firestore 규칙: `isPlayer()` → 본인 참가 레이스만 읽기 가능, 상대방 레이스 조회는 권한 오류
  - 수정: 상대방 레이스 조회를 try-catch로 감싸서 권한 오류 시 스킵 (초대 정상 진행)
- 수정 파일: js/ui.js, js/race.js
- 수정 함수: `handleDragStart()` (ui.js), `joinRaceByCode()` (race.js)

### v4.25.4 (2026-02-13) - 퀘스트 아이템 도감 연동
- 🆕 **퀘스트 아이템 클릭 → 도감 열기 + 하이라이트**
  - `openGuideForItem(type, level)` 함수 추가 (ui.js)
  - 아이템 타입별 도감 탭 자동 선택: 동물→animal, 간식→snack, 장난감→cat_toy/dog_toy
  - 해당 레벨 아이템에 금색 테두리 하이라이트 (`guide-highlight`) + scrollIntoView
  - 도감 닫을 때 하이라이트 자동 제거 (`closeModal`)
- 수정 파일: js/ui.js, css/styles.css, eslint.config.js
- 신규 함수: `openGuideForItem()` (ui.js)
- 신규 CSS: `.guide-item.guide-highlight` (금색 테두리 + 연한 노랑 배경)
- 수정 함수: `updateQuestUI()` (req-item onclick 추가), `closeModal()` (하이라이트 제거)

### v4.25.3 (2026-02-13) - 스크롤/클릭 버그 수정
- 🐛 **퀘스트 완료 시 스크롤 맨 앞 이동 — Chrome scroll anchoring 근본 수정**
  - 근본 원인: Chrome의 scroll anchoring이 `innerHTML` 재빌드 후 이전 스크롤 위치를 자동 복원
  - `#quest-container`에 `overflow-anchor: none` CSS 추가
  - `-webkit-overflow-scrolling: touch` 제거 (iOS 프로그래밍 스크롤 간섭)
  - `generateNewQuest()`에서 중복 `updateQuestUI()` 호출 제거
- 🐛 **주사위 여행 탭 열 때 현재 위치 자동 스크롤**
  - 원인: `display:none` 상태에서 `renderDiceTripBoard()` → `offsetLeft=0` → 스크롤 계산 무효
  - `toggleBottomTab('dice')` 시 `renderDiceTripBoard()` 재호출 (visible 전환 후)
  - `.dice-trip-board`에서 `-webkit-overflow-scrolling: touch` 제거
  - 주사위 보드 스크롤 시 `void offsetWidth` reflow 강제
- 🐛 **잠긴 창고/보드 셀 클릭 불가 버그 수정**
  - 원인: `handleDragStart`에서 `.item` 없으면 리턴 → 잠긴 셀(`.item` 래퍼 없음)은 `handleCellClick` 미도달
  - `.locked`/`.storage-locked` 셀 감지 시 바로 `handleCellClick()` 호출
- 🎨 **최근 상대 목록 이름 말줄임 적용**
  - `openRaceJoinPopup` 최근 상대 `o.name`에 `name-ellipsis` 80px 추가
  - 이름 표시 전체 5곳 보호 완료
- 수정 파일: css/styles.css, js/ui.js, js/game.js, js/systems.js, js/race.js
- 수정 함수: `updateQuestUI()` (ui.js - savedScroll 복원), `handleDragStart()` (ui.js - 잠긴 셀 처리), `toggleBottomTab()` (ui.js - 주사위 재렌더), `renderDiceTripBoard()` (systems.js - reflow 강제), `generateNewQuest()` (game.js - 중복 UI 호출 제거), `openRaceJoinPopup()` (race.js - 이름 ellipsis)
- 신규 CSS: `overflow-anchor: none` (#quest-container)

### v4.25.2 (2026-02-13) - 버그 수정 + UI 개선
- 🐛 **퀘스트 완료 시 스크롤 앞으로 이동 안 되는 버그 수정**
  - `updateAll()` + `updateQuestUI(true)` 이중 호출 → `updateAll({ scrollQuestToFront: true })` 단일 호출로 통합
  - `requestAnimationFrame` → `setTimeout(50ms)` + `scrollLeft=0` 즉시 점프로 변경
- 🐛 **레이스 중 유저에게 초대 보내지는 버그 수정**
  - `findActiveOrPendingRace()` 에러 시 `null` 반환 → try-catch 제거하여 에러 전파
  - player2 리스너에서 `pendingInviteId` 체크 추가 (초대 확인 중 2번째 초대 차단)
- 🐛 **일반 스폰 파티클 이모지(✨) → 텍스트 문자(✦) 교체**
- 🎨 **설정 팝업 레이아웃 개선**
  - 유저 이름 표시 추가
  - 회원탈퇴/개인정보처리방침을 한 줄 10px 회색 텍스트로 축소
  - `|` 구분자 수직 가운데 정렬 (`items-center` + `leading-none`)
- 🎨 **유저 이름 최대 6자 제한**
  - `getDisplayName(user)` 헬퍼 추가 (constants.js): 첫 단어 기준 `MAX_NAME_LENGTH=6`
  - 적용: 설정 팝업, 레이스 코드/초대, 환영 토스트
- 🎨 **이름 말줄임표 공통 CSS `.name-ellipsis`**
  - 레이스 트랙(40px), 초대 팝업(80px), 초대 전송(80px), 설정(150px) 4곳 적용
- 수정 파일: css/styles.css, index.html, js/constants.js, js/game.js, js/ui.js, js/race.js, js/main.js, eslint.config.js
- 신규 상수: `MAX_NAME_LENGTH` (constants.js)
- 신규 함수: `getDisplayName()` (constants.js)
- 신규 CSS: `.name-ellipsis`
- 수정 함수: `updateAll(opts)` (ui.js - scrollQuestToFront 옵션), `openSettings()` (ui.js - 이름 표시), `findActiveOrPendingRace()` (race.js - 에러 전파)

### v4.25.1 (2026-02-13) - 코드 리팩토링
- 🧹 **Phase 1: Dead Code 제거**
  - 변수 6개 삭제 (state.js): `questPage`, `prevReadyCount`, `bgmAudio`, `soundBuffers`, `shopTimerBadge`, `tutorialPointer`
  - 함수 5개 삭제: `scrollQuests()` (game.js), `moveTripPosition()` (systems.js), `giveStepReward()` (systems.js), `getCompletedThemes()` (album.js), `preloadAllSounds()` (sound.js)
  - main.js: `shopTimerBadge`/`tutorialPointer` DOM 할당 제거
- 🐛 **Phase 2: Bug Fixes**
  - `showToast()` 타이머 간섭 수정: `_toastTimer` + `clearTimeout` (ui.js)
  - `showMilestonePopup()` 타이머 간섭 수정: `_milestoneTimer` + `clearTimeout` (ui.js)
  - `claimRaceReward()` race condition 수정: `raceId` 파라미터로 캡처 (race.js)
- 🔧 **Phase 3: 유틸리티 헬퍼 추출**
  - `addCoins(amount)` (game.js): `coins += amount; cumulativeCoins += amount; addDailyProgress('coins', amount)` → 10곳 적용 (race.js/album.js 누락 `addDailyProgress` 자동 수정)
  - `showError(msg)` (ui.js): `playSound('error'); showToast(msg)` → 17곳 적용
  - `formatMinSec(ms)` (constants.js): `m:ss` 포맷 → 8곳 적용
- 🔧 **Phase 4: 매직 넘버 상수화**
  - 12개 상수 추가 (constants.js): `SPECIAL_QUEST_REWARD`, `QUEST_EXPIRE_MS`, `QUEST_SNACK_CHANCE`, `QUEST_PIGGY_CHANCE`, `QUEST_MULTI_BASE_CHANCE`, `QUEST_MULTI_LEVEL_FACTOR`, `QUEST_MULTI_MAX_CHANCE`, `LUCKY_BASE_CHANCE`, `LUCKY_LEVEL_BONUS`, `LUCKY_SNACK_CHANCE`, `QUEST_COUNT_MISSION_GOAL`, `CLOUD_SAVE_DEBOUNCE_MS`
  - 적용: game.js (7곳), save.js (2곳)
- 🔧 **Phase 5: UI 패턴 정리**
  - `openOverlay(id)` 함수 추가 (ui.js): 12곳의 `style.display='flex'` 대체
  - `getItemList()` 활용 확대: if/else 체인 4곳 교체 (ui.js 3곳, systems.js 1곳)
  - `getThemeCollectedCount(themeIdx)` 헬퍼 추가 (album.js): 5곳 중복 필터 통합
- 🔧 **Phase 6: spawnPiggyBank 헬퍼 추출**
  - `spawnPiggyBank(toastPrefix)` (game.js): 저금통 스폰 로직 2곳 통합
- 수정 파일: constants.js, state.js, game.js, systems.js, album.js, race.js, sound.js, ui.js, main.js, index.html, eslint.config.js (11개)
- 순 코드 감소: ~85줄 (5685→5600줄)
- 신규 함수 (6개): `addCoins` (game.js), `spawnPiggyBank` (game.js), `showError` (ui.js), `openOverlay` (ui.js), `getThemeCollectedCount` (album.js), `formatMinSec` (constants.js)
- 삭제 함수 (5개): `scrollQuests` (game.js), `moveTripPosition` (systems.js), `giveStepReward` (systems.js), `getCompletedThemes` (album.js), `preloadAllSounds` (sound.js)
- 삭제 변수 (6개): `questPage`, `prevReadyCount`, `bgmAudio`, `soundBuffers`, `shopTimerBadge`, `tutorialPointer`

### v4.25.0 (2026-02-12)
- 🎨 **커스텀 아이콘 시스템 (ICON 헬퍼)** 추가
  - `constants.js`에 `ICON` 객체 정의 (31종): `<img>` 태그를 인라인 삽입하는 헬퍼
  - CSS `.icon` 기본 클래스 + 크기 변형: `.icon-xs`(14px), `.icon-sm`(18px), `.icon-md`(24px), `.icon-lg`(48px), `.icon-xl`(80px)
  - 이미지 정규화 파이프라인: rembg 배경 제거 → 자동 크롭 → 128×128 캔버스 중앙 배치 (85% fill)
- 🎨 **이모지 → 커스텀 PNG 아이콘 일괄 교체**
  - **icons/** (27종): coin, diamond, energy, card, piggybank, settings, lock, tv, save, gift, sound, target, paw, pointer, music, key, clipboard, finish, camera, dice, cart, box, moneybag, ticket, mail, refresh, trash
  - **effects/** (3종): party, confetti, sparkle
  - **race/** (5종): mycar, rival, trophy, lose, draw
  - **spawners/** (7종): cat, dog, toy, bird, fish, reptile, piggybank
  - **동물 이미지**: cats(11), dogs(11), birds(7), fish(7), reptiles(7), cat_snacks(5), dog_snacks(5), cat_toys(5), dog_toys(5) = **78종**
  - **교체 범위**: index.html 30+곳, ui.js, systems.js, race.js, album.js, game.js, main.js
- 🎨 **로그인 화면 이미지 교체**
  - 🐱🐶 이모지 → `cat2.png` + `cat5.png` 커스텀 이미지
- 🎨 **도감 탭 이미지 교체**
  - 🐱🐶 이모지 → 기존 `cat1.png` + `dog1.png` 동물 이미지 재활용
- 🎨 **파티클 이펙트 텍스트화**
  - 합성 파티클: `['✨', '⭐', '💫', '🌟', '✦']` → `['✦', '·', '•', '✦', '·']`
  - Lucky 텍스트: `✨ Lucky! ✨` → `${ICON.sparkle} Lucky! ${ICON.sparkle}`
- 🎨 **일일미션 디자인 개선**
  - 미션 라벨: `font-bold` + `text-amber-700` 추가
  - 프로그레스 바 배경: `bg-amber-200` → `bg-amber-100`
  - 보상 텍스트: `text-gray-400` → `text-amber-400`
  - 완료 표시: `text-green-600 font-bold`
  - 단계/리셋 텍스트: 앨범 스타일과 통일 (`text-[9px] text-amber-400 font-bold`)
- 🔧 **캐시 버스팅** 추가
  - 모든 JS/CSS `<script>`/`<link>` 태그에 `?v=4.25.0` 쿼리 파라미터 추가 (13개 파일)
- 🐛 **판매 팝업 innerHTML 버그 수정**
  - `systems.js` `askSellItem()`: `innerText` → `innerHTML` (ICON 이미지 태그 렌더링)
- 수정 파일: constants.js, index.html, ui.js, systems.js, race.js, album.js, game.js, main.js
- 신규 ICON 항목 (37종): coin, diamond, energy, card, piggy, settings, lock, tv, save, gift, sound, mycar, rival, trophy, lose, draw, target, paw, pointer, music, key, party, confetti, sparkle, clipboard, finish, camera, dice, cart, box, moneybag, ticket, mail, trash, timer, check, sleep, offline, star, merge
- 신규 이미지 폴더: `images/` (icons 27 + effects 3 + race 5 + spawners 7 + 동물 78 = **120종**)
- 수정 함수: `spawnParticles()` (텍스트 문자), `showLuckyEffect()` (ICON.sparkle), `askSellItem()` (innerHTML), `updateDailyMissionUI()` (디자인 개선), `renderDiceTripBoard()` (ICON.dice/finish)

### v4.24.0 (2026-02-12)
- ⚙️ **설정 팝업** 추가
  - 상단바 3개 버튼(🔊효과음, 🎵BGM, 🔑로그아웃) → ⚙️ 설정 버튼 1개로 통합
  - 설정 팝업: 효과음 ON/OFF 토글, 배경음악 ON/OFF 토글, 로그아웃, 회원탈퇴, 개인정보처리방침
  - 토글 버튼: 활성 시 파란색(`.active`), 비활성 시 회색
- 🗑️ **회원탈퇴 기능** 추가
  - 이중 확인(confirm 2회) → Firestore saves/sessions/raceCodes 삭제 → Firebase Auth 계정 삭제
  - `auth/requires-recent-login` 에러 시 재로그인 유도 후 자동 재시도
  - 성공 시 localStorage 클리어 + 로그인 화면 전환
- 📋 **개인정보처리방침 팝업** 추가
  - 수집항목, 이용목적, 보관기간, 제3자 제공, 이용자 권리 5항목
- 수정 파일: index.html, css/styles.css, js/ui.js, js/auth.js, js/sound.js, eslint.config.js
- 신규 함수 (3개): `openSettings()` (ui.js), `closeSettings()` (ui.js), `deleteAccount()` (auth.js)
- 수정 함수: `updateSoundUI()` (sound.js - 설정 팝업 내 토글 버튼 업데이트로 변경)
- 신규 HTML: `#settings-popup`, `#privacy-popup`, `#setting-sound-btn`, `#setting-music-btn`
- 삭제 HTML: `#sound-toggle-btn`, `#music-toggle-btn`, `#login-btn`
- 신규 CSS: `.settings-row`, `.settings-toggle`, `.settings-btn`, `.settings-btn-danger`, `.settings-btn-link`
- 🔊 **효과음 카테고리화 + 누락 효과음 24건 전수 추가**
  - sound.js: 미사용 `click` case 삭제 (dead code 제거, 17종→16종)
  - game.js: `error` 6건, `milestone` 5건, `quest_complete` 1건 추가
  - systems.js: `error` 4건, `purchase` 2건, `milestone` 2건 추가
  - album.js: `error` 1건 추가
  - ui.js: `error` 3건, `milestone` 1건 추가
  - 카테고리: Action / Purchase / Reward / Album / Race / Error 6분류로 정리

### v4.23.0 (2026-02-12)
- 🔊 **사운드 시스템** 추가
  - Web Audio API 기반 합성음 (외부 파일 없음)
  - 효과음 16종: spawn, merge, purchase, error, dice_drop, dice_roll, piggy_open, daily_bonus, milestone, levelup, quest_complete, lucky, album_draw, theme_complete, race_start, race_win, race_lose
  - BGM: C 펜타토닉 뮤직박스 루프 (멜로디 + 베이스, 220ms interval)
  - iOS AudioContext 첫 터치 unlock 대응
  - 효과음/BGM 개별 토글 + saveGame()으로 설정 저장/복원
- 신규 파일: `js/sound.js` (~422줄)
- 신규 변수 (state.js): `audioContext`, `bgmAudio`, `soundEnabled`, `musicEnabled`, `audioUnlocked`, `soundBuffers`
- 신규 함수 (10개): `initSound`, `unlockAudio`, `createSynthSound`, `preloadAllSounds`, `playSound`, `playBGM`, `stopBGM`, `toggleSound`, `toggleMusic`, `updateSoundUI`
- 저장 데이터: `soundEnabled`, `musicEnabled` 필드 추가 (기존 데이터 호환, 기본값 true)
- script 로드 순서 변경: race → **sound** → ui → tutorial → main

### v4.22.0 (2026-02-12)
- 🛒 **상점 1번 칸: Lv.6 동물 광고 구매**
  - 1번 칸 = cat/dog Lv.6 고정 (`isAd:true`), 5분마다 랜덤 교체
  - 가격표 `📺` 표시, 클릭 → 광고 팝업 → 시청 → 보드/창고 배치 + 품절
  - 공간 부족 시 "공간 부족!" 토스트
- ⚡ **에너지 광고 충전**
  - 에너지 팝업에 `📺 광고 시청 → +30⚡` 버튼 추가 (취소+구매 합친 폭, 강조 테두리)
  - 광고 시청 → 에너지 30 충전 (상한 999)
- ⚖️ **레벨업 다이아 보상 하향**: ceil(lv/5)×5 → ceil(lv/10)×3
- ⚖️ **레이스 목표 복원**: 7 → 10
- ⚖️ **에너지 구매 시작 가격 인상**: 300 → 500🪙
- 🔧 **광고 팝업 모드 확장**: piggy/storage → piggy/storage/shop/energy 4모드
- 🐛 **상점 타이머 버그 2건 수정**
  - 재접속 시 상점 미갱신: 저장된 남은시간 ≤ 0이면 즉시 `refreshShop()` (save.js)
  - 상점 탭 내부 타이머 멈춤: `startShopTimer()`에서 `#badge-shop-info`도 동시 갱신 (systems.js)
- 수정 파일: game.js, systems.js, save.js, index.html, race.js, eslint.config.js
- 신규 함수 (1개): `adEnergy()` (game.js)
- 수정 함수: `refreshShop()` (1번 칸 광고 고정), `renderShop()` (📺 가격표), `buyShopItem()` (isAd 분기), `openAdPopup()` (energy/shop 모드), `confirmAd()` (energy/shop 분기), `getEnergyPrice()` (500+n×50), `startShopTimer()` (배지 타이머 동시 갱신), `applyGameData()` (상점 만료 시 즉시 갱신)

### v4.21.0 (2026-02-12)
- 📦 **창고 해제: 다이아 구매 → 광고 시청으로 변경**
  - 잠긴 창고 칸 클릭 → 광고(페이크) 팝업 → 시청하기 → 칸 해제
  - 순서 제한 제거 (앞 칸부터 → 아무 칸이나 해제 가능)
  - 다이아 소비 제거 (기존 5/10/15/20/25💎 → 무료 광고)
  - 잠긴 칸 UI: `${cost}💎` → `📺` 표시
  - 광고 팝업 범용화: piggy/storage 모드 분기 (`ad-piggy-mode` hidden input)
  - 팝업 설명 동적 변경: 창고="창고 칸을 열 수 있습니다!", 저금통="보상 2배!"
  - 기존 유저 데이터 완전 호환 (save.js 변경 없음, locked_storage 구조 유지)
- 🐛 **7행 미션 재잠금 버그 재수정**
  - 사자/북극곰 미션 완료 후 빈 칸에 아이템 배치 → 재접속 시 미션 재생성되는 버그
  - 원인: `discoveredItems` 체크가 `animal_mission` 타입일 때만 동작 → 아이템이 놓인 경우 건너뜀
  - 수정: `discoveredItems`에 기록 있으면 어떤 상태든 미션 생성 스킵 (최우선 체크)
- 🐛 **퀘스트 완료 시 슬라이드 맨 앞 이동 안 되는 버그 수정**
  - `updateQuestUI()` DOM 재생성 후 `requestAnimationFrame`으로 `scrollLeft = 0` 명시적 설정
- 🔧 **보상 힌트 하드코딩 제거**
  - index.html의 레이스/앨범/주사위 보상 텍스트를 상수 기반 동적 렌더링으로 변경
  - `init()`에서 `RACE_REWARDS`, `ALBUM_ALL_COMPLETE_DIAMONDS`, `DICE_TRIP_COMPLETE_REWARD`로 설정
  - race.js 하드코딩도 템플릿 리터럴로 변경
  - 앨범 완성 보상 표시 `+100💎` → `+500💎` 수정 (v4.20.0 상수 변경 누락분)
- 수정 파일: game.js, ui.js, index.html, save.js, race.js, main.js
- 수정 함수: `handleCellClick()` (순서 제한 제거 + 광고 팝업 호출), `openAdPopup()` (piggy/storage 모드 분기), `confirmAd()` (storage 분기 추가), `renderGrid()` (📺 표시), `migrateRow7Missions()` (discoveredItems 최우선 체크), `updateQuestUI()` (scrollLeft 초기화), `updateRaceUI()` (보상 템플릿 리터럴), `init()` (보상 힌트 동적 설정)
- 신규 HTML: `#ad-piggy-mode` (hidden input), `#ad-popup-desc`, `#race-hint`, `#album-reward-hint`, `#dice-reward-hint`

### v4.20.0 (2026-02-11)
- 🐷 **저금통 시스템** 추가
  - 스페셜 퀘스트 완료 시 저금통 아이템 보드에 스폰 (기존 300🪙 직접 지급 제거)
  - 코인 100~300 랜덤 (생성 시 결정)
  - 1시간 타이머 후 터치로 개봉 → 코인 지급
  - 미개봉 시 📺 버튼 → 광고(페이크) 시청 → 즉시 개봉 + 보상 2배
  - 합성 불가 (위치 교환만 허용), 판매 불가
  - 보드 가득 시 코인 직접 지급 (fallback)
  - 창고 이동 허용 (타이머 유지, openAt 절대 시간)
  - 미개봉 저금통 UI: cooldown-overlay (회색 그라데이션 + mm:ss 타이머), 개봉 시 금색 🐷
  - 퀘스트 보상 UI: `🪙🐷` 표시
- 🐛 **퀘스트 보상 하향 + easy quest 버그 수정**
  - 퀘스트 보상에서 레벨 보너스 `floor(userLevel/3)*5` 제거 (v4.19.0에서 추가된 것)
  - `countEasyQuests()` 임계값 `<=3` → `<=4` (v4.19.1 minLv +1과 동기화)
- 신규 상수: `PIGGY_BANK_TIMER_MS`, `PIGGY_BANK_MIN_COINS`, `PIGGY_BANK_MAX_COINS`
- 신규 함수 (2개): `openAdPopup()`, `confirmAd()` (game.js)
- 수정 함수: `completeQuest()` (코인 직접 지급 제거 + 저금통 스폰), `handleCellClick()` (piggy_bank 분기), `moveItem()` (합성 차단), `createItem()` (cooldown-overlay 저금통 렌더링), `updateQuestUI()` (보상 표시 🪙🐷), `askSellItem()` (판매 차단), `generateNewQuest()` (레벨 보너스 제거), `countEasyQuests()` (임계값 수정)
- 신규 HTML: `#ad-popup` (광고 확인 팝업)
- 신규 CSS: `.piggy-bank-item`, `.ad-btn`
- 데이터 구조: boardState 아이템에 `{type:'piggy_bank', coins, openAt}` 추가 (기존 데이터 호환)
- 🐛 **7행 미션 재잠금 버그 수정**
  - 사자(cat Lv.11)/북극곰(dog Lv.11) 미션 완료 후 동물을 퀘스트 제출 → 재접속 시 칸이 다시 잠기는 버그
  - 원인: `migrateRow7Missions()`에서 `null`(완료)을 "미션 미생성"으로 오판 → 미션 재생성
  - 수정: `null`인 칸은 건드리지 않음, 다른 아이템 점유 시에만 마이그레이션
- 🐛 **과열/저금통 타이머 실시간 미갱신 수정**
  - `startCooldownTimer()`에서 과열 중 생성기/미개봉 저금통 있을 때 매초 renderGrid 호출
- 🐛 **7행 미션 - discoveredItems 기반 완료 복원**
  - 이미 버그로 재생성된 animal_mission을 `discoveredItems`(cat_11/dog_11) 기록으로 판별하여 자동 해제
- ⚖️ **밸런스 변경**
  - 앨범 완성 보상: 100💎 → 500💎
  - 쉬운 퀘스트 20% 확률 저금통 보상 추가 (`piggyReward` 플래그, 카드/코인과 배타적)
- 🐛 **저금통 스폰 안전장치**
  - 스폰 범위를 `i < 30`으로 제한 (7행 미션 칸 30~34 보호)
  - fallback(보드 가득) 시 `addDailyProgress` 누락 수정

### v4.19.1 (2026-02-11)
- 💰 **경제 긴축 패치** - 재화 과잉 해소
  - 레이스 보상 감소: 승리 200🪙+10💎→150🪙+5💎, 패배 100🪙+3💎→30🪙, 무승부 150🪙+5💎→80🪙+3💎, 타임아웃 100🪙+3💎→30🪙
  - 주사위 여행 완주 보상 감소: 1000🪙+50💎 → 500🪙+20💎
  - 주사위 여행 칸별 보상 ~30% 감소 (전 구간)
  - 앨범 중복 반환 감소: N:3→1, R:8→3, SR:20→8
  - 퀘스트 요구 레벨 +1: minLv max(2,floor(lv/2))→max(3,floor(lv/2)+1), 상한 6→7, maxLvAnimal 상한 10→11
  - 일일 미션 3단계 시스템: 1단계(15/30/150, 30🪙) → 2단계(40/80/400, 60🪙) → 3단계(80/150/800, 100🪙), 올클리어 보너스 10💎+5🃏→5💎+3🃏
- 수정 파일: constants.js, game.js, race.js, state.js, save.js, ui.js, index.html
- 수정 함수: `checkDailyMissionComplete()` (tier 기반 로직), `claimDailyBonus()` (tier=3 체크), `checkDailyReset()` (tier 리셋), `updateDailyMissionUI()` (tier별 렌더링+단계 표시), `generateNewQuest()` (minLv/maxLv +1)
- 수정 상수: `RACE_REWARDS`, `DICE_TRIP_COMPLETE_REWARD`, `DICE_TRIP_REWARDS` 전체, `ALBUM_DUPE_REWARD`, `DAILY_MISSIONS` (1D→2D 3단계), `DAILY_COMPLETE_REWARD`
- 신규 저장 필드: `dailyMissions.tier` (0~3, 하위 호환 ?? 0)
- 데이터 구조 변경: `dailyMissions` 객체에 `tier` 필드 추가 (기존 데이터 호환)
- 🐛 **버그 수정 (2건)**
  - 일일 미션 tier 마이그레이션: 구버전(tier 없음) 데이터에서 claimed=[true,true,true]일 때 승급 안 되던 버그 → `applyGameData`에서 자동 승급 처리
  - 앨범 완성 팝업 겹침: 마지막 테마 완성 + 앨범 완성 동시 발생 시 테마 보상 팝업이 앨범 팝업에 덮어씌워지던 버그 → `checkAlbumAllComplete` 팝업 2.5초 딜레이
- 추가 수정 파일: album.js, save.js

### v4.19.0 (2026-02-11)
- ⚖️ **게임 밸런싱 전면 조정**
  - 일일 미션 목표 하향: 합성 100→50, 생성 200→100
  - 퀘스트 보상 레벨 보너스: `+ floor(userLevel/3)*5` 추가
  - 카드 퀘스트 초반 보호: Lv.3 미만 카드 퀘스트 제외
  - 앨범 뽑기 개선: 비용 20→15🃏, 장수 2→3장, 주기 21→42일
  - 에너지 구매 가격 인하: 500+n×100 → 300+n×50
  - 레이스 목표/보상 조정: 목표 10→7, 패배 50🪙→100🪙+3💎, 무승부 100🪙→150🪙, 시간초과 50🪙→100🪙+3💎
  - 상점 아이템 가격 상향: lv💎 → lv×2💎 (다이아 싱크 확대)
  - 다이아팩 수량 감소: 10→5💎
  - 카드팩 변경: 20장/10💎 → 15장/15💎
  - 주사위 초반 보상 미세 상향: 1~5번 칸 min +3~5
- 수정 파일: constants.js, game.js, race.js, systems.js, index.html
- 수정 함수: `generateNewQuest()` (레벨 보너스+카드 보호), `getEnergyPrice()` (300+n×50), `renderShop()` (lv×2 가격), `buyShopItem()` (lv×2 가격), `refreshShop()` (카드팩 15장/15💎, 다이아팩 5개)
- 데이터 구조 변경 없음 (상수만 변경, 기존 저장 데이터 호환)

### v4.18.0 (2026-02-11)
- 🏷️ **하단 배지 내비게이션 바** 추가
  - 5개 섹션(레이스/앨범/주사위/상점/창고)을 1행 5열 배지 바로 변환
  - 배지 탭 → 해당 콘텐츠가 일일미션 자리에 표시
  - 같은 배지 재탭 → 닫힘 (일일미션 복원)
  - 기본 상태: 모든 콘텐츠 숨김, 배지 바만 표시
- **배지 요약정보** (실시간 갱신)
  - 🏁 레이스: 상태별 (참가하기/⏱초대타이머/n/10)
  - 📸 앨범: n/81 진행도
  - 🎲 주사위 여행: n/50 위치
  - 🛒 상점: m:ss 갱신 타이머 (매초 실시간)
  - 📦 창고: 보관중/열린칸
- **섹션 높이 모듈화** - CSS `calc((min(95vw,399px)-40px)/5+30px)`로 모든 섹션 동일 높이
- **앨범바 리디자인**
  - 테마 미니칩 9개 (1행 9열, 아이콘+진행도, 완성 시 금색)
  - "앨범 보기" 버튼 제거 → 테마 칩 클릭으로 대체
  - 뽑기 버튼 가격 표기 통일 (🃏20)
  - 뽑기 결과창: 확인 버튼 제거 + 1초 자동 닫기
- **상점 UI 개선**
  - 카드팩/다이아팩 수량을 `.level-badge` 스타일로 통일 (×20/×10)
  - 가격표 딱지 위치: 우하단 → 우상단, 폰트 축소 (7px)
- **창고/상점 셀 개선**
  - 보드와 동일한 정사각형 비율 (1fr, aspect-ratio: 1)
  - 테두리+배경 추가로 칸 구분 명확화
- **퀘스트 UI 수정**
  - 스페셜 퀘스트 완료 가능 시 맨 앞 정렬 (기존: 항상 맨 뒤)
  - NPC 배경 padding 축소 (3px 6px → 2px 4px)
- **밸런스 변경**
  - 에너지 구매 가격 리셋: 3시간 → KST 자정 (일일 리셋)
- 신규 변수: `currentBottomTab` (state.js)
- 신규 함수 (2개): `toggleBottomTab()`, `updateBottomBadges()` (ui.js)
- 수정 함수: `updateAll()` (배지 업데이트 호출), `startCooldownTimer()` (실시간 배지 갱신), `updateAlbumBarUI()` (테마 미니칩), `renderShop()` (카드/다이아팩 level-badge), `getEnergyPrice()` (KST 자정 리셋), `updateQuestUI()` (스페셜 완료 시 앞 정렬), `drawPhotos()` (1초 자동 닫기)
- 신규 HTML: `#bottom-content` 래퍼, `#bottom-nav` 배지 바, `#album-theme-grid`
- 삭제 HTML: 카드 뽑기 확인 버튼
- 신규 CSS: `#bottom-nav`, `.bottom-nav-badge`, `.album-theme-chip`, 섹션 높이 calc 통일
- eslint.config.js: `toggleBottomTab`, `updateBottomBadges`, `currentBottomTab`, `lastRaceData`, `RACE_EXPIRE_MS` 전역 추가
- **에너지 구매 가격 리셋 KST 자정 완전 적용**
  - state.js 초기값: `Date.now() + 10800000` → `Date.now() + getMsUntilKSTMidnight()`
  - save.js 로드 시 마이그레이션: 기존 3시간 타이머 값을 자정 기준으로 보정
- ✏️ **UX 라이팅 통일** - 보상 표기 패턴 전체 정리
  - 숫자+이모지 순서: `🃏 +20` → `+20🃏`, `💎10` → `10💎`
  - 다중 보상 구분자: `200🪙 10💎` → `200🪙 + 10💎`
  - 레벨업 보상: `💎 +5` → `+5💎`
  - 앨범 테마 보상: `완성 보상: 500🪙` → `완성 시 +500🪙`
  - 창고 잠금해제: `💎5` → `5💎`
  - 보상 힌트 통일: `(승리 시 +150🪙 +5💎)`, `(완성 시 +100💎)`, `(완주 시 +500🪙 +20💎)`
  - 수정 파일: index.html, game.js, systems.js, ui.js, album.js, race.js
- ✏️ **UX 라이팅 2차 통일** - 비용/보유/부족/판매 표기 정리
  - 비용: `💎n` → `n💎`, `🪙n` → `n🪙` (상점 가격표 3곳)
  - 판매: `n코인` → `n🪙`, 따옴표 제거, 구분자 `-` → `:`
  - 부족: `코인부족`/`다이아부족` → `코인 부족!`/`다이아 부족!`
  - 보유: 에너지 팝업 `보유: 0 🪙` → `보유: 0🪙` (줄바꿈 제거)
  - 버튼 순서: `500🪙 구매` → `구매 500🪙` (뽑기 🃏20 패턴에 통일)
  - 레이스 참가 문구: race.js 동적 렌더링에도 `(승리 시 +150🪙 +5💎)` 추가
  - 수정 파일: index.html, game.js, main.js, systems.js, race.js
- 🐛 **에너지 구매 리셋 타이머 자정 넘김 버그 수정**
  - 기존: 저장된 remaining ms 복원 → 자정 넘기면 타이머 어긋남
  - 수정: 항상 `getMsUntilKSTMidnight()`로 fresh 계산 + `savedAt` 기준 자정 지남 판정 시 구매 횟수 초기화

### v4.17.0 (2026-02-11)
- 🗑️ **전설 퀘스트 시스템 완전 제거**
  - 주사위 여행 완주 → 전설 생성기 스폰 → 유니콘 합성 순환 구조 폐지
  - 새 흐름: 50칸 완주 → 1000🪙+50💎 → 즉시 리셋 → 다시 시작
  - 완주 보상 조정: 2000🪙+100💎 → 1000🪙+50💎
- 삭제 항목
  - 상수: `LEGENDARY_COMPLETE_REWARD`, `LEGENDARIES`
  - 함수 (7개): `isLegendaryQuestActive`, `spawnLegendaryGenerator`, `handleLegendaryGeneratorClick`, `completeLegendaryQuest`, `checkLegendaryComplete`, `updateLegendaryQuestUI`
  - HTML: `#legendary-quest-wrapper` 전체
  - CSS: `.legendary-generator-box`, `@keyframes legendary-glow`
- 수정 함수: `completeTrip` (즉시 리셋), `useDice` (잠금 제거), `updateDiceTripUI` (전설 UI 제거), `triggerGen` (legendary 분기 제거), `moveItem` (legendary 체크 제거), `createItem` (legendary UI 제거), `updateAll` (legendary UI 호출 제거), `openGuide`/`renderGuideList` (legendary 탭 제거), `askSellItem` (legendary 참조 제거)
- **마이그레이션**: `applyGameData`에서 기존 legendary/legendary_generator 아이템 정리 + 완주 상태 리셋
- eslint.config.js: 삭제된 함수/상수 전역 목록에서 제거

### v4.16.0 (2026-02-11)
- ⭐ **스페셜 퀘스트 → 일반 퀘스트 통합**
  - 별도 UI(스페셜 퀘스트 영역) 제거 → 퀘스트 7번째 슬롯으로 통합
  - 순환: 🐦새 → 🐠물고기 → 🦎파충류 → 🐦새 → ... (완료마다 다음 타입)
  - Lv.2부터 등장 (레벨 제한/사이클 스케일링 제거)
  - 보상: 300🪙 (기존 500🪙+10💎에서 변경)
  - 타이머 없음 (만료 안 됨), `⭐스페셜` 표시
  - 완료 시 보드/창고에서 해당 타입 동물+생성기 제거
  - 생성기 자동 스폰: 빈 칸 없으면 대기 → updateAll에서 매번 체크
  - 레벨업 진행도(questProgress) 및 7행 미션(totalQuestsCompleted) 카운트에 포함
  - 정렬: 스페셜은 완료 가능해도 항상 마지막 위치
- **명칭 통일**: "일반 퀘스트" → "퀘스트"
- 삭제 항목
  - HTML: `#special-quest-area` 전체
  - CSS: `#special-quest-area`, `#special-mission-container`, `.sp-mission-card` 등
  - 변수: `specialMissionCycles`
  - 함수: `getSlotUnlockLevel`, `updateSpecialMissionUI`, `updateSlot`, `spawnSpecialGenerator`, `completeSpecialMission`
- 신규 변수: `currentSpecialIndex` (0=bird, 1=fish, 2=reptile)
- 신규 함수 (2개): `generateSpecialQuest`, `trySpawnSpecialGenerator`
- 수정 함수: `completeQuest` (스페셜 분기), `generateNewQuest` (스페셜 앞에 삽입), `updateQuestUI` (bird/fish/reptile 렌더링, 스페셜 타이머/정렬), `updateAll` (trySpawnSpecialGenerator 호출)
- 신규 저장 필드: `currentSpecialIndex` (기존 `specialMissionCycles` 대체)
- firestore.rules: `currentSpecialIndex` 검증 추가 (선택적 필드, 구버전 캐시 호환)
- **마이그레이션 개선**: `specialMissionCycles` 합계로 `currentSpecialIndex` 결정
- **로드 시 정리**: 비활성 스페셜 타입 동물/생성기를 보드/창고/상점에서 항상 제거 (마이그레이션 외 모든 로드)

### v4.15.0 (2026-02-11)
- 📖 **온보딩 튜토리얼 시스템** 추가
  - 새 유저 첫 로그인 시 4스텝 가이드 자동 시작
  - Step 1: 캣타워 터치 → Step 2: 한번 더 → Step 3: 드래그 합성 → Step 4: 퀘스트 완료
  - 스포트라이트 + 말풍선 UI (CSS 애니메이션)
  - 튜토리얼 중 `?`/`ⓒ` 버튼 숨김, 비타겟 셀 클릭 차단
  - 튜토리얼 중 퀘스트 만료 방지 (데드락 방지)
  - 튜토리얼 중 주사위 드랍/럭키 드랍 스킵
  - 완료 후 출석보상/레이스 초기화 실행
- **버그 수정 (9개)**
  - 튜토리얼 클릭 무반응 (handleDragEnd 경로 누락)
  - 스크롤 시 스포트라이트 위치 깨짐 (scrollIntoView 대기)
  - `?` 도움말 버튼 튜토리얼 중 노출
  - `ⓒ` 판매 버튼 튜토리얼 중 노출
  - 에너지 0일 때 advanceTutorial 오발동 (생성 확인 로직)
  - 퀘스트 만료 → Step 4 데드락 (만료 스킵)
  - Step 3-4 비타겟 셀 클릭 가능 (전체 스텝 필터)
  - updateAll() 호출 시 스포트라이트 해제 (repositionTutorial 추가)
  - startQuestTimer() DOM 재생성 시 스포트라이트 소실 (타이머에 repositionTutorial 추가)
- **딜레이 최적화**
  - 스텝 전환 딜레이 400~500ms → 200ms
  - 스크롤 대기 350ms → 200ms
- 신규 파일: `js/tutorial.js` (~191줄)
- 신규 변수: `tutorialStep`, `lastMergedIndex`, `tutorialPointer`
- 신규 함수 (10개): `startTutorial`, `showTutorialStep`, `positionSpotlight`, `positionBubble`, `advanceTutorial`, `completeTutorial`, `isTutorialClickAllowed`, `findSameLevelPair`, `findReadyQuestBtn`, `repositionTutorial`
- 신규 저장 필드: `tutorialStep`
- 수정 함수: `createItem` (버튼 숨김), `updateAll` (reposition), `handleCellClick` (전체 스텝 필터), `triggerGen` (생성 확인), `checkExpiredQuests` (만료 스킵), `handleDragEnd` (드래그 제한), `startQuestTimer` (reposition), `initNewGame` (tutorialStep=1)
- firestore.rules: `tutorialStep` 필드 검증 추가

### v4.14.0 (2026-02-09) ← v4.17.0에서 전설 퀘스트 제거됨
- 🦄 **전설 퀘스트 시스템** 추가
  - 주사위 여행 50칸 완주 → **목장** 스폰
  - 목장 클릭 3회 → Lv.1 아기말 생성 (1분 과열)
  - Lv.1~5 합성: 아기말 → 얼룩말 → 경주마 → 환상마 → 유니콘
  - 유니콘 완성 시 **500🪙 + 20💎** 보상 + 🦄 완료! 버튼
- **전설 퀘스트 UI**
  - 보상 정보 표시: "(완료 500🪙 +20💎)"
  - 진행 상태: 생성기 터치! → Lv.n → Lv.5 🦄 → 유니콘 완성!
  - 유니콘 완성 시 "🦄 완료!" 버튼 표시
  - 목장 도감 추가 (LEGENDARIES 리스트)
- **주사위 ↔ 전설 퀘스트 순환 구조**
  - 전설 퀘스트 진행 중 주사위 여행 잠금
  - UI: "🔒 전설 퀘스트를 완료하세요", 버튼: "🔒 잠김 (🎲n)"
  - 잠금 상태에서도 주사위 드랍/보유 개수 표시
  - 전설 퀘스트 완료 시 주사위 리셋 (position, visitedSteps, diceCount 모두 0)
- **주사위 완주 조건 수정**
  - 기존: position >= 50 (골인 칸 별도)
  - 수정: position >= 49 (마지막 칸 = 골인)
  - 마지막 칸 보상 지급 후 완주 처리
  - 골인 칸을 마지막 칸과 통합 (🐾가 🏁에 표시)
  - 50/50 완주 복구 로직 (이전 버전 유저 자동 완주)
- **엣지케이스 수정**
  - 생성기 판매 차단: "생성기는 판매할 수 없어요!" 토스트
  - 전설 동물 판매 시 올바른 이름 표시 (LEGENDARIES 리스트 사용)
  - 스페셜 퀘스트 창고 체크: Lv.7 동물이 창고에 있어도 "목표달성!" + 생성기 재스폰 방지
  - 전설 퀘스트 창고 체크: 유니콘이 창고에 있어도 퀘스트 완료 가능 + UI 레벨 반영
- **버그 수정**
  - 에너지 검증 상한 불일치: `validateGameData`에서 100 → 999
  - 탭 전환 시 에너지 회복 안 됨: `recoverOfflineEnergy()` 추가
- **코드 리팩토링**
  - 타이밍 상수 분리: `GENERATOR_COOLDOWN_MS`, `TOAST_DURATION_MS`, `MILESTONE_POPUP_MS` 등
  - 중복 제거 헬퍼 함수 4개: `hasItemOfType`, `hasItemOfTypeAndLevel`, `getMaxLevelOfType`, `isLegendaryQuestActive`
- 신규 상수: `LEGENDARIES`, `LEGENDARY_COMPLETE_REWARD`, 타이밍 상수 7개
- 신규 함수 (11개): `recoverOfflineEnergy`, `spawnLegendaryGenerator`, `handleLegendaryGeneratorClick`, `completeLegendaryQuest`, `checkLegendaryComplete`, `updateLegendaryQuestUI`, 헬퍼 함수 4개
- 수정 함수: `openGuide` (legendary 탭), `renderGuideList` (LEGENDARIES), `updateDiceTripUI` (잠금 UI), `renderDiceTripBoard` (골인 칸 통합)

### v4.13.0 (2026-02-09)
- 🎲 **주사위 여행 50칸 확장**
  - `DICE_TRIP_SIZE`: 20 → **50**
  - 완주 보상: 1000🪙+50💎 → **2000🪙+100💎**
  - 50칸 보상 테이블 (점진적 증가)
    - 1~10칸: 초반 (낮은 보상)
    - 11~30칸: 중반 (중간 보상)
    - 31~50칸: 후반 (높은 보상, 코인 200~350 등)
- **현재 위치 자동 스크롤**: 보드 렌더링 시 현재 위치가 보이도록 자동 스크롤
- firestore.rules: `diceTripPosition` 상한 50, `visitedSteps` 최대 50개

### v4.12.0 (2026-02-09)
- 주사위 여행 UI/UX 개선
  - 각 칸에 보상 아이콘+수량 표시 (예: 🪙10)
  - 굴리기 시 애니메이션 팝업 (흔들림 + 숫자 슬롯 효과)
  - 주사위 획득 시 전용 팝업 (보상: 주사위 1개 + 보유 수 표시)
  - 칸 번호(1~20) 제거
  - **자동 이동**: 주사위 결과 후 버튼 없이 자동 이동
  - 이동 후 보상 팝업에 획득 보상 표시
- **착지 칸만 보상** 로직 변경
  - 이동 시 통과 칸 무시, 착지 칸에서만 보상 지급
  - `visitedSteps` 배열로 밟은 칸 추적
  - 밟았던 칸만 ✓ 표시 (통과 칸은 보상 아이콘 유지)
- **모든 팝업 자동 닫기** (2초)
  - 레벨업, 마일스톤, 주사위 획득, 주사위 굴리기 팝업
  - 확인 버튼 클릭 불필요
- 에너지 보상 **100 초과 허용** (상한 999)
- 진행도 표시 1부터 시작 (0/20 → 1/20)
- 버그 수정
  - 드래그 이벤트가 버튼 클릭 방해 (handleDragStart 예외 처리)
  - 팝업 표시 방식 통일 (classList → style.display)
- 신규 변수: `visitedSteps`, `pendingDiceResult`
- 신규 함수: `executeMove()`, `giveStepRewardWithInfo()`
- firestore.rules: `visitedSteps` 배열 검증, 에너지 상한 999

### v4.11.0 (2026-02-09)
- 🎲 **주사위 여행** 시스템 추가 (구조현장 대체)
  - **삭제**: 구조현장, 룰렛 시스템 완전 제거
  - **핵심**: 합성 시 5% 확률로 주사위 드랍 → 20칸 보드 → 완주 보상
  - 20칸 횡스크롤 보드 (각 칸 보상: 코인/다이아/카드/에너지)
  - 완주 보상: **1000🪙 + 50💎**
  - 완주 시 **스페셜 케이지** 스폰 (최대 Lv.5)
  - 스페셜 케이지 클릭 → 고레벨 동물 생성 (Lv.4~10)
- 삭제 항목
  - 상수: `APARTMENT_ROOMS`, `RESCUE_QUEST_REWARD`, `FIRE_EXTINGUISH_COST`, `FIRE_EXTINGUISH_REWARD`, `ANIMAL_HP_DECAY`, `ANIMAL_HP_DECAY_SEC`, `ROULETTE_SEGMENTS`, `ROULETTE_COLORS`
  - 변수: `apartmentState`, `currentSetRescues`, `currentRouletteRoom`, `isSpinning`, `currentRotation`, `apartmentEl`, `rescueText`, `rescueTimerEl`, `rouletteWheel`
  - 함수: `initApartment`, `startAnimalHPTimer`, `showHelpBubble`, `renderApartment`, `openRoulette`, `renderRouletteLabels`, `updateRoulettePopupUI`, `startSpin`, `finishSpin`, `updateRescueQuestUI`, `startRescueTimer`
  - UI: `#rescue-wrapper`, `#roulette-popup`, `#apartment-area`
- 신규 상수: `DICE_TRIP_SIZE`, `DICE_DROP_CHANCE`, `DICE_TRIP_COMPLETE_REWARD`, `SPECIAL_CAGE_MAX_LEVEL`, `DICE_TRIP_REWARDS`, `SPECIAL_CAGE_SPAWNS`
- 신규 변수: `diceTripPosition`, `diceCount`, `isRollingDice`, `specialCageLevel`, `visitedSteps`, `pendingDiceResult`, `diceTripContainer`, `diceTripBoard`
- 신규 함수 (11개): `tryDropDice`, `useDice`, `rollDice`, `confirmDiceRoll`, `moveTripPosition`, `giveStepReward`, `completeTrip`, `spawnSpecialCage`, `handleSpecialCageClick`, `updateDiceTripUI`, `renderDiceTripBoard`
- firestore.rules: `apartmentState`, `currentSetRescues` 검증 제거, 주사위 여행 필드 추가

### v4.10.0 (2026-02-09)
- 일일 미션 시스템 추가
  - 기존 **상시 미션**, **누적 코인** 제거 → 일일 미션으로 통합
  - 3개 미션: 합성 30회(100🪙), 생성 50회(100🪙), 코인 500 획득(100🪙)
  - 매일 **KST 00:00** 자동 리셋 (한국 자정 기준)
  - 전체 완료 보너스: 10💎 + 5🃏 (자동 팝업)
  - 타이틀에 보너스 정보 표시: `(완료 시 +10💎 +5🃏)`
- 삭제 항목
  - 상수: `PM_GOALS`, `PM_TITLES`, `PM_ICONS`, `PM_REWARD`, `SPECIAL_QUEST_GOAL`, `SPECIAL_QUEST_STEP`, `SPECIAL_QUEST_REWARD_COINS`
  - 변수: `pmType`, `pmProgress`, `nextSpecialTarget`, `dailyBonusRow`
  - 함수: `addPmProgress()`, `updatePmUI()`, `updateSpecialQuestUI()`, `giveSpecialReward()`
  - UI: 상시 미션 바, 누적 코인 바, 보너스 수령 버튼
- 신규 상수: `DAILY_MISSIONS`, `DAILY_COMPLETE_REWARD`, `getKSTDateString()`, `getMsUntilKSTMidnight()`
- 신규 변수: `dailyMissions`, `dailyMissionsContainer`, `dailyResetTimer`
- 신규 함수 (6개): `checkDailyReset()`, `addDailyProgress()`, `checkDailyMissionComplete()`, `claimDailyBonus()`, `updateDailyMissionUI()`, `startDailyMissionTimer()`
- 코인 획득 시 `addDailyProgress('coins', amount)` 호출 추가 (퀘스트/스페셜미션/구조/판매)
- firestore.rules: `pmProgress` 검증 제거
- 버그 수정
  - 생성기 클릭 시 동물 2마리 생성되던 버그 (cell.onclick + handleDragEnd 중복 호출)
  - createBoardCells/createStorageCells에서 onclick 제거
  - 레이스 시작 시 초대 타이머가 계속 표시되던 버그 (pending→active 전환 시 UI 숨김 누락)

### v4.9.0 (2026-02-09)
- 7일 출석 보상 시스템
  - 기존 일일 보너스(50🪙+5💎+5🃏) → 7일 진행형 보상으로 변경
  - D1: 10💎 → D2: 20🪙 → D3: 5🃏 → D4: 30💎 → D5: 50🪙 → D6: 10🃏 → D7: 100💎
  - 7일 완료 후 다시 D1부터 반복
  - 하루 놓치면 D1로 리셋
- 상수 변경: `DAILY_BONUS` → `ATTENDANCE_REWARDS` (7일 보상 배열)
- 신규 저장 필드: `loginStreak` (0~6)
- 수정 함수: `checkDailyBonus()` - 연속 출석 체크 + 진행형 보상
- 버그 수정
  - 보드 꽉 찼을 때 에너지 감소 버그 (빈 칸 체크 → 에너지 소비 순서로 변경)
  - 퀘스트 완료 시 슬라이딩 맨 앞으로 자동 이동

### v4.8.0 (2026-02-09)
- 레이스 초대 시스템 추가
  - 코드 입력 시 즉시 시작 → 초대 전송으로 변경
  - 상대방이 수락해야 레이스 시작
  - 10분 초대 만료 타이머
  - 수락/거절/취소 기능
- 엣지케이스 처리
  - 모든 상태 변경 Transaction 적용 (수락/거절/취소)
  - 만료된 초대 무시 (showRaceInvitePopup)
  - 팝업 타이머 0:00 시 자동 닫기
  - validateCurrentRace에서 pending/declined/expired/cancelled 처리
  - player2Listener removed/modified 이벤트 분리
- Firestore 변경
  - status: 'pending' | 'declined' | 'expired' | 'cancelled' 추가
  - inviteExpiresAt 필드 추가
  - firestore.rules: status 전환 규칙 추가
- 신규 상수: `RACE_INVITE_EXPIRE_MS` (10분)
- 신규 변수: `pendingInviteId`, `pendingInviteData`, `inviteTimerInterval`
- 신규 함수 (9개): `findActiveOrPendingRace`, `showRaceInvitePopup`, `closeRaceInvitePopup`, `startInviteTimer`, `stopInviteTimer`, `acceptRaceInvite`, `declineRaceInvite`, `cancelPendingInvite`, `expireInvite`, `updatePendingInviteUI`
- UI 추가: 대기 상태 UI (타이머+취소), 초대 팝업 (수락/거절)

### v4.7.0 (2026-02-06)
- 레이스 시스템 단순화
  - 일일 제한/코드 만료 제거
  - 각 유저별 영구 코드 상시 표시
  - 코드 입력 시 대기 없이 즉시 레이스 시작
  - host/guest → player1/player2 구조 변경
  - "친구 초대" 팝업 제거 → 내 코드 상시 표시
- 1시간 시간 제한 추가
  - 레이스바에 남은 시간 표시 (내 코드 옆, mm:ss)
  - 시간 초과 시 진행도 높은 쪽 승리, 동점이면 무승부
  - 시간 초과 보상: 200🪙 (승패 무관)
- player2 실시간 감지
  - 내 코드로 레이스 시작 시 자동 감지 (onSnapshot)
- 최근 상대 퀵 조인
  - 레이스 완료 시 상대 정보 저장 (최대 3명)
  - 코드 입력 팝업에 최근 상대 버튼 표시
  - 버튼 클릭으로 즉시 레이스 시작
- 삭제 항목:
  - 상수: `RACE_MAX_PER_DAY`, `RACE_CODE_EXPIRE_MS`
  - 함수: `canJoinRace()`, `checkRaceReset()`, `getNextMidnightUTC()`, `cancelRace()`, `openRaceInvitePopup()`
  - 저장 필드: `lastRaceDate`, `todayRaceCount`
- 신규 상수: `RACE_EXPIRE_MS` (1시간), `RACE_REWARDS.timeout`
- 신규 함수: `getOrCreateMyCode()`, `findActiveRace()`, `checkRaceTimeout()`, `startPlayer2Listener()`, `stopPlayer2Listener()`, `addRecentOpponent()`, `quickJoinRace()`
- 신규 저장 필드: `myRaceCode`, `recentRaceOpponents`
- Firestore: `expiresAt`, `timedOut` 필드 추가
- firestore.rules: pending 상태 제거, 영구 코드 규칙

### v4.6.0 (2026-02-06)
- 데일리 레이스 시스템 추가

### v4.5.0 (2026-02-05)
- 앨범 시스템 UI/로직 개선
  - 상단바: "멍냥 머지" 제거, 🃏카드 수 표시 추가 (다이아↔레벨 사이)
  - 앨범바: 프로그레스바 카드(0/30) → 사진(0/81) 진행도로 변경
  - 앨범바: 카드 카운트 행 제거, 뽑기 버튼 첫 행으로 이동
  - 앨범 그리드: 등급별 그룹핑 제거 → 단순 3×3 배치
  - 미발견 사진: grayscale 제거, 등급 테두리색 유지 (opacity 0.5만)
  - 뽑기 버튼: 항상 활성화, 카드 부족 시 토스트 메시지
- 앨범 보상 변경
  - 81장 전체 완성 보상: 100💎 추가
  - 81장 완성 시 앨범 리셋 (cards/album/timer 초기화)
  - 리셋 조건: 81장 완성 OR 14일 경과 (먼저 달성)
  - 앨범바 텍스트: (완성 500🪙) → (100💎)
- 카드 시스템 변경
  - 카드 보상 확률: 10% → 30%
  - 카드 보상: 퀘스트 생성 시 결정 (완료 시가 아님)
  - 카드 퀘스트: 카드만 지급 (코인 없음)
- 상점 변경
  - 4번 칸: 🃏카드팩 ×20 고정 (10💎)
  - 구성: 랜덤×3 + 카드팩 + 다이아팩
- 밸런스 조정
  - SR 확률: 5% → 8%, N 확률: 75% → 72%
  - 카드팩 가격: 20💎 → 10💎
  - 상시미션 보상: 100 → 200🪙
  - 카드 수량: 1~5 → 2~6장
  - 누적코인 보상: 50 → 100🪙
  - 레벨업 퀘스트 상한: 무제한 → 최대 20개
  - 앨범 주기: 14일 → 21일
  - 일일 보너스 추가: 50🪙 + 5💎 + 5🃏 (매일 첫 접속)
  - 뽑기 비용: 30 → 20장
  - 카드팩 수량: 30 → 20장 (뽑기 1회분)

### v4.4.0 (2026-02-05)
- 앨범 시스템 (사진 수집) 추가
  - 9 테마 × 9장 = 총 81장 (N:6, R:2, SR:1)
  - 퀘스트 완료 시 카드 획득 → 20장으로 뽑기 → 앨범 수집
  - 테마 완성 시 500🪙 보상
  - 14일 주기 자동 초기화 (타이머 표시)
  - 앨범 모달: 테마 탭 + 3×3 그리드
- 신규 파일: `js/album.js`
- 신규 저장 필드: `cards`, `album`, `albumResetTime`
- firestore.rules: 앨범 필드 검증 추가

### v4.3.2 (2026-02-04)
- 퀘스트 UI: 보상/타이머 분리, 가운데 정렬
- 퀘스트 밸런스: 간식30%/동물50%, 보상 50% 감소
- UI: 레벨업 진행도 맨 위, 누적 코인 상시미션 아래

### v4.3.1 (2026-02-04)
- 에너지 소진 시 팝업 + 최초 무료 100개 충전

### v4.3.0 (2026-02-04)
- 오프라인 에너지 회복

### v4.2.6~v4.2.9 (2026-02-03~04)
- 장난감 생성기 🧸 (Lv.5 해제)
- 퀘스트 10분 타이머
- 레벨업 보상 구간제
- 데이터 손실 방지 3중 방어
- 유저 데이터 복구

### v4.1.0~v4.2.5 (2026-02-03)
- 실시간 세션 감지 (onSnapshot)
- UI 통일 (event-bar)
- 7행 미션 확장
- 에너지 구매 가격 증가
- 도감 시스템

### v4.0.0 (2026-02-03)
- 로그인 필수 + 클라우드 데이터 우선

### v1.x~v3.x (2026-02-02~03)
- 초기 구현 → Firebase 연동 → 파일 분리

---

## To-do

- [x] 쿨다운 즉시 해제 + 기부 시스템 (v4.33.0) - 코인 싱크 2종 추가
- [x] 스토리 퀘스트 데드락 수정 (v4.31.2) - expiresAt desync + 자동 복구 + updateAll 강화
- [x] 코드 리팩토링 (v4.31.2) - pre-commit hook, 중복 상수화, 함수 분리 (applyGameData/handleCellClick/moveItem)
- [x] 테스트 인프라 (v4.31.2) - Vitest 83개 테스트 (constants 51 + save 32)
- [x] 스페셜 생성기 업그레이드 시스템 (v4.31.0) - 새장/어항/사육장 Lv.1~5 쿨다운 감소
- [x] 스토리 시스템 v4.29.0 리디자인 - 보스 보드 아이템화 + 이미지 갤러리
- [x] 스토리 보스 이미지 7종 (images/story/)
- [x] 스토리 씬 이미지 24장 추가 (images/story/scenes/)
- [ ] 스토리 EP.8+ 추가 (향후)
- [x] 이모지 → 아이콘 교체 카테고리 B/C + 잔여 이모지 (v4.27.0)
- [ ] NPC 아바타 이미지 교체 (10종)
- [ ] 앨범 테마 아이콘 이미지 교체 (9종)
- [x] 스크롤/클릭 버그 수정 + 이름 보호 완료 (v4.25.3)
- [x] 코드 리팩토링 6 Phase (v4.25.1) - dead code, 버그 수정, 헬퍼 추출, 상수화, UI 패턴 정리
- [x] 커스텀 아이콘 시스템 + 이모지 일괄 교체 (v4.25.0)
- [x] 설정 팝업 + 회원탈퇴 + 개인정보처리방침 (v4.24.0)
- [x] 사운드 시스템 (v4.23.0)
- [x] UX 라이팅 통일 (v4.18.0)
- [x] 하단 배지 내비게이션 바 (v4.18.0)
- [x] 전설 퀘스트 시스템 제거 (v4.17.0)
- [x] 스페셜 퀘스트 일반 퀘스트 통합 (v4.16.0)
- [x] 온보딩 튜토리얼 시스템 (v4.15.0)
- [x] 데일리 레이스 시스템 (v4.6.0)
- [x] 레이스 단순화 - 영구 코드/즉시 시작 (v4.7.0)
- [x] 레이스 1시간 타이머 + 타임아웃 보상 (v4.7.0)
- [x] 최근 상대 퀵 조인 (v4.7.0)
- [x] 레이스 초대 시스템 - 수락/거절 (v4.8.0)
- [x] 레이스 엣지케이스 처리 (v4.8.0)
- [x] 7일 출석 보상 시스템 (v4.9.0)
- [x] 일일 미션 시스템 (v4.10.0)
- [x] 주사위 여행 시스템 (v4.11.0)
- [x] 주사위 여행 UI/UX 개선 (v4.12.0)
- [x] 엣지케이스 수정 - 창고 체크, 생성기 판매 차단 (v4.14.0)
- [x] 코드 리팩토링 - 상수 분리, 헬퍼 함수 추출 (v4.14.0)
