# REVENANT · v0.11.0
## HELLBOUND — The Ashen Wake

The focus of this update is paired-body alignment, less floaty impacts, more expressive combat and a doubled execution roster—not just a larger selection menu.

## Start here

Open **HELLBOUND.html**, or use the live Revenant preview. In **Training Arena**, press **V** to browse and preview every move. **T** spawns an execution-ready revenant, **Y** an eligible boss, **U** a durable sparring target, **H** toggles enemy AI and **J** refreshes resources. Equip a move, return to play and press **E** near its eligible target. Hold **R** to select a power, release R to equip, and press **Q** to cast.

The normal eligibility thresholds remain ≤60% health or broken will; bosses require ≤20%. A boss-sized standard preview does not change the live boss-exclusive execution pool. Entry may take a short additional alignment interval or be refused if the planner finds no safe stage.

## 1. Animation, alignment and physics

### Paired bodies

- Added oriented chest, abdomen, hip and head collision proxies, separating the solid cores rather than letting hand IK pull the demon through the victim.
- Corrected rear chest contacts that previously used the front surface. Original **Soulbreaker** retains its chest punch → rear dash → lift → ground slam.
- Grave Driver now solves the carried victim's orientation around the held ankle instead of repeatedly pushing the player away from a victim that follows the same hand. This removes a feedback loop that produced large root jumps.
- Revised Meteor Burial's catch, Crown of Ruin's crouch/contact timing, Pale Requiem's approach and recovery path, Hellmouth's late kneel, and the two new boss hammer/coronation releases.
- Body-separation correction decays into recovery at a bounded rate. New paired pose/root tracks and rebuilt execution footprints are included.
- **Cinder Spiral and Throne of Cinders still maintain their ankle grip during the fire-ring drag.** The victim moves with the hand rather than merely orbiting independently.

### Motion and falls

- Original standard executions are generally 18% shorter; original boss sequences 16% shorter; the sustained fire drag 14% shorter. Anticipation remains, while the payoff arrives sooner.
- Cinematic victims enter constrained physics slightly before the final impact beat, with stronger downward impulses, gravity and inherited movement.
- Recoverable knockdowns, ground follow-ups, corpse impulses, wall impacts, get-ups and a player-death ragdoll are retained or extended.
- Enlarged locomotion and recoil motion, alternating opponent strikes and upper/lower-body counter-rotation replace some repeated symmetrical motion.
- Added rounded armor layers and facial detail, smoother primitive surfaces and procedural material texture. These are revised procedural models, not imported sculpted character assets.
- New spectral executions animate their summoned attackers through staggered attacks. Dragon’s Wake has a mouth-to-victim flame connection; several psychic moves gain visible force tethers.

## 2. Deeper melee

### Stances — Z

| Stance | Role | Speed | Damage | Will pressure |
|---|---|---:|---:|---:|
| Reaver | Quick claws and launch routes | 1.18× | 0.88× | 0.90× |
| Breaker | Heavier blows and Marrow Crusher | 0.90× | 1.20× | 1.45× |
| Wraith | Spectral Veil Rend and repositioning | 1.05× | 1.00× | 1.00× |

Contextual combo finishers still take priority when applicable. Switching stance **just after an attack connects** costs 8 wrath, cancels recovery and builds Flow. A neutral stance switch does not award free Flow.

### Reactive defense

- **F after contact:** spend 6 wrath to cancel melee recovery into a parry. This cannot skip your attack's pre-contact startup.
- **Hold F:** after the parry window, guard frontal hits using wrath. Rear and crimson attacks bypass ordinary guard.
- **Hold F + RMB:** Rampart Breaker pressures an elite's guard and opens a punish window when it breaks.
- Elite wardens have a frontal guard meter; light attacks are reduced while it is raised. Break guard, attack during recovery, or change your angle instead of repeating light attacks into it.
- Stalkers can evade, and enemy attack tracking stops late in the windup so movement and timing can matter.

