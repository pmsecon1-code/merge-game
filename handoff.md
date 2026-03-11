# 멍냥 머지 게임 - Architecture (v4.37.3) [HTML5 동결]

## 개요
- **URL**: https://pmsecon1-code.github.io/merge-game/
- **버전**: 4.37.3 | **Firebase**: `merge-game-7cf5f`
- 동물을 합성하여 성장시키는 모바일 친화적 웹 게임
- **상태**: HTML5 코드베이스 동결 — Zoo Revival Unity 리빌드로 전환 (2026-02-25)

---

## 파일 구조

```
merge2/
├── index.html          # 메인 HTML
├── css/styles.css      # 모든 CSS
├── js/
│   ├── constants.js    # 상수+데이터+헬퍼+ICON
│   ├── state.js        # 전역 변수+DOM 참조
│   ├── auth.js         # 인증+세션+회원탈퇴
│   ├── save.js         # 저장/로드/검증/클램핑/진단
│   ├── game.js         # 코어 게임 메커닉
│   ├── systems.js      # 7행미션/주사위여행/상점/탐험
│   ├── album.js        # 앨범(사진수집)
│   ├── race.js         # 레이스(1:1경쟁)
│   ├── sound.js        # 사운드(효과음+BGM)
│   ├── story.js        # 스토리 이미지 갤러리
│   ├── tutorial.js     # 온보딩 튜토리얼 4스텝
│   ├── ui.js           # 렌더링/이펙트/드래그/도감/배지바/설정
│   └── main.js         # 초기화+타이머
├── hooks/pre-commit    # Git pre-commit (lint+test)
├── tests/              # Vitest 테스트
├── images/             # 게임 이미지 리소스
├── firestore.rules     # Firebase 보안 규칙
└── firebase.json       # Firebase Hosting+Firestore
```

**script 로드 순서**: constants > state > auth > save > game > systems > album > race > sound > story > ui > tutorial > main

---

## 핵심 흐름

- **저장**: 게임 액션 → `updateAll()` → `saveGame()` → localStorage(즉시, savedSessionId 포함) + Firestore(500ms 디바운스)
- **즉시저장**: 중요 액션 → `saveGameNow()`
- **로드**: 로그인 → `loadFromCloud()` → savedSessionId 세션 검증 → `applyGameData()` → `renderGrid()`
- **합성**: 드래그 → `tryMergeItems()` → 보스 데미지/콤보/버블 체크 → `updateAll()`
- **로그아웃**: signOut → cloudLoaded=false + localStorage 삭제 → 저장 차단
- **다른기기**: loadFromCloud() → savedSessionId 불일치 → 클라우드 우선

---

## 저장 데이터 구조

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
  // 세션
  savedSessionId,
  // 기타
  discoveredItems, currentSpecialIndex, firstEnergyRewardGiven, savedAt
}
```

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

## 시스템 요약

| 시스템 | 파일 | 핵심 |
|--------|------|------|
| 보드 | game.js | 5x7=35칸, 7행=미션칸, 생성기 7종(cat/dog/toy/bird/fish/reptile/dinosaur) |
| 퀘스트 | game.js | 6개+스페셜1, 10분 타이머, QUEST_LEVEL_WEIGHTS 가중치 |
| 상점 | systems.js | 5분 갱신, 5슬롯 (광고/랜덤/카드팩/다이아팩) |
| 저금통 | game.js | easy 퀘스트 20% 스폰, 1시간 대기, 100~200코인 |
| 버블 | game.js | 합성 Lv.4+ 시 5% 스폰, 3분 제한, 광고/다이아 획득 |
| 앨범 | album.js | 9테마x9장=81장, N/R/SR, 42일 주기 리셋 |
| 주사위 | systems.js | 합성 시 5% 드랍, 50칸 보드, 완주 리셋 |
| 레이스 | race.js | 6자리 코드, 퀘스트10개 1:1, Firestore Transaction |
| 스토리 | story.js | 24장 EP.1~7, 보스={type:'boss',bossId}, HP=500*EP |
| 탐험 | systems.js | 7x7 안개맵, 화석10종, 마일스톤4단계, 공룡생성기 해제 |
| 사운드 | sound.js | Web Audio API 합성음 17종 + BGM |
| 튜토리얼 | tutorial.js | 새 유저 4스텝, 스포트라이트+말풍선 |
| 일일미션 | game.js | 3단계(합성/생성/코인), KST 자정 리셋 |
| 출석 | game.js | 7일 연속 보상, 놓치면 D1 리셋 |
| 콤보 | game.js+ui.js | 3초 이내 연속 합성, 색상+글로우+피치 상승 |

---

## 배포

```bash
npm run lint          # ESLint
npm test              # Vitest
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
| 스페셜 생성기 중복 | v4.37.3 cleanupInactiveSpecialTypes() — 로드 시 + 퀘스트 완료 시 자동 정리 |

