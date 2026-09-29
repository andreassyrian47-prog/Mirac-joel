# RUIN · v0.16.0 — combat reforge

RUIN aims at one bar: the way **Devil May Cry 5**, **God of War Ragnarök** and **Elden Ring** make attacks legible, hits consequential and groups survivable. These games are used as visual/gameplay references. HELLBOUND remains a procedural browser prototype and does **not** match their authored assets — limits are listed at the bottom.

Everything from Dread v0.15 is preserved: **49 executions, 24 powers, 4 modes, Midget Fiends, Ashen Dominion**, independent free‑look and the original Soulbreaker.

## What changed

### Melee resolution — attacks now have anatomy

- **Bounded active hit windows.** Damage is evaluated across the impact interval of each swing, not at a single instant. A slow camera or a fast enemy can no longer produce phantom hits or phantom misses around one frame.
- **Per‑target, per‑swing registration.** Each swing can strike an enemy at most once; no double‑counting inside one arc (unit + runtime verified).
- **Honest range, facing and cover.** Forward attacks require the target to lie inside the swing sector and reach; walls between actor and target block the hit; hits behind the back are refused.
- **Windup steering, not magnetism.** The demon may rotate to track during the preparation of an attack — with a capped angular rate and never once the strike is committed.
- **Contact‑confirmed cancels.** The Perfect Link window still exists, but queued cancels only pay out after actual contact; early whiffed inputs expire instead of converting into free damage frames.

### The Rend system — light builds, heavy cashes

- Light and aerial hits apply **Rend marks** (max 3, decay after 5s). Three marks open the target's guard: a heavy blow **ruptures** — bonus damage, heavy poise damage, a Flow pip and wrath.
- Rupture state is visible: cracked marks on the chest, an amber bar tint, and the TARGET readout (`REND ◆◆◇`, `REND READY · HEAVY TO RUPTURE`).
- Bosses take extra damage during their recovery stages, rewarding reads over spam.

### Encounter direction — the fight stops mobbing you

- An **attack‑slot director** reserves the right to attack: at most 2 concurrent melee actors against ordinary squads, 1 while a boss lives. Slots rotate to the most engaged‑but‑idle attacker, so pressure stays fair and continuous instead of piling on.
- Unengaged enemies hold **orbit spacing** and flank rather than conga‑lining into the attack cone.
- Enemy strikes **commit at release**: the direction of a swing locks when it begins, so evasion and parry mean something (exception: bosses steer a little during windup).
- Midget Fiend animation now uses its own 0.60s windup / 0.65s recovery constants — the motion clip no longer desyncs from the smaller timings.
- Bosses gain an **amber sweep** (double‑swept in Phase II) with a distinct telegraph, and the boss HUD explicitly signals **PUNISH WINDOW · +18% DAMAGE** during recovery.

### Training & readability

- **K · Combat Drill**: three durable opponents with AI on — isolated parry/rupture/spacing practice, still immortal, still resettable.
- Training no longer skips defensive logic: parry, guard and perfect‑parry now work in the arena.
- Power wheel shows **READY / NEED n WRATH / RECOVERING t s** per slot, and dims unavailable powers.
- New **TARGET** strip under the boss bar surfaces Will Broken / Rend state for whoever you're actually fighting.

### Presentation

- Full menu redesign: left‑column hierarchy, numbered hunts, quieter header in game, larger serif identity.
- Combat HUD de‑crowded: mode/banner/radar/stacked status rows separated, banner softened, redundant corner cards dimmed.
- **Camera‑side fill light** keyed to the character so the silhouette stays readable against the ash sky without flattening the scene.
- Curved horn/claw geometry replaces faceted cone chains (all 20+ horn sites updated in place).
- AI‑generated **ashen basalt** surface texture (albedo + bump) embedded into the stone family offline — the temple floor reads as rock, not flat plastic. All assets ship inside the single file; zero network requests.
- Fixed a stale queue edge where an expired buffered input could fire a swing long after contact recovery ended.

## Play

Open **HELLBOUND.html** (self‑contained) or visit the live preview. Same controls as v0.15, plus **K** in Training. `FINISHERS.md` lists all 49 executions; `POWERS.md` lists all 24 powers.

## Validation this wave

| Check | Result |
|---|---|
| Bounded hit window, single hit/target, facing, obstacle blocking | ruin-unit PASS |
| Encounter director: ≤2 concurrent reservations, all 10 eligible actors granted over time | ruin-unit PASS |
| Rend → Rupture, training parry, K‑drill, boss amber sweep | ruin-runtime PASS |
| Native movement: first‑step bounded, run/walk/sprint targets, 0.229 stop, 0.158 rad reverse turn | kinetic-handling PASS |
| 24 native R‑wheel/Q releases + stance cancel chain + enemy step | revenant-combat PASS |
| All 49 execution previews complete; zero core overlap; worst fully‑weighted grip residual 0.0567 units | onslaught-audit PASS |
| 49 monotonic timelines / ankle hold / physics release continuity | dread-contracts PASS |
| Four modes live, small execution, grimoire routing, menu reset | ruin-integration PASS |
| Offline standalone (file://): 0 outbound requests, 24 powers, no dev API | revenant-standalone PASS |
| Fixed‑step frame study (prowl / run / brake / Soulbreaker) | ruin-motion.webm |

Profile note: synchronous headless SwiftShader (software GL) renders at 720×450 measured ≈7.7–57.8 ms/frame (low, 409 draws / 365k tris) and ≈18.5–19.8 ms post‑warmup (balanced, 813 draws / 586k tris). One earlier stress‑run browser crash motivated the fixed quality alloc in `ruinRenderProfile`; these numbers are **environment‑specific draw costs, not end‑user FPS and not a commercial benchmark**.

## Explicit limits (not fixed in this wave)

- Characters are procedural builds of primitives with authored motion curves — they do not approach DMC5/Ragnarök authored anatomy, facial animation or skin shading. That remains the largest gap.
- Arena architecture variety, lighting art direction and decal/血 tooling are far below Elden Ring's world craft.
- Lightweight constraint ragdolls, not full rigid‑body; gore is stylized; audio is synthesized.
- No multiplayer, no campaign save, desktop‑only, WebGL required.
- "Commercial parity" is **not** claimed for this build; the comparison bar on the progress page stays open.
