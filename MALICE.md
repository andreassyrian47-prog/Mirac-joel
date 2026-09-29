# MALICE · v0.18.0 — run-in blending, cast steering, impact dolly, realm hunts

Third wave of the reference-driven overhaul (bar: **Devil May Cry 5**, **God of War Ragnarök**, **Elden Ring**). Everything from RUIN v0.16 and REVEL v0.17 remains: **49 executions, 24 powers, 4 modes**, whip-timed animation, coup de grâce kills, realm dressing, Midget Fiends, Ashen Dominion, Rend/Rupture, the encounter director, independent free-look.

## What's new

### 1. Run-in attack blending (DMC5 gap)
- Attacks begun at speed now **arrive with momentum**: the whip layer samples the entry speed captured at the moment the attack is committed (`entrySpeed`, recorded before input velocity is zeroed) and converts it into a **hip drop, torso lean and step extension** that eases out across the swing.
- Weight = `clamp((entrySpeed-3.4)/4) · clamp(1 - u/(windup·0.9))` — stationary attacks are bit-identical to REVEL (weight 0), full sprints get the deepest dip.
- Measured: a rushed attack dips the hips **1.4092 vs 1.4385 idle** (−0.029), verified in `tests/malice-runtime.mjs`.

### 2. Spellweave cast steering (Ragnarök gap)
- Casts now store a live **`target` lock** and steer the caster's facing toward it through the windup (`steerAttack(a, player, dt, a.releaseAt)`), so a bolt released after a turn lands where the windup promised.
- Release still emits with a **facing snapshot** — the projectile is committed at release, not homing; dodges during flight remain valid defense.
- Measured: facing gap **1.107 rad → 0.000 rad** during the windup.

### 3. Execution impact dolly (all-three gap)
- The finisher camera gains a **punch pulse** at the impact: `punch = exp(−|clock − impact| · 10)` applied as an instantaneous **−3.2° FOV pinch** (post-damp, so it is not smoothed away by the release ramp) plus a **−5% distance dolly**.
- Measured at the impact frame: FOV digs to **45.66** against a 42.19→55.50 trajectory (interpolation 48.85) — a sharp, bounded ~3° punch that reads as a camera hit, not a zoom.
- Finishers keep their existing choreography; the pulse only layers on the dynamic camera path.

### 4. The realm hunts back (Elden Ring gap)
- Free Roam now runs **ambush events**: a `realmHuntPack()` spawn director drops a 4-strong hunting pack around the player on a timer, announced by the banner **"THE REALM HUNTS BACK"**.
- Measured: foes **3 → 7** on trigger; the pack reads as a coordinated rush, not scattered spawns.

## Play
`HELLBOUND.html` (1,531,570 bytes, fully offline). Hub: progress server **HELLBOUND · Live Progress & Game** → `/game`. Controls unchanged.

## Validation this wave
| Check | Result |
|---|---|
| Run-in blend: rushed hipsY < idle by >0.012 (measured −0.029) | malice-runtime PASS |
| Cast steering: yaw gap decreases ≥0.18 rad (measured 1.107→0.000) | malice-runtime PASS |
| Impact dolly: FOV digs ≥0.35 below trajectory interpolation (measured ~3.2) | malice-runtime PASS |
| Realm ambush: ≥3 foes added as a pack (measured 3→7) + banner | malice-runtime PASS |
| Preservation: 49 executions + 24 powers intact | malice-runtime PASS |
| whipTime contract, coup 2.00 vs tap 0.21, dressing 42 fires/70 obstacles | revel-unit/runtime PASS (re-run) |
| Melee units, rupture, parry, drill, boss sweep, kinetic handling | ruin suites PASS (re-run) |
| 49 executions zero-overlap audit, dread contract timelines | audit suites PASS (re-run) |
| Modes, stance cancels, aerial→enemy-step, all 24 releases | integration suites PASS (re-run) |
| Offline standalone file:// — **0 outbound requests, 0 errors** | offline-check PASS |

## Honest status
Parity with the reference games remains **NOT MET** — same-assistant critic (round 4): movement into combat now carries momentum and the camera punches at impacts, but character fidelity, facial/secondary animation and environment art quantity remain the largest gaps. Logged on the progress board.