---

## 최근 변경 이력

### v4.37.3 (2026-03-11) - 스페셜 생성기 중복 버그 수정
- `cleanupInactiveSpecialTypes()` 함수 신설 (game.js) — 비활성 스페셜 타입(bird/fish/reptile) board/storage/shop에서 제거
- save.js `applyGameData()` 인라인 로직 → 함수 호출로 리팩토링 (중복 제거)
- `completeQuest()` 스페셜 완료 시 즉시 정리 호출 (다음 타입 전환 후 cleanup)
- eslint.config.js: `cleanupInactiveSpecialTypes` globals 등록
- 기존 유저: 앱 접속 시 applyGameData() 경로로 자동 정리

### Zoo Revival Phase 0.1 (2026-02-25) - 밸런스 데이터 추출
- `scripts/extract-balance.js`: constants.js → 7개 JSON (vm.runInContext 패턴 재활용)
- `balance-data/` 출력 폴더 .gitignore 추가, `package.json` extract-balance 스크립트 추가
- HTML5 코드베이스 동결 결정 — Zoo Revival Unity 리빌드 전환
- 다음 단계: Unity 프로젝트 세팅 + Merge2 코어 프로토타입

### v4.37.2 (2026-02-25) - Zoo Revival PRD 확정 + 코드 revert
- Zoo Revival: Merge & Build PRD v1.0 확정 (Obsidian: `1-Projects/merge2/zoo-revival-prd.md`)
- 이전 세션 변경분 revert: 에너지 리밸런싱(MAX=100→50, RECOVERY=30→150초), 배틀패스 시스템
- HTML5 코드베이스 v4.37.1 기준 유지 (Zoo Revival은 Cocos Creator 리빌드)
- 다음 단계: Unity 프로젝트 세팅 + Merge2 코어 프로토타입 (Phase 0)

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

---

## 기획/분석 노트

### Zoo Revival: Merge & Build PRD (2026-02-25, v1.4)
- **문서**: Obsidian `1-Projects/merge2/zoo-revival-prd.md`
- **핵심**: 망한 동물원 복원 타이쿤 + Merge2 하이브리드, US 시장 타겟
- **기술 결정**: **Cocos Creator** 리빌드 (TypeScript, 2D 특화, Merge 게임 레퍼런스 풍부)
- **타임라인**: Phase 0 Pre-Production(4주) → Phase 1 Cocos Creator MVP(20주) → Soft Launch → US 출시
- **KPI 목표**: D1 38%, D7 15%, ARPDAU $0.10-0.20, 월매출 $75K+
- **다음 단계**: ~~Windows 재시작 → Cocos Dashboard → Creator 3.8.x LTS → `Desktop/zoo-revival` 프로젝트 생성~~
- **다음 세션 (2026-02-26)**: Cocos Creator 열기 (MCP 자동 시작) → S2 — MainScene 생성 + BoardManager.ts 구현
- **현재 진행 (2026-02-27)**: S13까지 완료 — ZooManager + ZooUI (동물원 메타 시스템)