### Aerial routes and Flow

- **Launcher → light → Space:** Enemy Step cancels a post-contact aerial attack, refreshes the aerial route and costs 8 wrath. At most two resets per foe before landing.
- Perfect defense, precise links, guard breaks and successful stance cancels build **three Flow pips**. They expire after seven seconds without a gain.
- **N at three pips:** Flow Reversal consumes the meter for a protected area counter with knockback and launch.

### Preserved routes

- L → L → RMB: Reaping Circle.
- L → L → L → RMB: Judgement Heel.
- Reaver heavy → aerial light → heavy: launcher, juggle, slam.
- A/D + RMB: sweep into live knockdown; heavy on a downed target: ground strike.
- S + RMB → RMB: Hook and Haul into Crushing Knee.
- Hold/release RMB: charged World Breaker.
- Space → light or C → light: closing routes.
- A precisely queued post-contact attack: Perfect Link.
- Melee hit → Q: Spellweave, reducing wrath cost by 25%.
- Release a fire, psychic and spectral spell within the refreshing 18-second window, then commit a heavy: Triune Convergence.

Try: **Reaver light → timed Z → Breaker light → timed Z → Wraith light → timed Z → N**. Then practice a launch → aerial strike → Enemy Step route. Training's unlimited resources are useful for learning, but Survival enforces the costs.

## 3. Nine new powers — 24 total

| New power | Purpose |
|---|---|
| Cinder Chains | Snare and burn; bosses receive a shorter root |
| Scorch Mine | Arms ahead of you, then detonates on nearby enemies |
| Hellfire Bastion | Temporary damage absorption and close-range retaliation |
| Phoenix Dive | Fast advancing aerial fire attack with a timed landing hit |
| Vector Thrust | Directional psychic push and wall-pressure tool |
| Neural Chain | Jumping psychic damage across multiple enemies |
| Gravity Loom | Group launch, suspension and drop |
| Soul Anchor | Mark a target; the next melee hit consumes it for bonus damage and healing |
| Reaper Guard | A temporary one-hit spectral interception and counter |

Every power supports **Shift + Q Overcast**. The wheel has 24 individual glyphs. Bastion absorption and Reaper counter time appear in the HUD. **[POWERS.md](POWERS.md)** contains the entire arsenal and base costs.

## 4. Double every finisher category

| Category | Previous | Revenant |
|---|---:|---:|
| Brutal | 5 | **10** |
| Pyromancy | 6 | **12** |
| Psychic | 5 | **10** |
| Spectral | 4 | **8** |
| Boss-exclusive | 3 | **6** |
| Total | 23 | **46** |

### The 23 additions

- **Brutal:** Ribsunder, Black Anvil, Spinewheel, Hornfall, Ruinmaker.
- **Pyromancy:** Crucible Hook, Dragon’s Wake, Ember Pendulum, Searing Brand, Ashfall, Hellmouth.
- **Psychic:** Vector Break, Neural Guillotine, Event Horizon, Oblivion Press, Thought Spear.
- **Spectral:** Widow’s Passage, Reaper’s Toll, Nightfall Covenant, Last Procession.
- **Boss:** Titan’s Reckoning, Sunless Coronation, World’s End.

**[FINISHERS.md](FINISHERS.md)** lists all 46, including their current durations, descriptions and named beats. Boss preferences and standard preferences remain separate, with independent no-repeat shuffle bags. Optional stylized gore can be disabled in **O → Settings**; disabling it also clears existing gore.

## 5. Inspiration and what was actually implemented

The official PlayStation combat discussion highlights anticipation, large follow-through arcs, exaggerated reactions, impactful sound and the value of chaining a player's arsenal. Those were useful references for the faster impact/recovery split, reaction poses and combat links here. [1](https://blog.playstation.com/2022/10/04/game-developers-explain-what-makes-god-of-war-2018s-combat-tick/)

