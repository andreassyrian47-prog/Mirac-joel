# Kinetic v0.13.1 — posture and stride correction

This is a focused response to the feedback that v0.13 ran, but still did not look good enough. It does not add more finishers or claim that passing a test makes the motion convincing.

## What was wrong

The previous gait lowered the hips as movement speed increased, then could lower them again to satisfy foot reach. The result was a persistent crouch: supporting knees stayed deeply bent even when the leg should have been carrying the body or pushing off.

The walking swing also lifted too high. Running used a largely symmetric foot arc, placing too much of the lift near the passing position instead of recovering the heel behind the body. Hip/shoulder rotation was poorly phased against the stride.

The wing fold had a separate error: the root and fan rotations added together past the narrow, edge-on position, folding broad panels across the back. That obscured the animation from the normal gameplay view.

## Corrections

- **Taller rest and movement posture.** Pelvis height now follows the supporting leg's geometry and its loading/push-off phase. There is no permanent movement crouch followed by a second downward correction.
- **A support leg that extends.** Contact travel is limited so a blended jog does not hold its planted foot farther behind the body than a full sprint.
- **A better first step.** Movement starts from a passing/support phase instead of asking a foot initially under the body to remain planted for most of a whole stance interval.
- **Lower walking clearance.** Walking no longer lifts the foot using a scaled running-style arc.
- **Earlier running heel recovery.** The heel comes up behind the body before the leg passes forward; running and sprinting have longer cycles at the same gameplay speeds.
- **Coordinated hips, shoulders and arms.** Counter-rotation peaks with the stride; running elbows bend more and claws close instead of presenting open palms.
- **Corrected wing folding.** Ordinary movement no longer overfolds the wings across the back. The separate execution wing settings are retained.

No movement-speed increase is used to make the comparison appear more energetic. The unbuffed speeds remain **2.2 for Prowl, 6 for run and 8.8 for sprint**. Controls, four modes, 46 finishers and 24 powers remain.

## Look at the actual difference

Open **STRIDE-showcase.html**, or **STRIDE-comparison.mp4**.

The nine-second split-screen comparison uses the same speeds, camera settings, fixed simulation steps and neutral lighting on both sides. It shows rest, walking, running, sprinting and running from the rear gameplay viewing angle. The left side is v0.13; the right is this correction. These are actual engine renders, not generated replacement footage. The video is encoded at 30 fps and is not a live frame-rate benchmark. Different gait phases at a given timestamp are expected because the cycle lengths changed.

In the game, use **Training Arena → WASD**, **L** to toggle Prowl and **Shift** to sprint. Check the header says **v0.13.1**.

## Checks and limits

Rendered side and rear views were reviewed, alongside regression checks for floor contact, starts/stops/turns, movement-to-action transitions, multiple simulation rates, all 30 action clips, 24 casts, the 86 execution/scale cases, production UI and offline startup.

The review diagnostics confirmed the excessive knee bend rather than treating it as a subjective impression: in the controlled run sample, median support-knee bend changed from about 58 degrees to 29 degrees. That is evidence for this particular mechanical correction, **not an animation-quality score**.

This remains a stylized procedural rig with flat-ground foot placement, not a motion-captured character. The correction is deliberately limited to visible posture, stride and wing readability; it does not claim that every animation is now perfected. The older KINETIC movement movie shows the pre-correction release.
