# 멍냥 머지 게임 - Architecture (v4.37.1)

## 개요
- **URL**: https://pmsecon1-code.github.io/merge-game/
- **버전**: 4.37.1 | **Firebase**: `merge-game-7cf5f`
- 동물을 합성하여 성장시키는 모바일 친화적 웹 게임

---

## 파일 구조

```
merge2/
├── index.html          # 메인 HTML (~684줄)
├── css/styles.css      # 모든 CSS (~1971줄)
├── js/
│   ├── constants.js    # 상수+데이터+헬퍼+ICON (~750줄)
│   ├── state.js        # 전역 변수+DOM 참조 (~141줄)
│   ├── auth.js         # 인증+세션+회원탈퇴 (~180줄)
│   ├── save.js         # 저장/로드/검증/클램핑/진단 (~740줄)
│   ├── game.js         # 코어 게임 메커닉 (~1024줄)
│   ├── systems.js      # 7행미션/주사위여행/상점/탐험 (~590줄)
│   ├── album.js        # 앨범(사진수집) (~243줄)
│   ├── race.js         # 레이스(1:1경쟁) (~1069줄)
│   ├── sound.js        # 사운드(효과음+BGM) (~419줄)
│   ├── story.js        # 스토리 이미지 갤러리 (~335줄)
│   ├── tutorial.js     # 온보딩 튜토리얼 4스텝 (~194줄)
│   ├── ui.js           # 렌더링/이펙트/드래그/도감/배지바/설정 (~922줄)
│   └── main.js         # 초기화+타이머 (~315줄)
├── hooks/pre-commit    # Git pre-commit (lint+test)
├── tests/              # Vitest 테스트 86개
├── images/             # icons(33)+effects(3)+race(5)+spawners(8)+badges(6)+story(7보스+24씬)+동물(78)
├── firestore.rules     # Firebase 보안 규칙
└── firebase.json       # Firebase Hosting+Firestore
```

**script 로드 순서**: constants > state > auth > save > game > systems > album > race > sound > story > ui > tutorial > main

**총 JS**: ~7020줄, **함수**: ~203개

---

## UI 레이아웃 (위->아래)

| # | 요소 | 설명 |
|---|------|------|
| 0 | 로그인 화면 | 비로그인 시 전체 화면 |
| 1 | 상단바 | 에너지/코인/다이아/카드/Lv+진행도/설정 |
| 2 | 퀘스트바 | 7개, 3개씩 페이지, 좌우 네비 |
| 3 | 맵 | 5x7=35칸 보드 |
| 4 | 일일 미션 | 합성/생성/코인 3단계 |
| 5 | 콘텐츠 영역 | 배지 탭 시 일일미션 대체 |
| 6 | 하단 배지바 | 탐험/레이스/앨범/주사위/상점/창고 6열 |

---

## 인증 (auth.js, 9개 함수)

```
[접속] > 로그인화면 > Google팝업 > 세션등록 > 클라우드로드 > 게임표시
다른기기 로그인 감지(onSnapshot) > 즉시 로그아웃
```

함수: `generateSessionId`, `registerSession`, `startSessionListener`, `stopSessionListener`, `startGoogleLogin`, `handleGoogleLogin`, `deleteAccount`, `showLoginScreen`, `showGameScreen`

---

## 저장 시스템 (save.js, 18개 함수)

### 저장 흐름
```
[게임액션] > updateAll() > saveGame()
  ├── localStorage (즉시, savedSessionId 포함)
  └── Firestore (500ms 디바운스)
[중요액션] > saveGameNow() > 즉시저장
[signOut] > cloudLoaded=false + localStorage삭제 > 저장차단
[다른기기] > loadFromCloud() > savedSessionId 불일치 > 클라우드 우선
```

