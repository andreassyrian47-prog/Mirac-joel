# Predator · v0.14.0

A new animation revision after v0.13.1—not a re-delivery of the previous stride correction.

## Try it

Open `HELLBOUND.html`, or use the live game preview. The header should read **PREDATOR UPDATE · V0.14.0**.

**Training Arena → L → WASD** shows the stalking walk. L switches back to normal running; Shift still sprints. **V** opens the finisher library. Preview or equip **Grave Driver, Hell’s Guillotine, Furnace Heart, Gravity Coffin, or Soul Sever**. For a live execution, spawn an eligible target with **T**, approach, and press **E**.

[Watch the 20-second in-engine study](PREDATOR-showcase.html). It has chapter selection and half-speed playback, and works offline. This is a neutral-stage, fixed-step capture—not a live frame-rate benchmark. Most combat particles are omitted so the silhouettes remain visible.

## Demon locomotion

- Wider, outward-facing prowl foot placement, blended back toward the running stance as speed increases.
- Pelvis weight transfer phased toward the supporting foot rather than a generic side-to-side bob.
- Counterbalancing chest and head motion, a restrained forward stalking posture, and asymmetric low arm carriage.
- More curled, inward-facing claws; less symmetrical human arm swing at walking speed.
- Flatter initial foot contact rather than a pronounced heel-first marching action.
- The previous support-aware pelvis and world-space foot plants remain. Normal movement speed, acceleration, braking, sprint and independent mouse orbit are unchanged.

## Five newly authored paired finishers

| Finisher | New choreography |
|---|---|
| **Grave Driver** | Low sweep → grounded ankle pickup → outside hoist → inverted throw. The solved leg pose carries across the pickup; the ankle remains firmly attached until an explicit release into physics. |
| **Hell’s Guillotine** | Abdominal knee → lowered head control → planted support leg and raised opposite heel → downward axe kick and recovery. The camera now favors the kicking-leg side. This replaces the former floating vault. |
| **Furnace Heart** | Sustained sternum brand → withdrawal and chambered knee → extending kick. The mark follows the chest’s orientation, rather than hovering on a generic horizontal ring. |
| **Gravity Coffin** | Lift → two separate compression beats → curled-body hold → downward command and physical drop. Compression uses joint poses rather than scaling the victim’s torso. |
| **Soul Sever** | Chest hook → lateral extraction of an articulated echo → opposing claw sweep and tether sever. The ghost separates from the actors and dissolves as the body releases. |

The six bespoke Onslaught tracks remain; five more are newly authored here. This is **not** a claim that all 46 finishers have been rewritten.

## Shared finisher corrections

**Anticipation versus impact.** A monotonic, beat-local timing accent allows the wind-up to linger and the strike to catch up. Both actors, roots, contacts and event triggers use the same clock. Final impact times and total durations remain unchanged. Continuous drags and several older close-retargeted tracks deliberately retain their previous cadence after regression testing exposed catch-up snaps.

**Release from the pose actually held.** Physical release height and direction now come from the last final/contact-solved skeletal pose. Previously, these could be calculated from a reset choreography root even though the physics body itself started from the remembered pose. This especially mattered for carried or inverted victims.

**No fading ankle tether in Grave Driver.** A fully constrained carry hands off directly into the remembered physical pose. There is no low-weight interval where the hand races away while the victim is still nominally held.

**Placement rebuilt.** The 86 normal/large-victim motion footprints were regenerated for staging checks.

## Preserved

- **Soulbreaker:** chest punch → rear dash → lift and ground slam.
- Cinder Spiral and Throne of Cinders retain their sustained ankle-drag controllers.
- All **46 finishers**, **24 powers**, **four modes**, optional gore, preview restoration, combat rewards, and offline play remain.
- No change to normal run speed (6), prowl speed (2.2), sprint speed (8.8), or free-look controls.

## Validation and limits

- **86 execution/scale cases:** finite poses, completion, physical release and framing checks passed. Maximum measured core-proxy overlap: **0**; maximum near-full-weight contact residual: **0.0562 game units**.
- **94 staging cases:** passed, including 12 relocated starts; reported placement gap 0.
- All **46 timing curves** remained monotonic with unchanged final impact and end landmarks.
- Grave Driver handoff: **60 fully held samples**, maximum ankle residual below 0.001; physics began one 60 Hz step after the final held sample. Maximum sampled anatomical displacement at that handoff was **0.1683 game units**.
- Nine speed/rate combinations, 30 action clips, six motion-transition cases, native movement/defense controls, native combat flows and all 24 power releases passed their existing checks.
- Dynamic and steady execution cameras, preference persistence and preview restoration passed.
- The final standalone opened without external HTTP requests or JavaScript errors.
- Reviewed sampled in-engine frames of the revised prowl and each new finisher. The 20-second film is provided for judging movement in motion; automated checks and stills are not aesthetic quality scores.

This is still a procedural, articulated prototype. Core proxies do not certify every armor, horn, wing or cloth triangle, and oversized preview retargeting can still look less natural than standard-sized victims. No literal “100×,” mocap, AAA, or flawless-all-animations claim is made.

Results: `tests/predator-{contracts,executions,staging,camera,review,release}-results.json`. Movement/native-combat reports are copied with the `predator-` prefix for this release.
