# HELLBOUND · Dominion v0.10

## Choose your hunt

| Mode | What changes |
|---|---|
| Wave Survival | The existing escalating waves, blessings, bosses, rifts and Ascension. |
| Free Roam | No timed wave cycle or compulsory blessings. Visit all four districts; each summons one local three-enemy patrol, once per run. Optional rifts remain available. |
| Boss Rush | One Vorath per round, with increasing vitality and a blessing between rounds. This is an escalating version of the existing boss, not a roster of newly invented bosses. |
| Training Arena | Immortal player, unlimited wrath and power cooldown resets. Spawn a finisher-ready revenant or boss, or a durable sparring target. Turn enemy AI on to practice responses. |

Use **Esc → Return to Main Menu** to change modes. Runs restart rather than being saved. Preferences and existing hunt records persist locally.

## Mouse control

The mouse now orbits the camera independently. **WASD** movement is camera-relative; the demon turns toward movement, or a **Tab**-locked enemy. Target lock no longer drags the camera around. Attacks aim toward a locked enemy or a candidate in the camera's forward hemisphere.

- Click the canvas to request pointer lock.
- If the browser blocks pointer lock, move the mouse over the canvas—no attack/drag is required.
- In this fallback, hold the cursor near a left/right edge for continuous turning through 360 degrees.
- Scroll to zoom. **O → Invert vertical look** reverses pitch.
- Menus, pause, the power wheel and cinematics suspend mouse orbit. Pointer-lock transition movement is briefly ignored to avoid recenter jumps.

## Finisher placement

All **23** executions retain the Artistry choreography, including **Soulbreaker's chest strike → dash behind → lift/slam** and the sustained fire-ring drags.

A new staging layer runs before live executions:

1. Load the move's sampled full-body footprint. There are **43 profiles**: 20 normal-scale, 20 boss-scale and 3 boss-exclusive.
2. Search a shared orientation, then—if needed—a nearby origin within 2.4 world units of the victim.
3. Test the motion footprint against registered world obstacles and the map boundary, including newly registered braziers.
4. Check both actors' entry paths and avoid crossing through each other.
5. Blend roots, facing and entry poses over **0.12–0.75 seconds**, before the authored timeline starts. Both actors use the same local choreography frame.
6. Retain final-pose contacts and sustained grips throughout the authored action.

If no safe stage exists, a message asks you to draw the enemy into the open. No reward is granted, no execution cooldown is spent, and the selected shuffle entry is not lost. Preview animations intentionally bypass world staging.

The cinematic camera also checks registered occluders and searches alternate angles/elevations. When its current tracking view is blocked, it can cut to a clear angle rather than squeezing the lens into the characters. Camera orbit resumes from the cinematic viewing direction afterward.

## Combat and powers

### Rampart Breaker — F + right click

From held guard (or the parry stance while F remains held), right-click to commit a planted shoulder strike. It has its own anticipation/contact/follow-through animation and applies substantial will damage. Bosses receive a smaller proportional stagger benefit.

### Triune Convergence — three schools, then heavy

Release at least one **pyro**, **psychic** and **spectral** spell. Each release refreshes an 18-second window; the HUD marks collected schools. Cancelled gathers do not count.

With all three collected, your next committed heavy consumes the charge. At contact, it adds an area blast, knockback/launch, eight vitality and style credit. A cancelled heavy loses the committed charge; it cannot be banked indefinitely. All existing 15 powers, overcasts, elemental reactions and melee branches remain.

### Training controls

- **T:** fresh execution-ready revenant.
- **Y:** fresh execution-ready boss.
- **U:** durable 1,200-vitality sparring target for combos and will breaks.
- **H:** enemy AI on/off. Off also stops boss attacks.
- **J:** reset execution, attack, parry and dodge cooldowns/resources.
- **V:** choose or preview an execution; **E:** perform it on an eligible nearby target.

## Models and motion

The procedural rigs now have tapered muscle silhouettes, layered beveled rib/hip/knee plates, forearm bands, cheek armor, articulated jaws/teeth, rear vertebrae and elite crown details. Joint locations and contact-chain lengths are preserved so the existing 23 tracks remain compatible. Spell releases add small school-sensitive recoil/follow-through; the new guard-break has its own authored track. Entry motion blends from the actual combat/knockdown pose rather than resetting both actors straight into a performance.

## Verification

Measured on this release with Playwright/Chromium. Numeric checks complement visual review; they are not a guarantee of perfect animation.

- **71 live E-triggered placement scenarios:** all 23 moves plus six representative moves at eight approach angles near courtyard pillars; varied entry distances. All completed; 13 used a rotated/relocated stage.
- Maximum measured actor root error at the staged entry endpoint: **0** world units (floating-point sample).
- Largest measured alignment root step at 60 Hz: **0.175** world units.
- Largest strong-contact residual in those live scenarios: approximately **0.063** world units.
- A deliberately impossible entry inside a pillar was rejected with unchanged position, score and execution cooldown.
- **43 preview contact scenarios:** all normal-scale, boss-scale and boss-exclusive variants remained below the 0.2-world-unit strong-contact threshold.
- All **15** native R/Q spell releases tested; cancelled gather does not charge resonance.
- Native guard → Rampart Breaker → will break; three-school release → heavy → Convergence; immortal training and boss AI toggle passed.
- Four-mode selection/reset passed. Boss → blessing → next boss passed. Free-roam cleared districts did not start waves; visiting another district spawned its local patrol.
- Unlocked mouse orbit did not rotate an idle demon. Continuous edge turning exceeded a full revolution.
- Existing execution rewards/equips/previews, sweep/ragdoll/stomp, clinch/knee, guard, perfect links, boss phases, rift rewards, settings and records regression suites passed.
- Visual inspection covered the mode menu, training HUD, revised model, and live Cinder Spiral near a pillar/brazier; the foreground occlusion found during review was corrected.

### Reproduce

```sh
npm ci
npx playwright install chromium
npm run dev -- --port 5174
# In another terminal:
node tests/dominion-smoke.mjs
node tests/dominion-flow.mjs
node tests/dominion-combat.mjs
node tests/dominion-staging.mjs
node tests/contact-audit.mjs
node tests/cast-release-test.mjs
node tests/finishers-test.mjs
node tests/carnage-test.mjs
node tests/boss-routing.mjs
node tests/eclipse-test.mjs
node tests/final-qa.mjs
npm run standalone
node tests/standalone-test.mjs
```

The staging results are saved in `tests/dominion-staging-results.json`. `tests/build-footprints.mjs` regenerates sampled footprint data after authored choreography changes. Test-only controls are not included in the production build.

## Limits

This remains a procedural desktop-browser prototype, not a mocap or AAA character system. Footprint and camera checks use sampled body landmarks and registered approximate world colliders—not every decorative triangle, particle, wing tip or cloth edge. Intersections can still occur in extreme poses, crowded scenes or untested views. The changes substantially improve placement and control; they do not promise mathematically exact skin contact everywhere. Physics remains the existing lightweight particle-body approximation. Boss Rush escalates the existing Vorath rather than adding new boss species.