### 저장 데이터 구조
```javascript
{
  // 보드 (아이템:{type,level} | 생성기:{type,clicks,cooldown} | 저금통:{type:'piggy_bank',coins,openAt} | 보스:{type:'boss',bossId} | 버블:{type:'bubble',itemType,itemLevel,expiresAt})
  boardState: [35칸], storageState: [5칸],
  // 재화
  coins, cumulativeCoins, diamonds, energy, energyRecoverAt,
  // 진행도
  userLevel, questProgress, quests: [{id,npc,reqs,reward,cardReward,expiresAt}], totalQuestsCompleted,
  // 주사위
  diceTripPosition, diceCount, visitedSteps,
  // 생성기
  genLevels: {cat,dog,bird,fish,reptile,dinosaur},
  // 상점
  shopItems, shopNextRefresh,
  // 앨범
  cards, album: ["0_3","2_7"], albumResetTime,
  // 출석
  lastDailyBonusDate, loginStreak,
  // 레이스
  currentRaceId, myRaceCode, raceWins, raceLosses, recentRaceOpponents,
  // 일일미션
  dailyMissions: {tier, merge, spawn, coins, claimed, bonusClaimed, lastResetDate},
  // 튜토리얼
  tutorialStep,
  // 스토리
  storyProgress: {unlockedImages, activeQuestId, bosses, pendingBoss},
  // 탐험
  exploreProgress: {revealedTiles, collectedFossils, claimedMilestones}, pendingDinoGen,
  // 세션 (v4.37.1)
  savedSessionId,
  // 기타
  discoveredItems, currentSpecialIndex, firstEnergyRewardGiven, savedAt
}
```

함수: `getGameData`, `migrateEnergyRecovery`, `loadDailyMissions`, `loadStoryProgress`, `cleanupLegacyItems`, `applyGameData`, `migrateRow7Missions`, `saveGame`, `saveGameNow`, `updateSaveStatus`, `sanitizeForFirestore`, `clampSaveData`, `isValidSaveData`, `diagnoseSaveData`, `saveToCloud`, `loadFromCloud`, `validateGameData`, `initNewGame`

---

## Firebase 구조

| 컬렉션 | 문서 | 용도 |
|--------|------|------|
| saves | {uid} | 게임 전체 상태 |
| sessions | {uid} | 세션 관리 (단일 로그인) |
| races | {raceId} | 레이스 상태 |
| raceCodes | {code} | 유저별 영구 6자리 코드 |

보안: 본인 문서만 접근, saves `isValidSaveData()` 검증, races 참가자만 읽기/쓰기

---

## 게임 시스템

### 보드 (5x7)
```
[0 ][1 ][2 ][3 ][4 ]  <- 캣타워(0), 개집(4)
[5 ]...[9 ]
[10]...[14]
[15]...[19]
[20]...[24]
[25]...[29]
[30][31][32][33][34]  <- 7행 미션
```

7행 미션: 30=캣타워Lv.2, 31=개집Lv.2, 32=사자(catLv.11), 33=북극곰(dogLv.11), 34=퀘스트100개

### 생성기
| 타입 | 이름 | 최대Lv | 생성물 | 해제 |
|------|------|--------|--------|------|
| cat | 캣타워 | 5 | 고양이(11)+간식 | 기본 |
| dog | 개집 | 5 | 강아지(11)+간식 | 기본 |
| toy | 장난감 | - | 장난감(5) | Lv.5 |
| bird | 새장 | 5 | 새(7) | 스페셜 |
| fish | 어항 | 5 | 물고기(7) | 스페셜 |
| reptile | 사육장 | 5 | 파충류(7) | 스페셜 |
| dinosaur | 공룡둥지 | 5 | 공룡(7) | 화석10개 |

### 퀘스트 (game.js)
- 6개 동시 + 스페셜 1개 (7번째 슬롯), 10분 타이머
- 보상: easy 20% 저금통 > Lv.3+ 30% 카드 > 나머지 코인
- 난이도: minLv=5 고정, maxLvAnimal=min(7+floor(lv/10),11), QUEST_LEVEL_WEIGHTS 가중치
- 스페셜: bird>fish>reptile 순환, 300코인, 타이머 없음

### 상점 (systems.js)
5분 갱신. 1번=광고 cat/dog Lv.6, 2~3번=랜덤(lv*2 다이아), 4번=카드팩15장(15다이아), 5번=다이아팩5개(500코인)

### 저금통
easy 퀘스트 20% 확률 스폰. 100~200코인, 1시간 대기 후 터치 개봉. 광고 시청=즉시+2배.

### 버블 아이템 (v4.30.0)
합성 Lv.4+ 시 5% 스폰 (스페셜타입 제외). 3분 제한. 광고(무료) 또는 다이아(lv*10) 획득.

---

## 앨범 (album.js, 17개 함수)
- 9테마 x 9장 = 81장. N(6장,72%)/R(2장,20%)/SR(1장,8%)
- 카드15장 > 뽑기3장 > 중복 시 카드 반환(N:1,R:3,SR:8)
- 테마 완성=500코인, 전체 완성=500다이아+리셋
- 42일 주기 자동 초기화

---

## 주사위 여행 (systems.js, 8개 함수)
- 합성 시 5% 주사위 드랍 > 50칸 보드 > 완주=500코인+20다이아+즉시 리셋
- 칸 보상: 구간별 점진 증가 (코인/에너지/카드/다이아)

