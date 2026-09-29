# HELLBOUND — Artistry
## v0.9.0 · An individual performance pass across all 23 executions

**Play:** open `HELLBOUND.html`, or use the live production preview. **V** opens the execution Grimoire; **E** executes an eligible enemy. Existing selection, boss eligibility, damage/rewards, gore settings and all fifteen powers are preserved.

## What changed

This pass is about character motion, not adding another particle layer. `src/execution-performance.js` supplies **244 authored pose keys across 23 separate performance tracks**, with distinct anticipation, load, contact, follow-through and recovery. The existing roots, kicks, aerial arcs and execution identities remain, with specific paths reworked where the review exposed problems.

### Shared fixes

- **Contact approach:** hands and feet approach targets in world space, reducing the large arcs produced by blending joint rotations alone.
- **Release continuity:** contact-induced root offsets decay out rather than disappearing in a single frame. Free extremities have rate-scaled transition limits; active contacts retain priority.
- **Support feet:** the transition between foot planting and an authored kick is blended instead of switching at one sharp angular threshold.
- **Final-pose memory:** motion history and the physical handoff use the final contact-solved pose, rather than the earlier pose before IK. Actual frame delta is used for the handoff.
- **Victim reactions:** separately timed chest, neck and limb reactions; guarding wounds during holds; asymmetric leg shapes in suspension; free-limb floor projection.
- **Camera:** composition follows actual head, hip, hand and foot positions, including visible spectral doubles. Rapid aerial motion receives an immediate framing correction rather than waiting for a standing-height camera to catch up.
- **Readability:** revised wing folding and less blown-out ghost blending help expose the action, although some silhouettes can still overlap.

## All 23 — move-by-move

| # | Execution | Performance changes |
|---|---|---|
| 01 | **Soulbreaker** | A loaded chest punch, withdrawn strike arm, low rear dash, deeper lift preparation, overhead load and sustained slam recovery. The original punch → dash behind → lift → slam is preserved. |
| 02 | **Grave Driver** | Lower sweep/reach, a maintained hand-to-ankle carry, earlier overhead lift, revised victim rotation and a continuous release into burial. |
| 03 | **Crown of Ruin** | Crouched uppercut preparation, torso-led aerial rotation, counterbalancing arms, a wider heel-contact approach and landing compression. |
| 04 | **Hell’s Guillotine** | Braced knee strike, distinct vault preparation, raised-arm aerial silhouette and an earlier axe-kick contact before the victim's descent. |
| 05 | **Tyrant’s Verdict** | Wrist-capture pull, clearer turning leverage, repositioning over the victim's chest, an authored jump/drop arc and an actual knee constraint. |
| 06 | **Furnace Heart** | Palm pressure changes through the seal, a pronounced recoil and rechamber, counterbalanced kick and stepping recovery. |
| 07 | **Cinder Spiral** | Deeper seizure, changing drag posture, continuous backward-to-forward release turn and a blended victim release path. The maintained ankle drag remains. |
| 08 | **Infernal Pillar** | Distinct throat reach, overhead fist loading, tucked pursuit, deliberate two-handed descent and a held landing pose. |
| 09 | **Meteor Burial** | Compressed launch preparation, closer pursuit, a two-handed midair chest catch, diagonal throwing torque and landing recovery. |
| 10 | **Ashen Cross** | Opposing torso wind-ups, separate crossing claw extensions, a collected charge and an open-arm detonation instead of one repeated stance. |
| 11 | **Pyre King** | Counterbalanced knee-forcing kick, changing forehead pressure, victim resistance and a two-handed coronation close. |
| 12 | **Mindbreaker** | Open hands collect into the temple grip; compression, elevation and release have different torso loads; the victim guards against the hold. |
| 13 | **Gravity Coffin** | Alternating wide and compressed shapes for individual pressure beats, with asymmetric torso turns and a final downward seal. |
| 14 | **Orbit of Ruin** | Counterweight arm, leaning load through the orbit, a re-coiled throwing posture, torso-led release and a blended fall instead of an abrupt full fall pose. |
| 15 | **Heaven’s Rejection** | Low scoop, sharp upward flick, a deliberate held command with head tracking, overhead preparation and a deep gravity-reversal pull. |
| 16 | **Rift Fold** | Open the planes, twist through opposing pulls, cross the arms to compress space, then break outward through the crush and recover. |
| 17 | **Wraith Procession** | Alternating command gestures, low dash preparation, a loaded final palm and less overexposed spectral silhouettes. |
| 18 | **Soul Sever** | Hook, close grip, backward torso strain during extraction, recoil into a two-handed snap, then open release. |
| 19 | **Pale Requiem** | The through-body dash maintains its direction; the demon turns after passing instead of snapping his facing at the midpoint. Echo raising and reunion get distinct loaded poses. |
| 20 | **Tomb of Echoes** | Alternating binding commands, an outward braced hold, gathered hands and a two-stage downward seal. |
| 21 | **Kingbreaker** | Separate knee preparation, a visible hammer wind-up no longer overwritten by a later arm assignment, a loaded two-handed crown tear and cast-down recovery. |
| 22 | **Throne of Cinders** | Changing drag counterbalance, a continuous release turn, blended victim travel, and separately prepared/recovered stomps. |
| 23 | **Sovereign’s Ruin** | Loaded guard break, close temple lock, wide elevation, alternating compression/release poses and an overhead finish. |

