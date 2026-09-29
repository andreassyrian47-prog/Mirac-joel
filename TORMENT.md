# TORMENT · v0.19.0 — style consequence, chain executions, bestiary kits, living menu

Fourth wave of the reference-driven overhaul (bar: **Devil May Cry 5**, **God of War Ragnarök**, **Elden Ring**). Everything from RUIN v0.16, REVEL v0.17 and MALICE v0.18 remains: **49 executions, 24 powers, 4 modes**, whip-timed animation, coup de grâce, realm dressing, run-in blending, cast steering, impact dolly, realm hunts.

## What's new

### 1. Style Consequence (core gameplay — DMC5's meter that matters)
- The D→SSS style meter now **pays out**: souls from hits, kills and executions are multiplied by **1 + min(2, style/85)** (up to ×2.76 measured), ascension charge scales with it, and **rank-ups fire a ceremony** — on-screen rank card, ring burst and a rising tone.
- **Style Conduit** (powers): casting at B rank (style ≥ 80) refunds 25% of the wrath cost, 40% at SSS (≥160) — stylish play literally fuels the arsenal.
- Measured: identical opening strike **17 souls at D vs 45 souls** at S (×2.88 multiplier); conduit net spend **9 wrath** where 19.5 would be paid at D.

### 2. Chain Executions (finishers)
- After an execution lands, any other execution-ready foe within 6 units opens a **1.75s chain window** (HUD prompt: `CHAIN · KIND`). Pressing E bypasses the cooldown and launches a **chained execution at 1.7× pace** with a shortened alignment and the MALICE impact dolly.
- Chains break if you get hit; the target is the weakest ready foe.
- Measured: first execution impact at frame 156, chained impact at frame 86 (**45% faster**), both kills scripted and audited.

### 3. Bestiary Fidelity (models / enemies / bosses)
- Every enemy kind now wears a **distinct silhouette kit** (`buildKindKit`): ember eyes + rune scars on all foes; Revenant spine quills and shoulder spikes; Stalker hood mantle, crown horn and ragged cloth; Oracle halo, rune orbs and vestment strips; Warden tower pauldrons, helm horns, tasset and back banner; and the **Cinder King** gets a gold crown + five spikes, swept back-blades, a tattered cape and a **molten core** that flares crimson when he enrages.
- Measured kit costs: 7 / 8 / 9 / 10 / 20 meshes — all five kinds mechanically distinct (`tests/torment-runtime.mjs`).
- Process win: the evidence capture caught the enrage scale bug (`.setScalar(1.7)` inflated the core into a 3.4m orb) before it shipped.

### 4. Living Menu (menu)
- The main menu now sits over a **slow orbital camera** drifting around the dressed realm — candles, chains and the exile rendered live behind the UI.
- Header and menu copy carry the wave identity (`TORMENT UPDATE · V0.19.0`, chain-kill callout).

## Play
`HELLBOUND.html` (1,534,931 bytes, fully offline). Controls unchanged; chain prompt appears after executions when a victim is near.

## Validation this wave
| Check | Result |
|---|---|
| Style multiplier: styled 45 vs base 17 souls; rank S flagged with ceremony | torment-runtime PASS |
| Style Conduit: cast at style 100 nets 9 wrath spend + toast | torment-runtime PASS |
| Chain window opens after execution; chained impact 86 vs 156 frames | torment-runtime PASS |
| Bestiary kits 7/8/9/10/20, all distinct, king grandest | torment-runtime PASS |
| Menu version tag + orbital camera azimuth drift | torment-runtime PASS |
| Preservation: 49 executions + 24 powers | torment-runtime PASS |
| revel / ruin / malice runtime suites re-run | PASS |
| dread contracts, onslaught audit, kinetic handling, integration, dominion, revenant combat, unit suites | PASS |
| Offline standalone file:// — **0 outbound requests, 0 errors** (1,534,931 B) | offline-check PASS |

## Honest status
Parity with the reference games remains **NOT MET** — same-assistant critic (round 5): style now has teeth and the bestiary reads at silhouette level, but mesh/material fidelity, facial animation and environment art quantity remain the largest gaps. Logged on the progress board.