---

## 레이스 (race.js, 32개 함수)
- 영구 6자리 코드, 퀘스트 10개 먼저 완료하는 1:1 경쟁
- 초대(10분만료) > 수락 > 레이스(1시간) > 결과
- 보상: 승리 150코인+5다이아, 패배 30코인, 무승부 80코인+3다이아
- Firestore Transaction으로 수락/거절 atomic 처리
- 최근 상대 3명 퀵 조인

---

## 스토리 (story.js, 20개 함수)
- 모모타로 차용. 24장 이미지(EP.1~7), 레벨 기반 해제
- 보스 = 보드 아이템 {type:'boss', bossId:N}, HP=500*EP번호
- 합성 시 모든 보스에 데미지(합성레벨=dmg)
- EP별: 3~5장 이미지 + 보스 1마리, Lv.5~120 구간
- 갤러리 모달: EP별 그룹핑, 해제 이미지 슬라이드쇼 재감상

---

## 탐험 (systems.js, 11개 함수)
- 7x7 안개 맵, 코인으로 타일 개방 (200+n*50코인)
- 49칸 고정 보상 + 화석 10종 수집
- 마일스톤: 3개(200코인+10다이아) > 5개 > 7개 > 10개(2000코인+200다이아+공룡생성기)
- 화석 10개 완료 시 자동 리셋 (반복 플레이)
- Lv.10 해제

---

## 사운드 (sound.js, 9개 함수)
Web Audio API 합성음 17종 + BGM (C 펜타토닉 뮤직박스). iOS 첫 터치 unlock.
카테고리: UI(click) / Action(spawn,merge,dice_roll) / Purchase(purchase) / Reward(quest_complete,milestone,levelup,daily_bonus,piggy_open,lucky,dice_drop) / Album(album_draw,theme_complete) / Race(race_start,race_win,race_lose) / Error(error)

---

## 튜토리얼 (tutorial.js, 10개 함수)
새 유저 4스텝: 캣타워 터치 > 한번더 > 드래그 합성 > 퀘스트 완료. 스포트라이트+말풍선. 비타겟 클릭 차단.

---

## 일일 미션
3단계 시스템: 1단계(15/30/150) > 2단계(40/80/400) > 3단계(80/150/800). 올클리어=5다이아+3카드. KST 자정 리셋.

## 출석 보상
D1:10다이아 > D2:20코인 > D3:5카드 > D4:30다이아 > D5:50코인 > D6:10카드 > D7:100다이아. 놓치면 D1 리셋.

---

## 합성 콤보 (v4.37.0)
3초 이내 연속 합성. 2~4=주황, 5~9=빨강+보드글로우, 10+=금색+보드글로우. 피치 상승(최대1.8). 세션 전용(세이브X).

---

## 주요 함수 목록

### game.js (43개)
`addCoins`, `spawnPiggyBank`, `discoverItem`, `countEasyQuests`, `generateNewQuest`, `generateSpecialQuest`, `trySpawnSpecialGenerator`, `removeQuestItems`, `handleLevelUp`, `completeQuest`, `checkExpiredQuests`, `formatQuestTimer`, `spawnItem`, `spawnToy`, `handleCellClick`, `handleLockedCell`, `handleMissionCell`, `handleSpecialItem`, `triggerGen`, `openCooldownPopup`, `confirmCooldownReset`, `getEnergyPrice`, `checkEnergyAfterUse`, `openEnergyPopup`, `closeEnergyPopup`, `buyEnergy`, `getActiveTypes`, `checkToyGeneratorUnlock`, `moveItem`, `tryMergeItems`, `updateBossIdx`, `checkDailyReset`, `addDailyProgress`, `checkDailyMissionComplete`, `claimDailyBonus`, `spawnBubble`, `showBubblePopup`, `openBubbleByAd`, `openBubbleByDiamond`, `adEnergy`, `openAdPopup`, `confirmAd`, `checkDailyBonus`

### systems.js (31개)
`hasItemOfType`, `hasItemOfTypeAndLevel`, `getMaxLevelOfType`, `checkAutoCompleteMissions`, `startShopTimer`, `refreshShop`, `generateRandomShopItem`, `renderShop`, `buyShopItem`, `askSellItem`, `tryDropDice`, `useDice`, `rollDice`, `executeMove`, `closeDiceRollPopup`, `giveStepRewardWithInfo`, `completeTrip`, `updateDiceTripUI`, `renderDiceTripBoard`, `isExplorable`, `exploreTile`, `checkExploreMilestone`, `resetExplore`, `spawnDinoGenerator`, `trySpawnPendingDinoGen`, `getExploreTitle`, `updateExploreUI`, `renderExploreMinimap`, `openExploreModal`, `renderExploreModal`, `closeExploreModal`

