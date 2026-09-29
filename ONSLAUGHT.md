# ONSLAUGHT · v0.12.0
## A choreography, contact and camera overhaul

This release keeps the **46 finishers, 24 powers and four modes**. The work is concentrated on how the existing game moves and reads, rather than increasing the roster again.

## Play and inspect

- Open **HELLBOUND.html** in a modern desktop browser, or use the Onslaught live preview.
- **Training Arena → V** opens the full execution library. Preview a move, or equip it and use **T → E** on a regular target / **Y → E** on a boss.
- **O → Action execution camera** enables the new shot direction. Turn it off for steadier framing. Camera shake and full-screen flashes remain separately adjustable.
- **ONSLAUGHT-animation-study.mp4** is an 11.7-second silent study of Soulbreaker, Meteor Burial and Sunless Coronation. **ONSLAUGHT-showcase.html** embeds it with chapter buttons and half-speed playback.

The study uses the actual game rigs, choreography, physics and camera on a neutral-lighting stage. It is encoded at 30 fps from fixed simulation steps; this is **not a runtime frame-rate benchmark**. World-stage particles, lighting and brief live-play hitstop are not reproduced in full. No generated video or motion-capture footage is substituted for gameplay.

## What changed

### One pose controller, not competing layers

The previous execution path stacked choreography, an upper-body performance, additional anticipation/reaction overlays, ordinary movement inertia and contact correction. Several layers were moving the same joints. This could bend characters back toward each other and make a supposedly planted grip look unstable.

Onslaught removes the redundant execution overlays and ordinary movement-inertia layer during paired moves. Torso and neck continuity are handled separately from the fast hand strikes. Tail follow-through and jaw motion remain, without adding another full-body wobble.

### Rewritten sequences

- **Soulbreaker:** preserved your chest punch → rear dash → lift → ground slam. The rear approach uses a clear outside arc; the lifted victim is cast away from the demon rather than brought down through its torso.
- **Infernal Pillar:** rebuilt as a chest brand, controlled flame-column ascent and commanded burial. The demon no longer needs an enormous invisible IK lift to reach a floating victim's head.
- **Meteor Burial:** a more compact launch and pursuit, reachable two-handed midair catch, release and landing.
- **Crown of Ruin:** revised uppercut, jump, aerial heel and recovery, with less reliance on a large corrective root offset.
- **Mindbreaker:** a reachable clamp before the victim is released into psychic suspension and driven down.
- **Tyrant's Verdict:** wrist capture, outward turning cast and a grounded heel crush beside the victim. This replaces the old knee-drop path that crossed through the fallen body.

Additional targeted corrections include Crucible Hook's late contact pose and jump, Wraith Procession's approach and final strike, Ember Pendulum's finishing ankle contact, Kingbreaker's authored jumping knee, the late kneels in Titan's Reckoning, the hand approach in Sunless Coronation, and World's End retaining its kneel until the head grip releases.

The other executions use the revised timing, pose, contact, body-spacing, physics and camera path. This is **not a claim that all 46 were replaced with entirely bespoke new animations**.

### Faster impact, not a slow floating fall

- A nonlinear execution clock reserves approximately **180 ms of the timeline for the final commitment**, instead of uniformly easing a long descent. Each move keeps its overall listed duration and beat order.
- Physical release respects ankle carries and drags. Some final contact blows deliberately release later than that nominal window, after their contact beat.
- Slam impulses use the victim's height and remaining time. A pose is captured once, then released to constrained physics with downward momentum and controlled rotational motion.
- Bodies already on the floor receive much less rotational impulse than airborne victims.
- Contact-blow endings burst at the victim, rather than playing a floor explosion before the blow connects. They knock the victim away and allow a subsequent fall.
- Execution hitstop is shorter and less dilated; ordinary melee retains its impact pause.
- Shorter rings, hand motion traces and layered bass/noise impact sound make the contact easier to perceive without covering it for as long.

### Less interpenetration

- Enlarged solid-core proxies better account for armor volume.
- Paired grips choose the appropriate left/right target instead of crossing the hands through the victim.
- Chest strikes can select the nearer surface rather than reaching through to an inappropriate fixed point on the front.
- Prone-body clearance starts before the final physical handoff when possible. Physical recovery also checks the thighs and shins, not just the torso and head.
- A safe recovery offset is retained rather than pulling the player back into the corpse.
- Motion footprints were regenerated for all 86 normal/boss-scale cases and used by the live placement planner.

