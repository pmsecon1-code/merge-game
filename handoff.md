# 멍냥 머지 게임 - Architecture (v4.8.0)

## 개요

**멍냥 머지**는 동물을 합성하여 성장시키는 모바일 친화적 웹 게임입니다.

- **URL**: https://pmsecon1-code.github.io/merge-game/
- **버전**: 4.8.0
- **Firebase 프로젝트**: `merge-game-7cf5f`

---

## 파일 구조

```
merge2/
├── index.html          # 메인 HTML (~595줄)
├── css/
│   └── styles.css      # 모든 CSS (~1450줄)
├── js/
│   ├── constants.js    # 상수 + 데이터 + 헬퍼 (~388줄)
│   ├── state.js        # 전역 변수 + DOM 참조 (~102줄)
│   ├── auth.js         # 인증 + 세션 관리 (~129줄)
│   ├── save.js         # 저장/로드/검증 (~420줄)
│   ├── game.js         # 코어 게임 메커닉 (~485줄)
│   ├── systems.js      # 스페셜 미션/구조/상점 (~467줄)
│   ├── album.js        # 앨범 (사진 수집) 시스템 (~225줄)
│   ├── race.js         # 레이스 시스템 (1:1 경쟁) (~1060줄)
│   ├── ui.js           # 렌더링/이펙트/드래그/도감 (~515줄)
│   └── main.js         # 초기화 + 타이머 (~252줄)
├── firestore.rules     # Firebase 보안 규칙
├── firebase.json       # Firebase Hosting + Firestore 설정
├── .firebaserc         # Firebase 프로젝트 연결
├── 404.html            # 404 페이지
└── handoff.md          # 이 문서
```

**script 로드 순서**: constants → state → auth → save → game → systems → album → race → ui → main

**총 JS**: ~3500줄, **함수**: ~120개

---

## UI 레이아웃 (위→아래)

| 순서 | 요소 | 스타일 |
|------|------|--------|
| 0 | 로그인 화면 (비로그인 시) | 전체 화면 |
| 1 | 상단바 (⚡에너지, 🪙코인, 💎다이아, 🃏카드, Lv.n, 🔑로그아웃) | status-bar |
| 2 | 📋 레벨업 진행도 (n/min(레벨×2,20)) | event-bar 파랑 |
| 3 | 📋 일반 퀘스트 (6개, 3개씩 페이지) | event-bar 보라 |
| 4 | 맵 (5×7 = 35칸) | board-wrapper 분홍 |
| 5 | 🔨 상시 미션 | event-bar 보라 |
| 6 | 👑 누적 코인 (칸마다 100🪙) | event-bar |
| 7 | 🏁 레이스 (1:1 경쟁) | event-bar 시안 |
| 8 | 📸 앨범 (진행도/타이머/뽑기/앨범보기) | event-bar 보라 |
| 9 | ⭐ 스페셜 퀘스트 (🐦🐠🦎) | event-bar 노랑 |
| 10 | 🚑 구조 현장 (3마리, 1000🪙) | event-bar 파랑 |
| 11 | 🛒 상점 (5칸: 랜덤×3 + 🃏카드팩 + 💎다이아팩) | event-bar 주황 |
| 12 | 📦 창고 (5칸) | event-bar 초록 |

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

