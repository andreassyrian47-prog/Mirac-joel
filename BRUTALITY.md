# HELLBOUND — Brutality Update · v0.7.0

**Direction: agile movement, brutal finishers.** This is a combat, animation, physics, abilities, camera, audio-feedback, and impact-presentation overhaul of the existing procedural game. It is not a new campaign or a replacement world map.

## Finishers: contact, momentum, recovery

All 20 finishers remain, and all now use the revised cinematic/contact pipeline and a physical body handoff.

- Soulbreaker has a new continuous 3.6-second sequence: approach and chest punch → curved rear dash → loaded two-handed lift → ground slam → recovery. It no longer switches between the old separate animation branches.
- Per-finisher beat data drives pelvis loading, hip/shoulder rotation, hand closure, delayed head reactions, airborne leg motion, and impact compression.
- Reach correction moves the actor toward reachable grips before hand IK is applied. Selected victims brace against the demon's forearms during grabs.
- Facing changes blend instead of snapping; the side-biased camera makes body contact more visible instead of framing the backs of the wings.
- Ground-slam descents are timed to the impact beat. At release, recent world-space joint positions and velocities seed the body simulation, avoiding a reset to a generic dead pose.
- Bodies settle and limbs move after impact; the actor has a recovery phase instead of immediately snapping upright.
- Finisher choice, normal/boss previews, preview cancellation, reward totals, and the no-repeat cycle remain intact. See **FINISHERS.md** for all 20 names.

## Physical combat

- A bounded 15-particle position-based body simulation uses fixed 120 Hz substeps, body/bone-length constraints, limb reach limits, floor contact, damping, and collision against registered world cylinders.
- Normal deaths preserve some incoming momentum, including when an enemy dies in the air.
- Knockback is mass-aware: wardens resist more than revenants, and bosses resist substantially more.
- Impulse movement is substepped against world obstacles. Fast wall impacts rebound and can cause a **WALL CRUSH**.
- Airborne enemies tuck, reach, tilt with momentum, and compress on landing.
- Telekinesis uses a damped lift rather than teleporting its target upward. Its slam damage happens at floor contact, with a small collateral impact area.
- Vortex and gravity fields apply forces instead of directly moving enemy positions.
- Temporal Rift slows enemies and hostile projectiles **inside its visible field** rather than slowing every enemy everywhere.

## All 15 powers now support Overcast

**Hold Shift and press Q.** Normal Q still performs the original cast; hold R still selects among all 15 powers.

Overcast costs **35% more wrath**, has a longer windup, and takes **15% longer to cool down**. Spellweave's existing cost reduction still applies. Cancelling an unreleased cast defensively refunds the actual reserved cost.

| Power | Overcast enhancement |
|---|---|
| Hellfire Bolt | Stronger, faster bolt |
| Inferno Wave | Wider spread and stronger wave projectiles |
| Meteor Fall | Larger impact radius and more damage/knockback |
| Cinder Step | Longer dash with stronger contact damage and knockback |
| Flame Vortex | Wider, longer-lived field with stronger pull and damage |
| Hellnova | Larger blast, stronger launch and knockback |
| Mind Lance | More damage/knockback; launches broken non-boss targets |
| Telekinesis | Higher lift and stronger ground-contact slam |
| Gravity Well | Wider, longer-lived field with stronger pull and damage |
| Mind Rupture | Wider, stronger rupture that also breaks nearby enemies' will |
| Temporal Rift | Wider field and longer duration |
| Phantom Blades | Five blades instead of three |
| Wraith Walk | Six seconds instead of four |
| Soul Reap | More damage and healing per target |
| Revenant Army | Longer-lived summons with stronger attacks |

Bosses resist telekinetic lifting. Enemies still retain their combat identities and boss phases.

## Presentation and feedback

- Gathering/recovery readout for normal and Overcast casting.
- Updated controls and Combat Codex entries.
- Footstep sounds and dust tied to stance entry rather than a separate animation clock.
- Coherent decaying camera recoil instead of frame-random jitter.
- Heavy attacks and live execution impacts kick up bounded, bouncing stone debris and leave temporary floor scars. These pools reset on a new run.
- Summons fade out near expiration rather than disappearing at full opacity.

## Play

Open **HELLBOUND.html** in a modern desktop browser. It includes the game, styles, and procedural assets and needs no network requests. The build label is **BRUTALITY UPDATE · V0.7**.

The accompanying **BRUTALITY-motion-preview.mp4** is a 10.9-second, 30-fps simulation capture of Soulbreaker, Grave Driver, and Gravity Coffin. It uses the actual game rigs and execution code on a simplified review stage. It is not a real-device performance benchmark or an AI-generated animation.

To serve the packaged game without npm dependencies:

```sh
python3 scripts/serve-game.py --port 5173
```

For source development and deterministic QA:

```sh
npm install
npm run dev
# Development uses port 5174, leaving 5173 available for the packaged game.
node tests/physical-overhaul.mjs
node tests/motion-test.mjs
node tests/cast-release-test.mjs
node tests/finishers-test.mjs
node tests/eclipse-test.mjs
node tests/final-qa.mjs
node tests/requiem-test.mjs
npm run standalone
node tests/standalone-test.mjs
node tests/finisher-flow.mjs
```

## Validation and limits

The browser regressions cover all 20 live finishers, 40 normal/boss previews, native E, preview restoration and rewards, all 15 normal casts, all 15 Overcasts, 39 motion cases, wall response, airborne death, body settling, telekinesis contact damage, projectile slowdown, wave progression, blessings, boss phases, restart, and saved records. Frame sequences were reviewed for representative finishers, not exhaustively for every animation/camera situation.

This remains a stylized procedural prototype, not mocap or a full commercial rigid-body engine. Body collision supports the level floor and registered cylinders, not arbitrary mesh triangles, full self-collision, or destructible architecture. Armor and wings can still intersect in extreme poses. The world layout, four districts, and progression systems are retained rather than replaced. Live preview sessions can expire; the downloaded HTML does not depend on the preview server.