Additional design references reviewed during development:

- GDC, Mihir Sheth, *Evolving God of War's Combat for a New Perspective*: https://www.gdcvault.com/play/mediaProxy.php?sid=1026423
- GDKeys, *Anatomy of an Attack*: https://gdkeys.com/keys-to-combat-design-1-anatomy-of-an-attack/
- GDQuest, *Juicing up your game attacks*: https://www.gdquest.com/library/juicy_attack/
- DMC5 advanced-technique discussion, a community/tutorial reference rather than Capcom documentation: https://samurai-gamers.com/devil-may-cry-5/advanced-combat-techniques-guide/

HELLBOUND's Enemy Step and contact-gated stance cancels are local implementations inspired by expressive action-combat routes. No commercial game animations, character models, engines or code were imported, and this is not an equivalent to those productions.

## 6. Validation and caveats

Current development checks include:

- **46 execution timelines at simulated 60 Hz:** finite anatomy/positions, completion and physical-body handoff; zero measured nonphysical core overlap in that sweep. The metric uses simplified torso/head/hip proxies, **not full mesh collision**. Physical corpses are excluded from it.
- Applying the same proxy metric to the preserved v0.10 build found overlap above 0.05 units in 21 of its 23 moves, with a maximum near 0.878. This is a diagnostic comparison, not a visual-quality score.
- Largest sampled per-frame actor-root step reduced from roughly 0.99 during the initial Revenant pass to roughly 0.42 world units after the carry/recovery fixes. This measures roots, not every joint, and fast supernatural moves remain intentional.
- **86 contact cases:** standard moves at both victim scales, plus six boss executions. Worst strong-contact residual approximately **0.196 units**, under the 0.2-unit test threshold. That is not perfect contact; the large boss-sized Infernal Pillar preview is the worst case.
- **94 staging cases:** accepted without entry teleporting; maximum sampled entry step approximately 0.175 units. Some required relocation. This is scenario coverage, not a proof that every map position is safe.
- Native stance-cancel → Flow route, aerial Enemy Step, all 24 normal releases and all 24 Overcast releases tested.
- Live elite guard break, Bastion absorption, Reaper interception, melee consumption of Soul Anchor, mine detonation and player-death ragdoll tested.
- All six bosses equipped through the catalog and executed using native E, with reward and persistence checks. Cinder Spiral and Throne of Cinders retained over 100 sampled strong ankle-grip frames each, with roughly 0.002-unit residual or less in that check.
- Knockdown/get-up, burn through knockdown, downed execution, hook/knee, held guard, Perfect Link, gore toggle/cleanup and preview restoration tested.
- Airborne death physics remained finite and settled; sampled maximum body constraint error approximately 0.0124 units. Swept wall response and Temporal Rift projectile slowdown passed.
- Four-mode UI/flow, free camera orbit, rifts, blessings, records and settings regression checks passed without captured page errors.
- Production v0.11.0 booted and passed the mode/catalog/wheel/stance UI check. The portable file also passed a `file://` startup and play check with **zero HTTP requests and zero captured page errors**.

Reports live in `tests/revenant-*-results.json`, `tests/contact-audit.json` and the current staging report. Tests are mostly deterministic browser simulation plus rendered frame inspection; they are **not a human play-test, a frame-rate benchmark, or evidence of flawless animation**.

### Remaining limits

The character silhouettes and materials are still stylized procedural work. Several finishers use related slam/ritual poses and shared effects. Arms, armor, horns, wings and physical corpses are not covered by exact all-mesh collision. Some camera angles can still hide contact, and some large-victim reaches are approximate. Ragdolls use a lightweight distance-constraint system rather than a full jointed rigid-body engine. Effects and player/enemy balance need broader play-testing. The four districts remain a contained arena-world; there is no story campaign, multiplayer or mobile-control layer.