### 관련 함수 (auth.js)
| 함수 | 역할 |
|------|------|
| `startGoogleLogin()` | Google 팝업 로그인 |
| `handleGoogleLogin()` | 로그아웃 버튼 |
| `registerSession()` | Firestore 세션 등록 |
| `startSessionListener()` | onSnapshot 실시간 감시 |
| `stopSessionListener()` | 리스너 해제 |
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
  // 보드
  boardState: [{type, level}, ...],      // 35칸
  storageState: [{type, level}, ...],    // 5칸
  apartmentState: [{type, level, hp, rescued}, ...], // 3칸

  // 재화
  coins, cumulativeCoins, diamonds, energy,

  // 진행도
  userLevel, questProgress,
  quests: [{id, npc, reqs, reward, cardReward, expiresAt}, ...],
  currentSetRescues, totalQuestsCompleted,

  // 생성기
  genLevels: {cat, dog},

  // 상점
  shopItems: [...],  shopNextRefresh,

  // 앨범 (v4.4.0+)
  cards,                    // 보유 카드 수
  album: ["0_3", "2_7"],   // 수집한 사진 키
  albumResetTime,           // 다음 초기화까지 ms

  // 일일 보너스
  lastDailyBonusDate,              // "YYYY-MM-DD" 형식

  // 레이스 (v4.7.0+)
  currentRaceId,            // 현재 참여 중인 레이스 ID
  myRaceCode,               // 내 영구 코드 (6자리)
  raceWins,                 // 누적 승리
  raceLosses,               // 누적 패배
  recentRaceOpponents,      // 최근 상대 [{code, name}, ...] (최대 3명)

  // 기타
  discoveredItems, specialMissionCycles, pmType, pmProgress,
  firstEnergyRewardGiven, savedAt
}
```

### 관련 함수 (save.js, 12개)
`getGameData`, `applyGameData`, `migrateRow7Missions`, `saveGame`, `saveGameNow`, `updateSaveStatus`, `sanitizeForFirestore`, `isValidSaveData`, `saveToCloud`, `loadFromCloud`, `validateGameData`, `initNewGame`

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
- saves: `isValidSaveData()` 검증 (숫자 범위, 배열 크기, 타임스탬프)
- 앨범: `cards 0~9999`, `album 최대 100`
- races: 참가자만 읽기/쓰기, 진행도 0~15 검증
- raceCodes: 로그인 사용자만 생성/삭제

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
| bird | 새장 | - | 새(7) | 스페셜 |
| fish | 어항 | - | 물고기(7) | 스페셜 |
| reptile | 사육장 | - | 파충류(7) | 스페셜 |

### 퀘스트 (game.js)
- 6개 동시, 3개씩 페이지 (좌우 네비)
- 10분 타이머 (만료 시 자동 교체)
- 30% 확률 카드 퀘스트 (생성 시 결정)
- 카드 퀘스트: 카드만 지급 / 일반 퀘스트: 코인만 지급
- 난이도: `baseLevel = 1 + floor(userLevel/3)`, 6개 중 2개는 Lv.3 이하 보장
- 보상: `10 + score + random(0~4)` (동물×5, 간식/장난감×7)

### 상점 (systems.js)
| 칸 | 내용 | 가격 |
|----|------|------|
| 1~3 | 랜덤 아이템 (동물/간식/장난감) | 레벨 만큼 💎 |
| 4 | 🃏 카드팩 ×20 (고정) | 10💎 |
| 5 | 💎 다이아팩 ×10 (고정) | 500🪙 |

- 5분마다 갱신 (카드팩/다이아팩은 재구매 가능, 품절 안 됨)

### 보상 구조
| 항목 | 보상 |
|------|------|
| 퀘스트 완료 (일반) | 가변 코인 (레벨 스케일링) |
| 퀘스트 완료 (카드) | 2~6장 🃏 |
| 누적 코인 1000 | 칸마다 100🪙 |
| 구조 완료 (3마리) | 1000🪙 |
| 스페셜 미션 | 500🪙 + 10💎 |
| 상시 미션 | 200🪙 |
| 레벨업 | ceil(레벨/5)×5 💎 |
| 테마 완성 (9/9) | 500🪙 (×9 테마) |
| 앨범 완성 (81/81) | 100💎 + 리셋 |
| 일일 보너스 | 50🪙 + 5💎 + 5🃏 (매일 첫 접속) |

---

## 앨범 시스템 (v4.4.0~v4.5.0)

### 구조
- 9 테마 × 9장 = **81장** 사진
- 등급: **N**(6장, 72%) / **R**(2장, 20%) / **SR**(1장, 8%)

### 상수
```javascript
ALBUM_CARD_COST = 20        // 뽑기 필요 카드
ALBUM_DRAW_COUNT = 2         // 1회 뽑기 사진 수
ALBUM_CARD_CHANCE = 0.30     // 퀘스트 카드 보상 확률 (30%)
ALBUM_CARD_MIN = 2           // 카드 최소
ALBUM_CARD_MAX = 6           // 카드 최대
ALBUM_DUPE_REWARD = { N: 3, R: 8, SR: 20 }
ALBUM_COMPLETE_COINS = 500   // 테마 완성 보상
ALBUM_ALL_COMPLETE_DIAMONDS = 100  // 전체 완성 보상
ALBUM_CYCLE_MS = 21일        // 초기화 주기
```

### 흐름
```
[퀘스트 완료] → 30% 확률 카드 2~6장 (생성 시 결정)
      ↓