### ui.js (39개)
`renderGrid`, `createItem`, `updateAll`, `updateUI`, `updateLevelupProgressUI`, `updateTimerUI`, `updateQuestUI`, `spawnParticles`, `spawnItemEffect`, `showLuckyEffect`, `showFloatText`, `screenShake`, `flyRewardToStatusBar`, `spawnLevelupConfetti`, `showError`, `showToast`, `showMilestonePopup`, `openOverlay`, `closeOverlay`, `openSettings`, `closeSettings`, `formatTime`, `updateEnergyPopupTimer`, `handleDragStart`, `handleDragMove`, `handleDragEnd`, `openGuideForItem`, `openGuide`, `closeModal`, `switchGuideTab`, `renderGuideList`, `getGenSpawnLevels`, `getSnackSpawnLevels`, `renderSpawnPreview`, `updateUpgradeUI`, `upgradeGenerator`, `toggleBottomTab`, `updateBottomBadges`, `updateDailyMissionUI`

### race.js (32개)
`generateRaceCode`, `getOrCreateMyCode`, `findActiveRace`, `joinRaceByCode`, `findActiveOrPendingRace`, `copyRaceCode`, `startRaceListener`, `stopRaceListener`, `updateRaceProgress`, `checkRaceWinner`, `checkRaceTimeout`, `showRaceResult`, `claimRaceReward`, `addRecentOpponent`, `updateRaceUI`, `updateRaceUIFromData`, `openRaceJoinPopup`, `quickJoinRace`, `submitRaceCode`, `validateCurrentRace`, `startPlayer2Listener`, `stopPlayer2Listener`, `showRaceInvitePopup`, `closeRaceInvitePopup`, `startInviteTimer`, `stopInviteTimer`, `acceptRaceInvite`, `declineRaceInvite`, `cancelPendingInvite`, `expireInvite`, `updatePendingInviteUI`, `initRace`

### album.js (17개)
`getThemeCollectedCount`, `getRandomPhoto`, `processDrawResult`, `drawPhotos`, `openPhotoDraw`, `closePhotoDraw`, `checkAlbumReset`, `openAlbum`, `closeAlbum`, `renderAlbumTabs`, `switchAlbumTheme`, `renderAlbumGrid`, `checkThemeComplete`, `checkAlbumAllComplete`, `getAlbumProgress`, `formatAlbumTimer`, `updateAlbumBarUI`

### story.js (20개)
`getBossHpColor`, `getNextStoryImage`, `checkStoryQuests`, `activateImageQuest`, `completeImageQuest`, `spawnBossOnBoard`, `trySpawnPendingBoss`, `dealBoardBossDamage`, `defeatBoardBoss`, `createBossItem`, `showBossInfoPopup`, `closeBossInfoPopup`, `showStoryPopup`, `showStorySlide`, `advanceStorySlide`, `closeStoryPopup`, `openStoryGallery`, `renderStoryGallery`, `viewStoryImage`, `updateStoryUI`

### sound.js (9개), tutorial.js (10개), main.js (8개)
(함수명은 상단 각 섹션 참고)

---

## 상수 (constants.js)

### 핵심 상수
```
GRID_COLS=5, GRID_ROWS=7, BOARD_SIZE=35, STORAGE_SIZE=5, SHOP_SIZE=5
MAX_ENERGY=100, RECOVERY_SEC=30, SHOP_REFRESH_MS=300000
UNLOCK_COST_BOARD=100, SNACK_CHANCE=0.08, AD_ENERGY_AMOUNT=30
PIGGY_BANK_TIMER_MS=3600000, PIGGY_BANK_MIN/MAX_COINS=100/200
DICE_TRIP_SIZE=50, DICE_DROP_CHANCE=0.03
BUBBLE_MIN_LEVEL=4, BUBBLE_CHANCE=0.05, BUBBLE_EXPIRE_MS=180000, BUBBLE_DIAMOND_PER_LEVEL=10
STORY_UNLOCK_LEVEL=5, STORY_BOSS_HP_BASE=500
CAGE_UPGRADE_COST=1000, CAGE_MAX_LEVEL=5
SPECIAL_UPGRADE_COST=1500, SPECIAL_COOLDOWNS=[300000,240000,180000,120000,60000]
GENERATOR_MAX_CLICKS=6, GENERATOR_COOLDOWN_MS=60000
COOLDOWN_COIN_PER_SEC=5, COMBO_WINDOW_MS=3000
EXPLORE_MAP_SIZE=7, EXPLORE_TILE_COUNT=49, EXPLORE_UNLOCK_LEVEL=10
EXPLORE_BASE_COST=200, EXPLORE_COST_INCREMENT=50
QUEST_LEVEL_WEIGHTS=[100,100,100,75,55,40,28,15,8,4,2]
LUCKY_BASE_CHANCE=0.05, LUCKY_LEVEL_BONUS=0.01
```

