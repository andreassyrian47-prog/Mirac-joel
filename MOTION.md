# HELLBOUND — Motion Update · v0.6.0

This release addresses the stiff character animation in Eclipse. It changes the underlying articulated rigs, joint curves, foot placement, transitions, and combat event timing—not just the effects around them.

## What changed

- **Locomotion:** distance-driven strides, world-space stance-foot placement, knee solving, heel/toe roll, pelvis compression, opposing hip/shoulder rotation, and bent-elbow sprinting. Starting preserves the existing foot position instead of jumping to a stride target. Stopping uses a short catch step; sharp stationary turns reposition the feet instead of leaving the legs crossed.
- **Melee:** authored anticipation, contact, overshoot, and recovery phases for the four-hit chain, heavy launcher, charged strike, cleave, stomp, slam, lunge, and aerial follow-up. Damage windows follow the authored contact beats.
- **Defense and traversal:** directional evade poses, loading into a heavy charge, parry bracing, Cinder Step, and a reach/pull/recovery motion for Dread Tether.
- **All 15 powers:** separate casting curves and gesture-specific release times. Effects no longer all fire at the beginning of the animation. Pending defensive cancellation refunds reserved wrath; weapon imbuement starts only when the cast releases.
- **Secondary movement:** articulated spine, neck, wrists, fingers, ankles, toes, and wing fans, with damped head, wrist, tail, and wing follow-through. Actions blend into the previous pose instead of resetting every joint instantly.
- **Opponents:** revised revenant, warden, stalker, and oracle attack poses; boss windup, strike, and recovery poses; directional hit reactions and articulated death collapses. The player now also collapses on defeat rather than freezing in the last combat pose.
- **Summons and Ascension:** alternating summon attacks with timed contacts; an Ascension compression/unfurl/landing sequence.
- **All 20 executions:** additional body weight shifts and reactions, bounded joint transitions, secondary motion, and hand contacts reapplied after final pose blending. Soulbreaker retains the original chest punch → dash behind → lift → ground slam.

## Preserved

The 15-power R wheel, Q casting, all 20 E finishers and V previews, normal/boss preview sizes, execution rewards, four districts, waves, blessings, Ascension, boss phases, C tether, X quick swap, Rift Hunts, style system, settings, saved records, and offline play remain available. Controls have not been remapped.

## Validation

- 39 deterministic player-motion cases: finite, changing transforms and 15 distinct casting traces.
- Walk, sprint, and strafe stance-contact checks; start/stop/half-turn continuity and settled-foot checks.
- Native R/Q input checks for all 15 powers, delayed release, recovery, and no duplicate summons; pre-release parry refund test.
- 40 execution previews (20 normal and 20 boss-sized), all 20 live executions, native E, rewards, filtering, selection, and cancellation restoration.
- Eclipse tether/rift/style/settings regressions; blessings, wave progression, Ascension, elemental reactions, boss phase two, defeat, and saved records.
- Rendered frame-sequence review of locomotion, representative attacks/casts, and selected in-world executions. This is not a claim that every animation has received exhaustive visual review.

## Scope and limitations

This remains a stylized procedural browser prototype. The animations are authored joint curves with analytical constraints and secondary springs, not imported motion capture or a physics ragdoll system. Foot placement targets the game's level ground; it is not full arbitrary-terrain climbing IK. Cinematic grabs are procedural, and extreme poses can still intersect armor or wings. Software-rendered browser tests establish behavior, not a real-device frame-rate guarantee.

## Reproduce

```sh
npm install
npm run dev
# In another terminal:
node tests/motion-test.mjs
node tests/cast-release-test.mjs
node tests/finishers-test.mjs
node tests/eclipse-test.mjs
node tests/requiem-test.mjs
node tests/final-qa.mjs

# Package the self-contained game:
npm run standalone
node tests/standalone-test.mjs
node tests/finisher-flow.mjs
```

The deterministic studio and capture helpers are development-only and are excluded from the standalone production game. The motion capture scripts are QA utilities, not an additional in-game gallery.
