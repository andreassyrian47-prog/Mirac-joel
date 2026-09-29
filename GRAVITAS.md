# GRAVITAS · v0.20.0 — every kill has weight

Fifth wave of the reference-driven overhaul. This one touches a single system and touches all of it: **all 49 executions** (40 standard, 7 boss-exclusive, 2 Midget-exclusive) were re-animated in one pass against a **God of War Ragnarök** bar — heavy, grounded, held, close. Nothing was dropped and no move was favoured: every finisher received the same four layers.

## What's new

### 1. The GRAVITAS profile (`src/gravitas.js`)
One authored profile per execution: where its beats fall (`u`), what kind each is (`strike | slam | throw | pulse | grip | lift`), how heavy (mass), which direction and limb, what the victim is doing between beats (`stand | kneel | prone | air | carried | bound`), and what the kill implies for the body (`sever`). `applyGravitas(FINISHERS)` runs once at load and rewrites every def's `duration`, attaching `def.gravitas` (pre-impact budget, hold, rise, beats in wall seconds). Three consumers read it.

### 2. Timing warp — anticipation → snap → hit-stop dwell → recoil → hold → rise
- `executionTime` routes any def with `gravitas` through `gravitasTime`: a density warp sampled over 2400 points of `u`. Each beat gets a slow **anticipation** bell (heavier = longer), a fast **snap** into contact, a **dwell** parked just past contact (strike .07s · slam .09s · throw/pulse .05s · grip .025s, × mass) and a brief **recoil**.
- The kill beat is special: its anticipation sits *before* the physical hand-off, and the segment where the victim goes physical (`[impact-.14, impact]`) is a **fixed-length drop** (.20s / .26s boss / .17s small) at constant density so the ragdoll never slides into the actor.
- After the kill: a **held final pose** (.42s / .55s boss / .35s small), then a slow **rise** (.85s / 1.0s / .7s) while the camera lingers on the body (`execution-performance.js` settle).
- `impactWall(def)` is the exact wall-clock moment of the kill; `cinematic.js` and both contract suites key off it.
- New standard durations ≈ 3.5–5.4s (kill at ≈ 2.4–3.6s); bosses 6.3–8.8s. All 49 listed in `FINISHERS.md` as `duration (kill at wall)`.

### 3. Actor weight pass (`actorWeight`)
Per beat, additive on top of the authored pose (never on roots — the contact solver owns those): sink into the legs and open the chest against the blow (**anticipation**), hips and torso **drive through** with an **overshoot** past the pose, **head lag** that trails the torso by a few frames, chin-down on the target, a **breath** on the hold and an unhurried rise. Boss profiles are 1.1× heavier, Midget-exclusive .85×.

### 4. Victim performance (`victimPerformance`)
- Between beats a **struggle** whose *tone* drains with every hit (each beat costs 13% × mass, floor 30%): pushing off the grip, grabbing at the holding arm, buckling knees, kicking when carried or lifted, arched back when bound.
- **Hit reactions** per beat: head snaps in the beat's direction, chest caves on `down`/`crush`, shoulders fold on `side`.
- Tone fades to nothing across `[impact-.36, impact-.15]` so the hand-off to the constrained ragdoll at `releasePhase` is a limp body, not a fighting one.

### 5. Kill feel — hit-stop, slow-mo, gore
- **Hit-stop** at every strike contact is now a real freeze (`dt × .22` for .08–.09s; was ×.45).
- **Kill-beat slow motion**: the finishing blow sets `f.slow` (.32s / .42s boss / .18s chained) and the render loop runs at **0.25×** for that long. Applied only in `animate()` — the `advanceExecution` test hook stays undilated so audits keep their frame budgets.
- **Gore pushed further** (`gore.js`): 220 spray droplets (was 160), up to 56 per burst (was 36), 72 ground pools (was 48) that linger **50s** (was 35s), 14 severed parts alive at once, and new sever parts `arm0`, `leg`, `leg0` beside `head`/`arm`. Severs where the move implies them: Hell's Guillotine (head), Tyrant's Verdict (leg), Ruinmaker (left arm), Ashen Cross (arm), Reaper's Toll (head), plus the existing boss crown-break. Every kill also leaves a large impact wound-pool under the body.