### 데이터 배열
CATS(11), DOGS(11), BIRDS(7), FISH(7), REPTILES(7), DINOSAURS(7), CAT_SNACKS(5), DOG_SNACKS(5), CAT_TOYS(5), DOG_TOYS(5), ALBUM_THEMES(9x9), DAILY_MISSIONS(3단계x3개), ATTENDANCE_REWARDS(7일), DICE_TRIP_REWARDS(50칸), EXPLORE_FOSSILS(10종), EXPLORE_MILESTONES(4단계), EXPLORE_MAP(49칸), STORY_IMAGES(24항목), GENERATOR_NAMES, NPC_AVATARS

### 헬퍼 함수 (14개)
`getItemList`, `getMaxLevel`, `getItemData`, `getDisplayName`, `formatMinSec`, `getSpecialCooldown`, `getLevelUpGoal`, `getLevelUpReward`, `getKSTDateString`, `getMsUntilKSTMidnight`, `getGeneratorName`, `getExploreCost`, `getExploreAdjacentTiles`, `weightedAnimalLevel`

---

## 배포

```bash
npm run lint          # ESLint
npm test              # Vitest (86개)
git push              # GitHub Pages 자동 배포, pre-commit hook 실행
firebase deploy --only hosting           # 인증 핸들러
firebase deploy --only firestore:rules   # 보안 규칙
```

---

## 트러블슈팅

| 증상 | 해결 |
|------|------|
| 로그인 404 | `firebase deploy --only hosting` |
| 다중기기 로그아웃 안됨 | `startSessionListener()` 확인 |
| 데이터 손실 | v4.2.8 3중 방어 체계 |
| 스토리 퀘스트 안나옴 | v4.31.2 isStory 체크+desync 복구 |
| 주사위 스크롤 안됨 | v4.36.1 scrollIntoView+setTimeout |
| 멀티디바이스 보상 중복 | v4.37.1 3중 방어: signOut시 localStorage삭제+savedSessionId+즉시저장 |

---

## 최근 변경 이력

### v4.37.1 (2026-02-24) - 멀티디바이스 보상 중복 방지
- 방어1(auth.js): signOut시 cloudLoaded=false + localStorage 삭제
- 방어2(save.js): savedSessionId 필드 + loadFromCloud 세션 검증
- 방어3(main.js): compensation 직후 await saveGameNow()

### v4.37.0 (2026-02-24) - 합성 콤보 이펙트
- 3초 이내 연속 합성 콤보 (2~4주황, 5~9빨강+글로우, 10+금색+글로우)
- playSound pitch 파라미터 확장, merge 피치 상승
- 스페셜 생성기 업그레이드 시 쿨다운 클램핑 버그 수정
- 상점 아이템 이미지 크기 확대

### v4.36.0~v4.36.2 (2026-02-24) - 퀘스트 밸런싱 + UI개선
- minLv 고정5, maxLvAnimal=7+floor(lv/10), QUEST_LEVEL_WEIGHTS 가중치
- 주사위 스크롤 버그 수정 (scrollIntoView)
- 생성기 업그레이드 미리보기 간식 표시 추가

### v4.35.0~v4.35.3 (2026-02-23) - 이펙트+탐험리셋
- 합성 타격감(merge-punch, screenShake, 레벨별 파티클)
- flyRewardToStatusBar 32곳 적용
- 탐험 화석10개 완료시 자동 리셋

### v4.34.0~v4.34.1 (2026-02-23) - 탐험지도+공룡
- 기부 제거 > 7x7 탐험 지도 교체
- 화석 10종 + 마일스톤 4단계 + 공룡 생성기
- DINOSAURS 7레벨 (아기공룡~티라노)

---

## To-do
- [ ] 스토리 EP.8+ 추가
- [ ] NPC 아바타 이미지 교체 (10종)
- [ ] 앨범 테마 아이콘 이미지 교체 (9종)