Cinder Spiral and Throne of Cinders retain their sustained ankle grip and actual ground drag.

### Action-directed camera

The camera now has **Contact, Control, Release and Aftermath** phases. It changes its tracking arc, elevation and lens through the action, then widens for the commitment and settles afterward. Roll is restrained and follows the shake preference. Obstacles can trigger a clear-angle reframe instead of putting a wall between the lens and the actors.

The director measures animated anatomy, including additional horn clearance, and the letterbox is narrower. The camera is solved once after the final contact pass rather than being driven by two partial updates. Spectral echoes lose their oversized wings and fade near the camera so they do not become an opaque silhouette over the actual strike.

**Steady camera** keeps the safety framing but disables the action arc, dramatic lens changes and roll. It is a comfort option, not a frozen camera.

### Model and presentation work

- New beveled breastplates, layered rib protection, articulated shoulder plates, gauntlet and greave segments, knuckle armor and temple/forehead pieces.
- Smaller rounded shoulder volumes expose the new plate silhouette and improve contact readability.
- Shader-animated waist cloth and a denser wing membrane mesh; tighter combat wing articulation.
- Armor follows the relevant bone instead of being a rigid shell around the whole character.
- School-colored character lighting and brief melee impact lighting, respecting the flash preference.
- Refined execution captions, a tighter letterbox and a scrollable settings panel.

These remain original procedural, stylized models. No commercial game models, mocap clips or third-party character assets were imported.

## Preserved systems

Wave Survival, Free Roam, Boss Rush and Training Arena; independent free-look orbit; all four districts; blessings and Ascension; rifts, style, elemental reactions, overcasting, stances, Flow, Enemy Step, defensive wards, optional gore, settings and offline play.

**Z** changes stance, **N** spends Flow, **F** parries/guards, **Space** evades or performs a post-contact Enemy Step. Hold **R** to choose one of the 24 powers; **Q** casts, **Shift + Q** overcasts and **X** swaps powers. See README.md for the complete controls, FINISHERS.md for all 46 moves and POWERS.md for the arsenal.

## Validation

Release checks passed: **86 execution/scale cases**, zero measured core-proxy overlap including physical recovery, worst strong-contact residual approximately **0.049 world units**, and **94 accepted live staging cases**. The offline file made **zero HTTP requests** in its startup/play check. These numbers describe the tested samples, not an all-mesh or all-map guarantee.

Current reports and test coverage:

- `tests/onslaught-audit-results.json`: all 46 moves plus the 40 standard boss-scale previews, sampled at 60 Hz. Checks finite anatomy, physical handoff, completion, contact residual, camera framing and body-proxy overlap, including physical recovery. It also records root and joint steps rather than checking only roots.
- `tests/onslaught-staging-results.json`: 94 live placement/approach cases using the regenerated footprints.
- `tests/onslaught-camera-results.json`: four camera phases, active lens changes, steady option, preview-position restoration and preference persistence. In the Soulbreaker check, the action lens varied from roughly 43 to 59 degrees.
- All six boss moves equipped in the UI and triggered with native E, with kill/reward and persistence checks.
- Sustained fire-ring grips, knockdown/get-up, burn through knockdown, downed execution, hook/knee, guard, Perfect Link, preview cleanup and optional gore regression checks.
- All 24 normal casts and all 24 Overcasts; stance-cancel → Flow, Enemy Step, ward absorption/counter, Soul Anchor consumption and mine detonation.
- Four-mode flow, free orbit, physics settling and projectile slowdown regression checks.
- Production build, offline startup and production UI checks are recorded in `tests/onslaught-release-results.json`.

These are deterministic browser checks plus rendered-frame inspection, not an exhaustive human play-test. Passing a collision-proxy or endpoint test is not proof of a visually perfect animation.

## Honest limits

There is no literal, measurable “10× everything” guarantee. This is a substantial procedural revision, not a replacement with a AAA animation library. Some fast attacks still have large hand/joint travel between frames, and oversized preview victims can require larger reach corrections than the live standard enemies. Arms, horns, wings, cloth and individual armor pieces are not covered by exact mesh-to-mesh collision. Some finishers share pose and effect vocabulary. The ragdoll solver is lightweight, and balance/performance still need broader human testing.

Older Revenant/Dominion/Artistry guides, test snapshots and films are historical. Their counts, timings and results should not be treated as the current release's evidence.