### 6. Engine fix uncovered by the pass — `solveChain` pole singularity (`contacts.js`)
When the shoulder→wrist direction lined up with the elbow pole vector, the fallback pole `(1,0,0)` was **not orthogonalised** against the chain, so the elbow landed at the wrong radius and the palm missed a held grip by up to **0.41 m for one frame** (Ashen Dominion, `u≈.708`, pin hand). The old clock stepped over that `u` by luck; the dwell landed on it. The pole is now a continuous blend toward a secondary axis as it approaches the singularity, always re-projected perpendicular to the chain. This benefits every grip in the game, not just finishers.

Also fixed: `execution-performance.js` referenced `settle` before its declaration (TDZ crash under the new timing) — declaration moved above `elevation`.

## Validation this wave

Playwright's Chromium cannot be downloaded in this environment (all browser CDNs blocked, no system Chrome), so the browser suites were **not** re-run here. Instead a Node harness was built that drives the real director, choreography, contact solver, body-spacing and physics with stub rigs, mirroring `__hellbound.testing.advanceExecution` frame for frame, and asserts the same thresholds `tests/onslaught-audit.mjs` uses.

| Check | Result |
|---|---|
| `tests/gravitas-run.mjs` — 89 runs (49 moves × normal/boss/small variants): every run ends, kill lands on `impactWall` (error < 1e-8), timeline monotonic, ends at `u=1`, no NaN | **ALL PASS 89** |
| Same 89 with `GRAVITAS_OFF=1` (legacy timing, same solver) | ALL PASS 89 |
| Core overlap ≤ .04 · held-grip error ≤ .2 at weight > .99 · framing ≤ .94 (onslaught-audit thresholds) | max **0 / 0.15 / 0.90** |
| Root pop regression vs legacy (`maxRootStep` > 1.3× + .05) | **0 of 89 worse** (max .55 both) |
| `tests/ruin-unit.mjs`, `tests/revel-unit.mjs` | PASS |
| `npx vite build`, `npm run standalone` | OK — `HELLBOUND.html` regenerated |

Contract updates (intentional): `dread-contracts` / `predator-contracts` now assert the kill lands on `impactWall(def)` instead of the raw `impact × duration` clock, and the ankle-carry loop runs 360 frames (Grave Driver is longer now). `torment-runtime` expects the `GRAVITAS V0.20.0` tag. `tests/finishers-test.mjs` still snapshots a 23-move catalog from an earlier wave — that was already stale at 49 and is unrelated to this pass; re-baseline it in a browser-capable environment. `tests/artistry-verify.mjs` needs a Playwright-produced `.cache/artistry-master/audit.json` and could not run here.

## Files
- New: `src/gravitas.js`, `GRAVITAS.md`, `tests/gravitas-harness.mjs`, `tests/gravitas-harness-main.mjs`, `tests/gravitas-run.mjs`, `tests/gravitas-harness-results.json`.
- Changed: `src/finishers.js`, `src/execution-timing.js`, `src/execution-performance.js`, `src/cinematic.js`, `src/contacts.js`, `src/gore.js`, `src/main.js`, `index.html`, `package.json`, `README.md`, `FINISHERS.md`, `tests/dread-contracts.mjs`, `tests/predator-contracts.mjs`, `tests/torment-runtime.mjs`.

## Play
`HELLBOUND.html` (1,552,389 bytes, fully offline). **V** opens the Grimoire to preview every execution; the new hold and rise are best seen on the boss kills (Ashen Dominion, Throne of Cinders).
