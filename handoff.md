# 멍냥 머지 게임 - Architecture (v4.17.0)

## 개요

**멍냥 머지**는 동물을 합성하여 성장시키는 모바일 친화적 웹 게임입니다.

- **URL**: https://pmsecon1-code.github.io/merge-game/
- **버전**: 4.17.0
- **Firebase 프로젝트**: `merge-game-7cf5f`

---

## 파일 구조

```
merge2/
├── index.html          # 메인 HTML (~595줄)
├── css/
│   └── styles.css      # 모든 CSS (~1450줄)
├── js/
│   ├── constants.js    # 상수 + 데이터 + 헬퍼 (~380줄)
│   ├── state.js        # 전역 변수 + DOM 참조 (~102줄)
│   ├── auth.js         # 인증 + 세션 관리 (~129줄)
│   ├── save.js         # 저장/로드/검증 (~430줄)
│   ├── game.js         # 코어 게임 메커닉 (~550줄)
│   ├── systems.js      # 7행미션/주사위 여행/상점 (~340줄)
│   ├── album.js        # 앨범 (사진 수집) 시스템 (~225줄)
│   ├── race.js         # 레이스 시스템 (1:1 경쟁) (~1060줄)
│   ├── tutorial.js     # 온보딩 튜토리얼 (4스텝) (~191줄)
│   ├── ui.js           # 렌더링/이펙트/드래그/도감 (~520줄)
│   └── main.js         # 초기화 + 타이머 (~257줄)
├── firestore.rules     # Firebase 보안 규칙
├── firebase.json       # Firebase Hosting + Firestore 설정
├── .firebaserc         # Firebase 프로젝트 연결
├── 404.html            # 404 페이지
└── handoff.md          # 이 문서
```

**script 로드 순서**: constants → state → auth → save → game → systems → album → race → tutorial → ui → main

**총 JS**: ~3500줄, **함수**: ~120개

---

## UI 레이아웃 (위→아래)

| 순서 | 요소 | 스타일 |
|------|------|--------|
| 0 | 로그인 화면 (비로그인 시) | 전체 화면 |
| 1 | 상단바 (⚡에너지, 🪙코인, 💎다이아, 🃏카드, Lv.n, 🔑로그아웃) | status-bar |
| 2 | 📋 레벨업 진행도 (n/min(레벨×2,20)) | event-bar 파랑 |
| 3 | 📋 퀘스트 (7개, 3개씩 페이지) | event-bar 보라 |
| 4 | 맵 (5×7 = 35칸) | board-wrapper 분홍 |
| 5 | 📋 일일 미션 (합성/생성/코인) | event-bar 황색 |
| 6 | 🏁 레이스 (1:1 경쟁) | event-bar 시안 |
| 7 | 📸 앨범 (진행도/타이머/뽑기/앨범보기) | event-bar 보라 |
| 8 | 🎲 주사위 여행 (50칸 보드게임) | event-bar 초록 |
| 9 | 🛒 상점 (5칸: 랜덤×3 + 🃏카드팩 + 💎다이아팩) | event-bar 주황 |
| 10 | 📦 창고 (5칸) | event-bar 초록 |

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

  // 재화
  coins, cumulativeCoins, diamonds, energy,

  // 진행도
  userLevel, questProgress,
  quests: [{id, npc, reqs, reward, cardReward, expiresAt}, ...],
  totalQuestsCompleted,

  // 주사위 여행 (v4.11.0+)
  diceTripPosition,       // 현재 위치 (0~50)
  diceCount,              // 보유 주사위 수
  visitedSteps,           // 밟았던 칸 인덱스 배열 (v4.12.0+)

  // 생성기
  genLevels: {cat, dog},

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
    merge,              // 합성 횟수
    spawn,              // 생성 횟수
    coins,              // 획득 코인
    claimed,            // [false, false, false] 개별 보상 수령
    bonusClaimed,       // false 전체 완료 보너스 수령
    lastResetDate,      // "YYYY-MM-DD" 마지막 리셋 날짜
  },

  // 튜토리얼 (v4.15.0+)
  tutorialStep,             // 0=완료, 1~4=진행 중 스텝

  // 기타
  discoveredItems, currentSpecialIndex,
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
| 스페셜 퀘스트 (7번째 슬롯) | 300🪙 |
| 주사위 여행 완주 | 1000🪙 + 50💎 |
| 레벨업 | ceil(레벨/5)×5 💎 |
| 테마 완성 (9/9) | 500🪙 (×9 테마) |
| 앨범 완성 (81/81) | 100💎 + 리셋 |
| 7일 출석 보상 | D1:10💎 → D2:20🪙 → D3:5🃏 → D4:30💎 → D5:50🪙 → D6:10🃏 → D7:100💎 (연속 출석) |

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

## 주사위 여행 (v4.17.0)

### 개요
합성 시 주사위 드랍 → 50칸 보드게임 → 완주 시 보상 + 즉시 리셋 (반복)

### 상수
```javascript
DICE_TRIP_SIZE = 50              // 보드 칸 수
DICE_DROP_CHANCE = 0.05          // 합성 시 5% 드랍
DICE_TRIP_COMPLETE_REWARD = { coins: 1000, diamonds: 50 }
```

