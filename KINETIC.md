# KINETIC · v0.13.0
## Movement first: posture, feet, transitions and body language

This release addresses the everyday animation foundation rather than adding another set of finishers. It preserves **46 executions, 24 powers, four modes, free-look camera, combat stances, defensive cancels, physics and optional gore**.

## Try the movement

1. Open **HELLBOUND.html**, or the Kinetic live preview, and choose **Training Arena**.
2. Move with **WASD**. Press **L** to toggle the slower **Prowl** walk. Hold **Shift** to sprint; sprint temporarily overrides walking.
3. Release movement to see the braking catch. Reverse direction to see the bounded turn and repositioning feet.
4. Use **Tab** near a target to inspect lateral/backward footwork while locked on. Mouse orbit remains independent of facing.
5. **U** supplies a durable sparring target, **H** enables enemy AI, and **J** restores practice resources. Hold **R** to select powers, **Q** to cast, and **V** to inspect the preserved execution library.

The movement setting is per run, not a permanently saved preference. Starting a new run restores normal running.

**KINETIC-showcase.html** contains a **14.9-second silent movement study**, chapter buttons and half-speed playback. The underlying video is **KINETIC-movement-study.mp4**. It renders the actual rigs and motion controller on a neutral stage at 30 output frames per second from fixed simulation steps. This is an animation inspection tool, not a live frame-rate benchmark or a full-world gameplay recording. No generated video or motion-capture footage is substituted.

## The foundation that changed

### Resting posture and readiness

The old idle held both forearms in front of the torso with conspicuous upturned palms. The new resting pose lowers the hands, turns the palms inward, relaxes the fingers, slightly offsets the stance and adds restrained chest breathing and head motion. A nearby threat blends the player toward a guarded posture rather than using the same stance everywhere. The menu uses the relaxed pose.

Enemy locomotion uses the same new system with heavier or more predatory posture adjustments. Casters and spectral summons retain a separate floating silhouette with asymmetric hanging legs instead of pretending to plant feet on the floor.

### Walking is no longer a slowed-down sprint

The old gait used a fixed stride distance and the same 38% support interval at every speed. That meant even a slow walk inherited running-style flight timing and excessive foot lift.

The replacement blends stride distance, support duration, foot clearance, arm drive and body compression by actual movement speed:

- **Prowl:** shorter strides, longer grounded support, low clearance and a quieter upper body.
- **Run:** stronger opposite-arm motion, counter-rotation through the hips and torso, and quicker support transfer.
- **Sprint:** a shorter support interval, greater clearance and compression, bent elbows and more compact wings.
- **Lateral movement:** its own cadence/support blend and staggered foot paths, rather than simply rotating the forward run.
- **Backward movement:** a shortened stride and direction-aware placement.

The feet are planned in world space, with heel contact, push-off roll, swing arcs and bounded pelvis compensation. Overextended support feet can lift early on a sharp turn rather than dragging an unreachable target behind the character. The final swing endpoint stops chasing changing predictions just before touchdown.

### Starts, stops and turns

Normal movement now has short acceleration and braking ramps. Default unbuffed speeds remain **6 world units/second** for running and **8.8** for sprinting; Prowl is **2.2**. Facing changes have a bounded angular step instead of jumping a large fraction of a half-turn in one frame.

This is not delayed input handling: attacks, parries and dodges still begin on input. Their dedicated movement paths are not slowed by the ordinary movement ramp. Existing blessings and speed modifiers remain in effect.

Foot placement follows actual resolved displacement, not just a held movement key. A turn or stop can trigger a small repositioning step instead of leaving both feet glued to the wrong orientation.

## Animation beyond walking

### Cross-state transitions

Non-execution transitions use longer, finite pose blends; dodges retain a shorter blend. A swinging locomotion foot gets a short catch when entering a grounded action. A planted foot remains a support instead of both feet unnecessarily hopping at the start of a cast. Returning from attacks and airborne poses can settle the feet rather than snapping both directly to the standing target.

Airborne visual offsets suspend normal floor IK until the rig is low enough to land. Paired executions keep their dedicated timing and contact controller rather than receiving another competing full-body overlay.

### Melee and defense