## Watch the entire roster

- **ARTISTRY-all-23-finishers.mp4:** 98.87 seconds, 2,966 captured frames at 30 fps, silent.
- **ARTISTRY-showcase.html:** the same film embedded in an offline chapter player. Select any finisher or watch at half speed.
- The captures use the actual in-game rigs and execution code on a simplified review stage. They are not generated video, motion capture, or a claim that gameplay runs at the capture frame rate.
- Before/after temporal frames from all 23 executions were reviewed, with extra passes on contact/release transitions and aerial framing.

## Validation

The recorded master audit contains every 60 Hz simulation sample for the 23 standard/boss-exclusive showcase scenarios. All transforms tested were finite, all 23 performances were present, and no browser page errors were recorded. Sampled anatomy remained within approximately **0.833 normalized screen coordinates** in the showcase aspect ratio (the screen edge is 1). This measures the selected anatomy points, not every wing vertex, loose part, particle or possible browser aspect ratio.

The separate contact audit passes **43 scenarios**: 20 standard-size previews, 20 boss-scale standard previews and 3 boss exclusives. Strong weighted contacts remain under the existing 0.2-world-unit test threshold. Remote rituals have no physical hand-contact measurement.

Regression suites passed for all 20 live standard executions, new boss executions, native E boss routing and rewards, both shuffle pools, preview restoration/cancellation, retained Carnage melee and gore settings, physical settling, motion, cast release, Eclipse systems, final gameplay QA, offline loading and production catalog flow. Offline testing reports zero outbound HTTP requests and zero page errors; the development test API is absent from production.

`tests/artistry-results.json` records the compact master audit. `tests/artistry-verify.mjs` validates the captured audit. The other relevant suites are `finishers-test.mjs`, `carnage-test.mjs`, `boss-routing.mjs`, `contact-audit.mjs`, `physical-overhaul.mjs`, `motion-test.mjs`, `cast-release-test.mjs`, `eclipse-test.mjs`, `final-qa.mjs`, `standalone-test.mjs`, and `finisher-flow.mjs`.

## Honest limits

These are stylized, procedural animations on the existing articulated rigs—not AAA mocap or a full anatomical collision system. Extreme poses, armor/wing overlap, crowded scenery and some fast transitions can still show imperfections. The work substantially revises every finisher, but the tests and review are not a guarantee that every possible flaw has been eliminated.

## Reproduce the review

```sh
npm install
npx playwright install chromium
npm run dev
# In a second terminal, with Vite on port 5174:
REVIEW=master REEL=1 node tests/animation-review.mjs
python3 scripts/review-sheets.py master
node tests/artistry-verify.mjs
python3 scripts/encode-artistry.py
npm run standalone
python3 scripts/serve-game.py --port 5173
```

The capture is software-rendering friendly but can take several minutes. Python review/encoding tools need Pillow and imageio-ffmpeg. Captures are scratch files under `.cache`; the source archive contains code, documentation, tests and the playable HTML, not the large raw frame sequence.