### 흐름
```
[합성] → 5% 확률 주사위 드랍
    ↓
[주사위 사용] → 1~6 이동 → 착지 칸 보상
    ↓
[50칸 완주] → 1000🪙 + 50💎 → 즉시 리셋 (position=0, visited=[0], dice=0)
    ↓
[다시 시작] ← 반복
```

### 칸 보상 (50칸)
| 구간 | 보상 타입 | 범위 |
|------|-----------|------|
| 1~10 | 코인/에너지/카드/다이아 | 10~60 |
| 11~20 | 코인/에너지/카드/다이아 | 30~100 |
| 21~30 | 코인/에너지/카드/다이아 | 50~140 |
| 31~40 | 코인/에너지/카드/다이아 | 80~200 |
| 41~50 | 코인/에너지/카드/다이아 | 120~350 |

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

### game.js (26개)
`discoverItem`, `countEasyQuests`, `generateNewQuest`, `generateSpecialQuest`, `trySpawnSpecialGenerator`, `scrollQuests`, `completeQuest`, `checkExpiredQuests`, `formatQuestTimer`, `spawnItem`, `spawnToy`, `handleCellClick`, `triggerGen`, `getEnergyPrice`, `checkEnergyAfterUse`, `openEnergyPopup`, `closeEnergyPopup`, `buyEnergy`, `getActiveTypes`, `checkToyGeneratorUnlock`, `moveItem`, `checkDailyReset`, `addDailyProgress`, `checkDailyMissionComplete`, `claimDailyBonus`, `checkDailyBonus`

### systems.js (21개)
`hasItemOfType`, `hasItemOfTypeAndLevel`, `getMaxLevelOfType`, `checkAutoCompleteMissions`, `startShopTimer`, `refreshShop`, `generateRandomShopItem`, `renderShop`, `buyShopItem`, `askSellItem`, `tryDropDice`, `useDice`, `rollDice`, `executeMove`, `closeDiceRollPopup`, `moveTripPosition`, `giveStepReward`, `giveStepRewardWithInfo`, `completeTrip`, `updateDiceTripUI`, `renderDiceTripBoard`

### ui.js (26개)
`renderGrid`, `createItem`, `updateAll`, `updateUI`, `updateLevelupProgressUI`, `updateTimerUI`, `updateQuestUI`, `spawnParticles`, `spawnItemEffect`, `showLuckyEffect`, `showFloatText`, `showToast`, `showMilestonePopup`, `closeOverlay`, `formatTime`, `updateEnergyPopupTimer`, `handleDragStart`, `handleDragMove`, `handleDragEnd`, `openGuide`, `closeModal`, `switchGuideTab`, `renderGuideList`, `updateUpgradeUI`, `upgradeGenerator`, `updateDailyMissionUI`

### race.js (30개)
`generateRaceCode`, `getOrCreateMyCode`, `findActiveRace`, `findActiveOrPendingRace`, `joinRaceByCode`, `copyRaceCode`, `startRaceListener`, `stopRaceListener`, `startPlayer2Listener`, `stopPlayer2Listener`, `showRaceInvitePopup`, `closeRaceInvitePopup`, `startInviteTimer`, `stopInviteTimer`, `acceptRaceInvite`, `declineRaceInvite`, `cancelPendingInvite`, `expireInvite`, `updatePendingInviteUI`, `updateRaceProgress`, `checkRaceWinner`, `checkRaceTimeout`, `showRaceResult`, `claimRaceReward`, `addRecentOpponent`, `quickJoinRace`, `updateRaceUI`, `updateRaceUIFromData`, `openRaceJoinPopup`, `submitRaceCode`, `validateCurrentRace`, `initRace`

### tutorial.js (10개)
`startTutorial`, `showTutorialStep`, `positionSpotlight`, `positionBubble`, `advanceTutorial`, `completeTutorial`, `isTutorialClickAllowed`, `findSameLevelPair`, `findReadyQuestBtn`, `repositionTutorial`

### main.js (8개)
`init`, `createBoardCells`, `createStorageCells`, `createShopCells`, `startEnergyRecovery`, `startCooldownTimer`, `startQuestTimer`, `startDailyMissionTimer`

---

## 상수 (constants.js)

### 그리드
`GRID_COLS=5`, `GRID_ROWS=7`, `BOARD_SIZE=35`, `STORAGE_SIZE=5`, `SHOP_SIZE=5`

### 밸런스
`MAX_ENERGY=100`, `RECOVERY_SEC=30`, `SHOP_REFRESH_MS=300000`, `UNLOCK_COST_BOARD=100`, `SNACK_CHANCE=0.08`

### 주사위 여행
`DICE_TRIP_SIZE=50`, `DICE_DROP_CHANCE=0.05`, `DICE_TRIP_COMPLETE_REWARD={coins:1000, diamonds:50}`

### 에너지 구매
`getEnergyPrice()` → 500 + 구매횟수×100 (3시간 리셋)

### 데이터 배열 (11개)
`CATS`(11), `DOGS`(11), `BIRDS`(7), `FISH`(7), `REPTILES`(7), `CAT_SNACKS`(5), `DOG_SNACKS`(5), `CAT_TOYS`(5), `DOG_TOYS`(5), `ALBUM_THEMES`(9테마×9장), `NPC_AVATARS`, `DAILY_MISSIONS`(3개), `ATTENDANCE_REWARDS`(7일), `DICE_TRIP_REWARDS`(50칸)

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

---

## 변경 이력

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

- [ ] 사운드 효과 추가
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