Player attack turns now distribute a little rotation through the pelvis and spine, with counter-rotation in the neck to keep the gaze better aligned. Breaker and Wraith add restrained stance-specific loading. The held guard has subtle breathing instead of a completely frozen pose.

Enemy guard, airborne reactions and stagger no longer get overwritten by a walking arm-swing pass. Stagger removes the perpetual high-frequency torso wobble. Impact reactions use a single decaying directional response with delayed head motion; the previous recoil sign could bend the victim toward the source of the hit.

### Abilities and aerial actions

All 24 casts use the revised transition, shoulder, finger and recoil treatment. Their gameplay release fractions are unchanged. The newer powers emit their hand effects from the performing hand or the midpoint of the two palms, matching the revised gestures.

The nine newer powers now have explicitly authored windup/release poses instead of borrowing old casts with a small torso twist:

- **Hellfire Lance:** loaded, asymmetric thrust.
- **Cinder Mine:** a low placing gesture.
- **Infernal Bastion:** crossed protection opening into a forward ward.
- **Phoenix Dive:** a compressed launch gesture.
- **Repulse:** a two-palm release.
- **Neural Chain:** asymmetric conducting hands.
- **Null Sphere:** cupped containment expanding outward.
- **Soul Anchor:** reach, clasp and draw.
- **Reaper Guard:** crossed wrists opening into a defensive shape.

**Enemy Step** has a separate rebound pose instead of reusing an entire spinning aerial attack. In live play it retains the previous aerial height at entry. **Phoenix Dive** has its own airborne-to-ground track with its visible commitment aligned to the existing 52% impact event.

### Secondary articulation

- Small bone-local shoulder movements during ordinary actions; execution contact origins remain stable.
- Distal finger joints and claw tips follow the proximal curl, including ragdoll relaxation.
- Wing folding responds more strongly to movement speed.
- Waist cloth responds to local forward/lateral velocity, not just a uniform time-based wave.
- Existing tail inertia and hand follow-through remain.

## What was preserved

The original **Soulbreaker chest punch → rear dash → lift → slam**, maintained ankle drags, all 46 finisher identities, the Onslaught execution camera and Steady option, all 24 powers and Overcasts, the four modes, districts, blessings, Ascension, rifts, style, stances, Flow, Enemy Step mechanics, guards, knockdowns, ragdolls, gore settings and offline startup.

See **FINISHERS.md** and **POWERS.md** for the complete rosters. This is not a claim that every finisher or attack was individually replaced with a newly authored clip.

## Validation

Current evidence is collected in the `tests/kinetic-*.json` reports:

- Seven locomotion scenarios: idle, walk, run, sprint, lateral movement, backward movement and stop/turn.
- Nine speed/rate combinations: three movement speeds at **30, 60 and 120 simulation steps per second**, checking finite transforms and planted-foot tracking.
- All **30 action clips** checked for finite, non-frozen motion; **24 distinct cast traces** and release/cancel behavior.
- Six movement → action → idle transitions. The tested foot discontinuities at transition boundaries stayed below 0.30 world units; both feet settled afterward. Fast movement within an action can travel farther between samples.
- Native keyboard tests for acceleration, braking, L toggle, sprint override, bounded reversal and immediate defense. The unbuffed six-unit/second stop covered approximately **0.229 world units** in that controlled test.
- **86 execution/scale previews**, physical handoff/completion, strong contacts, framing and core proxies; **94 accepted staging cases** using regenerated motion footprints.
- Native combat chains, all six live boss finishers, normal casts and Overcasts, wards, mine detonation, Soul Anchor consumption, knockdown/get-up, optional gore, mode flow, free orbit and physical settling regression checks.
- Production UI and offline startup checked separately for the packaged file.

The tests combine deterministic browser checks with rendered-frame inspection. They are not a substitute for extensive human play-testing. Older named release guides, movies and result files are historical, not additional evidence for this version.

## Limits

There is no defensible numerical “100×” animation score. This is a substantial procedural-controller revision, not a motion-capture library. The game still has stylized proportions, shared animation vocabulary and a lightweight physics solver. Foot placement targets the game's flat ground plane, not arbitrary stairs or uneven terrain. Contact proxies do not represent every claw, wing or armor triangle, and fast attacks can still show large joint travel between frames. Broader balance, visual continuity and performance testing remain useful.
