# REVEL · v0.17.0 — animation whip, coup de grâce, realm dressing

Second wave of the reference-driven overhaul (bar: **Devil May Cry 5**, **God of War Ragnarök**, **Elden Ring**). Everything from RUIN v0.16 remains: **49 executions, 24 powers, 4 modes**, Midget Fiends, Ashen Dominion, Rend/Rupture, the encounter director, independent free-look.

## What's new

### 1. Whip-timed combat animation (DMC5 gap)
- Every player attack now rides **`whipTime`**, an anticipation/snap timing curve with three guarantees: start and end clocks exact, the **contact clock exact** (hit evaluation never desyncs from visuals), and monotone time. Windups breathe, strikes arrive as a snap, recovery snaps out then settles.
- Same treatment on enemy strikes (casters keep their release-scaled sampling), and the boss sweep animation already shipped staged curves.
- **Deterministic per-step variance**: a rig-seeded, step-keyed micro-offset (±0.04 rad torso / ±0.018 neck, fade-out during recovery) so chained swings never look copy-pasted — fully reproducible and test-stable.
- Guarded: dodge, fire dash, guard, charge, get-up, tether, enemy step and ascend keep linear timing; executions bypass the whip layer entirely (their choreography owns time).

### 2. Coup de grâce kills (Ragnarök gap)
- Lethal blows that arrived with real force (recent accumulated knock ≥ 6, or any **Rupture**) now **fling the body**: directional shove plus a mass-capped vertical arc, inheriting constraint-body history for violent kills.
- Measured honestly: a rupture-kill corpse travels **≈2.0 world units in-flight** vs ≈0.21 for a light tap kill (9.4×), verified in `tests/revel-runtime.mjs`.
- Burn/DoT kills and ordinary taps keep the old grounded collapse; bosses get a restrained version; executions keep their own scripted releases.

### 3. Realm dressing (Elden Ring gap)
- **42 candle flames** through the cathedral and paths (small wax stacks with living emissive flames that join the flicker system), **hanging chain cages** with violet relic lights over the arena, **ossuary scatter** (skull/fragment piles out of the gameplay lanes), **ember seam inlays** echoing the realm's crack motif, wayfaring braziers and additional dead trees.
- Decorations merge into the existing material-batched statics (no draw-call explosion), and the dressing pass runs on a **private deterministic PRNG** so the gameplay `rr()` stream stays bit-identical to v0.15/v0.16 — staging, spawns and audits reproduce exactly.

### 4. Process findings that protect quality
- The execution grip audit (`ashen-dominion` grip residual) measures 0.055–0.165 across sessions **even on identical v0.16 code** — the values are session-seeded (recoil/side random streams in non-execution paths), not regressions. Suite tolerance remains < 0.2, all 49 pass; recording this on the progress board so nobody "fixes" a phantom.

## Play
`HELLBOUND.html` (1,530,609 bytes, fully offline). Hub: progress server **HELLBOUND · Live Progress & Game** → `/game`. Controls unchanged; **K** group drill in Training.

## Validation this wave
| Check | Result |
|---|---|
| whipTime contract (endpoints, contact clock, monotone, anticipation<linear, snap, settle) — 6 impact clocks | revel-unit PASS |
| Coup travel 2.00 vs tap 0.21; whip preserves 3× stance-cancel cadence; 49 catalog + 24 wheel | revel-runtime PASS |
| Melee unit suite (windows, dedup, wall block, Rend, director ≤2, fairness 10/10) | ruin-unit PASS |
| Rupture, training parry, K-drill, boss sweep, drill coherence | ruin-runtime PASS |
| Native movement engine (bounded first step, stop 0.229, reverse turn 0.158 rad) | kinetic-handling PASS |
| 49 executions complete; zero core overlap; grips ≤ 0.165 (session-seeded, ≤0.2 gate) | onslaught-audit PASS |
| 49 monotonic timelines; ankle-hold physics continuity | dread-contracts PASS |
| Stance chain, aerial→enemy-step, **all 24** wheel/Q releases incl. overcast states | revenant-combat PASS |
| Four modes live; dressing stats: 42 fires, 70 obstacles | ruin-integration PASS (re-run pre-ship after restore) |
| Offline standalone file:// — 0 outbound requests, 24 powers, no dev API | revenant-standalone PASS |

## Explicit remaining limits
- Procedural anatomy vs authored characters remains the widest gap to DMC5/Ragnarök.
- The whip is a timing layer over curve clips, not motion-matching; transitions still differ from mocap-driven games.
- Dressing adds life but the world is still a compact 4-district realm, not Elden Ring scale.
- Software-GL profile numbers from RUIN stand; no real-hardware fps claim.
