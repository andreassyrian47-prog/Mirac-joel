# HELLBOUND — Dread v0.15.0

A playable browser update, separate from the previously supplied Unreal plugin.

## New creature: Midget Fiend

A short fictional demon, not a human character: enlarged ridged skull, extended ears, crowded fangs, dorsal quills and amber eyes. Its 0.63-scale rig is distinct from the 1.05-scale ordinary revenant. It has 72 vitality, 4.35 movement speed, flanking approaches, a shorter attack tell and faster recovery. It joins ordinary waves and exploration patrols; the first survival wave includes two.

In **Training Arena**, press **I** or click **I · MIDGET**. Press **H** to enable its AI. Training targets start weakened so executions are immediately available.

## Three new executions

| Execution | Target | Duration | Sequence |
|---|---|---:|---|
| Ashen Dominion | Boss only | 6.8 s | Two torso blows → collar leap → grounded pin → two downward hammers → crown/head removal and physical release |
| Grave Stamp | Midget Fiend only | 3.15 s | Low sweep → step alongside the fallen body → raised heel → grounded stamp |
| Rack and Ruin | Midget Fiend only | 3.7 s | Collar capture → hoist → horned-brow strike → twisting outward cast and physical landing |

Durations exclude the short, obstacle-checked entry alignment. These are authored procedural animations using the existing articulated rigs, contact IK and lightweight physics. They are not motion capture. The stamp does not perform arbitrary mesh deformation, and this release does not implement anatomical mesh splitting.

**49 executions total:** 40 standard, 7 boss-exclusive, 2 Midget-exclusive. Each pool has its own equipped choice and no-repeat shuffle bag. The **V** Grimoire has a **MIDGET** filter and uses the actual small creature in its previews, even if boss preview was previously enabled. Incompatible saved selections are reset. Standard executions remain boss-compatible; small-exclusive ones do not.

## Movement and presentation

- Distance-driven walk cadence and swing clearance revised.
- Pelvis weight transfer now responds to the planted support feet, with damped transitions rather than a purely sinusoidal lateral sway.
- Stronger pelvis/chest counter-rotation and revised arm swing and elbow carriage.
- Restrained, layered head scanning at rest; the existing turn inertia, foot IK, toe roll and tail/wing secondary motion remain.
- Procedural skin/armor bump detail, rougher non-emissive surfaces and recessed torso scars.
- Cooler, dimmer key/fill lighting with warm edge illumination; the new creature has a distinct silhouette and attack rasp when audio is enabled.
- New-execution cameras look from the opposite side of the wings and rise for ground actions. The boss steps toward the final crown grip instead of relying on a sudden reach correction.
- Gore remains optional in settings. Disabling it suppresses the detachable-head effect and blood while keeping the combat animation and rewards functional.

The renderer and characters remain a stylized procedural prototype, not photorealistic assets. This update adds three performances and revises locomotion; it does not claim to rewrite every old execution.

## Quick test

1. Choose **Training Arena**.
2. **L** toggles prowl; **WASD** moves; **Shift** sprints.
3. **I** creates a Midget Fiend; **Y** creates a boss.
4. **V** → **MIDGET** or **BOSS** → select and equip a new execution.
5. Close the Grimoire and press **E** near the weakened target.
6. **H** toggles enemy AI; **J** resets resources. **R** still opens the 24-power wheel.

## Validation actually performed

- Production build and self-contained HTML packaging passed.
- 49 monotonic execution timelines checked; the previous ankle-carry-to-physics contract still passes.
- 97 staging cases completed, including obstacle-adjacent layouts and entry alignment. A separate impossible-space case rejected without consuming a cooldown or reward.
- Catalog counts, all three shuffle pools, stale-selection validation, equip/preview controls, first-wave small-enemy spawning and Training I/E routing passed.
- All three new executions completed with gore enabled and disabled, with no measured core-proxy overlap. Contact residuals vary with entry pose; sampled worst-case fully weighted contact residual was below 0.17 world units. This does not certify zero intersection for every visible ornament or every limb.
- New execution screenshots were inspected, revealing and then correcting wing-obscured framing and the abrupt final boss-grip approach.
- Idle, walk, run and sprint frame sequences were rendered and inspected; sampled poses remained finite. Numerical tests do not by themselves establish animation quality.
- The production HTML was exercised through actual UI controls: small-enemy and boss executions both completed. No browser exceptions were recorded in those tests.
- Offline HTML test: zero outbound HTTP requests; 24 powers present; no development testing API in the release.

Test reports are in `tests/dread-*-results.json`, `tests/stride-dread-results.json` and `tests/onslaught-staging-results.json`. Older named reports and showcases refer to earlier releases.