### Zoo Revival 진행 현황 (2026-02-27)

**완료: S1~S12** (git: 6fdca41)

| 스프린트 | 내용 | 상태 |
|---------|------|------|
| S1~S4 | 프로젝트 세팅, BoardManager, MergeLogic, GeneratorLogic, 스프라이트 | ✅ |
| S5 | QuestLogic + QuestManager + QuestUI (NPC 카드 3개) | ✅ |
| S6 | StorageUI + FloatText + Board↔Storage 크로스존 드래그 | ✅ |
| S7 | ShopLogic(시드RNG) + ShopManager + ShopUI (5카드) | ✅ |
| S8 | GeneratorPopup 자동부착 + 쿨다운/업그레이드 팝업 | ✅ |
| S9 | SaveLogic + SaveManager localStorage 연동 | ✅ |
| S10 | BottomNav(6탭) + ContentArea(탭토글) + UI 레이아웃 | ✅ |
| S11 | SaveLogic 단위 테스트 15개 | ✅ |
| S12 | DailyConfig + DailyMissionLogic + DailyMissionManager + DailyMissionUI | ✅ |
| S13 | ZooConfig + ZooLogic + ZooManager + ZooUI + BottomNav/ContentArea zoo탭 | ✅ |

**테스트**: 239개 (MergeLogic 29 + QuestLogic 43 + SaveLogic 15 + ShopLogic 21 + GeneratorLogic 35 + DailyMissionLogic 33 + ZooLogic 63)

**파일 구조 (zoo-revival)**:
```
assets/scripts/
├── core/   BoardManager, MergeLogic, GeneratorLogic, QuestLogic, ShopLogic, SaveLogic, DailyMissionLogic, ZooLogic
├── data/   BalanceConfig, QuestConfig, ShopConfig, DailyConfig, ZooConfig
├── managers/ GameManager, QuestManager, ShopManager, SaveManager, DailyMissionManager, ZooManager
├── ui/     BoardUI, CellRenderer, HUD, QuestUI, StorageUI, ShopUI, GeneratorPopup,
│           FloatText, Toast, BottomNav, ContentArea, ComboUI, DailyMissionUI, ZooUI
└── utils/  Constants, EventBus
tests/  MergeLogic, QuestLogic, ShopLogic, SaveLogic, GeneratorLogic, DailyMissionLogic, ZooLogic
```

**레이아웃 좌표** (Canvas 720×1280):
HUD(+605) → QuestUI(+510) → BoardUI(+65) → StorageUI(-232) → ContentArea(-330) → BottomNav(-435)

**다음 단계: S14 — 동물원 시설 + 보드→동물원 드래그 연동** (PRD Phase W5-8)
- 보드 아이템 → ZooManager.tryPlaceAnimal() 드래그 연동
- FacilitySlot 실제 시설 종류 구현
- 동물원 방문자 수 / 수입 UI 고도화

### 더블유게임즈 퍼블리싱 가정 상품성 분석 (2026-02-25)
- **문서**: Obsidian `1-Projects/merge2/더블유게임즈-퍼블리싱-분석.md`
- **핵심 결론**: Merge Studio(패션) + 멍냥 머지(동물) 듀얼 타이틀 전략 = Microfun의 Gossip Harbor + Seaside Escape 포트폴리오와 동일 접근
- **Build vs Buy**: 인수 후 리빌드 ★★★★☆ — 코드가 아닌 **14개 시스템 설계(GDD)**가 핵심 가치, 팍시 AI Lab Unity 리빌드 시 신작 대비 3~6개월 단축
- **상품성 재평가**: 1인 개발 6.5/10 → 더블유게임즈 퍼블리싱 **7.5/10**
- **상업화 조건**: 에너지 밸런스 강화(유료 압박), 다이아 소비처 확대(IAP), 아트 전면 교체(이모지→스파인), LiveOps 구축