[카드 20장] → 뽑기 → 사진 2장
      ↓         ↓
   [신규]    [중복] → 등급별 카드 반환 (N:3, R:8, SR:20)
      ↓
[테마 9/9] → +500🪙 (최대 9회 = 4500🪙)
      ↓
[전체 81/81] → +100💎 → 앨범 리셋 → 새 주기
```

### 리셋 조건 (둘 중 먼저)
| 조건 | 동작 |
|------|------|
| 81장 수집 | 100💎 + cards/album/timer 초기화 |
| 21일 경과 | 토스트 알림 + 초기화 (보상 없음) |

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
- **앨범바**: 진행도(0/81), 보상(100💎), 타이머, 뽑기 버튼, 앨범 보기 버튼, 프로그레스바(사진)
- **상단바**: 🃏카드 수 표시 (다이아와 레벨 사이)
- **뽑기 버튼**: 항상 활성화, 카드 부족 시 토스트 메시지
- **앨범 모달**: 9개 테마 탭 + 3×3 사진 그리드 + 등급별 테두리색 (N:회색, R:파랑, SR:금색)
- **미발견 사진**: opacity 0.5, 등급 테두리색 유지 (grayscale 없음)

### 관련 함수 (album.js, 14개)
| 함수 | 역할 |
|------|------|
| `getRandomPhoto()` | 등급 확률로 랜덤 사진 선택 |
| `processDrawResult()` | 신규/중복 처리 |
| `drawPhotos()` | 30카드 소비 → 2장 뽑기 |
| `openPhotoDraw()` / `closePhotoDraw()` | 뽑기 팝업 |
| `checkAlbumReset()` | 21일 주기 초기화 |
| `openAlbum()` / `closeAlbum()` | 앨범 모달 |
| `renderAlbumTabs()` | 테마 탭 (진행도) |
| `switchAlbumTheme()` | 테마 전환 |
| `renderAlbumGrid()` | 3×3 사진 그리드 |
| `checkThemeComplete()` | 테마 완성 → 500🪙 |
| `checkAlbumAllComplete()` | 전체 완성 → 100💎 + 리셋 |
| `getAlbumProgress()` | 수집 수 계산 |
| `updateAlbumBarUI()` | 앨범바 + 상단바 카드 업데이트 |

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
| 승리 | 200🪙 + 10💎 |
| 패배 | 50🪙 |
| 무승부 | 100🪙 + 5💎 |
| 시간 초과 | 50🪙 |

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
RACE_GOAL = 10                 // 퀘스트 10개 완료
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

### game.js (20개)
`discoverItem`, `countEasyQuests`, `generateNewQuest`, `scrollQuests`, `completeQuest`, `checkExpiredQuests`, `formatQuestTimer`, `spawnItem`, `spawnToy`, `handleCellClick`, `triggerGen`, `getEnergyPrice`, `checkEnergyAfterUse`, `openEnergyPopup`, `closeEnergyPopup`, `buyEnergy`, `getActiveTypes`, `checkToyGeneratorUnlock`, `moveItem`, `checkDailyBonus`

### systems.js (26개)
`getSlotUnlockLevel`, `updateSpecialMissionUI`, `updateSlot`, `spawnSpecialGenerator`, `completeSpecialMission`, `addPmProgress`, `updatePmUI`, `checkAutoCompleteMissions`, `updateSpecialQuestUI`, `giveSpecialReward`, `updateRescueQuestUI`, `startShopTimer`, `refreshShop`, `generateRandomShopItem`, `renderShop`, `buyShopItem`, `initApartment`, `startAnimalHPTimer`, `showHelpBubble`, `renderApartment`, `openRoulette`, `renderRouletteLabels`, `updateRoulettePopupUI`, `startSpin`, `finishSpin`, `askSellItem`

### ui.js (25개)
`renderGrid`, `createItem`, `updateAll`, `updateUI`, `updateLevelupProgressUI`, `updateTimerUI`, `updateQuestUI`, `spawnParticles`, `spawnItemEffect`, `showLuckyEffect`, `showFloatText`, `showToast`, `showMilestonePopup`, `closeOverlay`, `formatTime`, `updateEnergyPopupTimer`, `handleDragStart`, `handleDragMove`, `handleDragEnd`, `openGuide`, `closeModal`, `switchGuideTab`, `renderGuideList`, `updateUpgradeUI`, `upgradeGenerator`

### race.js (30개)
`generateRaceCode`, `getOrCreateMyCode`, `findActiveRace`, `findActiveOrPendingRace`, `joinRaceByCode`, `copyRaceCode`, `startRaceListener`, `stopRaceListener`, `startPlayer2Listener`, `stopPlayer2Listener`, `showRaceInvitePopup`, `closeRaceInvitePopup`, `startInviteTimer`, `stopInviteTimer`, `acceptRaceInvite`, `declineRaceInvite`, `cancelPendingInvite`, `expireInvite`, `updatePendingInviteUI`, `updateRaceProgress`, `checkRaceWinner`, `checkRaceTimeout`, `showRaceResult`, `claimRaceReward`, `addRecentOpponent`, `quickJoinRace`, `updateRaceUI`, `updateRaceUIFromData`, `openRaceJoinPopup`, `submitRaceCode`, `validateCurrentRace`, `initRace`

### main.js (8개)
`init`, `createBoardCells`, `createStorageCells`, `createShopCells`, `startEnergyRecovery`, `startCooldownTimer`, `startRescueTimer`, `startQuestTimer`

---

## 상수 (constants.js)

### 그리드
`GRID_COLS=5`, `GRID_ROWS=7`, `BOARD_SIZE=35`, `STORAGE_SIZE=5`, `APARTMENT_ROOMS=3`, `SHOP_SIZE=5`

### 밸런스
`MAX_ENERGY=100`, `RECOVERY_SEC=30`, `SHOP_REFRESH_MS=300000`, `UNLOCK_COST_BOARD=100`, `RESCUE_QUEST_REWARD=1000`, `SNACK_CHANCE=0.08`

### 에너지 구매
`getEnergyPrice()` → 500 + 구매횟수×100 (3시간 리셋)

### 데이터 배열 (14개)
`CATS`(11), `DOGS`(11), `BIRDS`(7), `FISH`(7), `REPTILES`(7), `CAT_SNACKS`(7), `DOG_SNACKS`(7), `CAT_TOYS`(5), `DOG_TOYS`(5), `ALBUM_THEMES`(9테마×9장), `NPC_AVATARS`, `ROULETTE_SEGMENTS`, `PM_GOALS`, `PM_TITLES`

### 헬퍼 함수 (5개)
`getItemList`, `getMaxLevel`, `getItemData`, `getGeneratorName`, `getSpecialTypeName`

---

## 배포

### GitHub Pages (게임)
```bash
git push   # → 자동 배포 (1~2분)
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
| 구조현장 리셋 안 됨 | 유저 데이터 꼬임 | Firebase REST API로 전체 리셋 (아래 참조) |

### 운영 스크립트

**전체 유저 구조현장 리셋** (브라우저 콘솔):
```javascript
const db = firebase.firestore();
db.collection('saves').get().then(s => {
  const b = db.batch();
  s.forEach(d => b.update(d.ref, {
    currentSetRescues: 0,
    apartmentState: [
      {emoji:'😿',hp:100,fireHp:100,rescued:false},
      {emoji:'🙀',hp:100,fireHp:100,rescued:false},
      {emoji:'😿',hp:100,fireHp:100,rescued:false}
    ]
  }));
  return b.commit();
}).then(() => alert('완료!'));
```

---

## 변경 이력

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

- [ ] 사운드 효과 추가
- [ ] 튜토리얼 확장
- [x] 데일리 레이스 시스템 (v4.6.0)
- [x] 레이스 단순화 - 영구 코드/즉시 시작 (v4.7.0)
- [x] 레이스 1시간 타이머 + 타임아웃 보상 (v4.7.0)
- [x] 최근 상대 퀵 조인 (v4.7.0)
- [x] 레이스 초대 시스템 - 수락/거절 (v4.8.0)
- [x] 레이스 엣지케이스 처리 (v4.8.0)
