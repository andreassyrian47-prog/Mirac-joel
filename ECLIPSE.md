# HELLBOUND — Eclipse Update

## Version 0.5.0

A balanced upgrade to the playable third-person browser prototype. All fifteen powers, twenty finishers, four districts, blessings, Ascension, and Vorath encounters remain available.

## Start here

Open **HELLBOUND.html** in a modern desktop browser. Everything needed to play is inside this one file. Use a keyboard and mouse; drag on the canvas to look if the browser refuses pointer lock. Sound remains opt-in using **SOUND** at the top of the screen.

- **C — Dread Tether:** hook a nearby enemy and reel them in. Boss mass reverses the pull, grappling you toward the boss instead.
- **X — Quick Swap:** alternate between your two most recently equipped powers. The initial pair is Hellfire Bolt and Mind Lance.
- **M — Realm Map:** find the three optional Rift Hunts and set waypoints directly to them.
- **G — Interact:** awaken a nearby rift, or commune with a district shrine.
- **V — Execution Grimoire:** inspect, equip, and preview any of the twenty finishers.
- **O — Settings:** adjust quality, camera distance, FOV, sensitivity, audio, camera shake, flashes, dynamic zoom, and warning labels.

## Dread Tether

| Property | Behavior |
|---|---|
| Cost | 16 wrath |
| Recovery | 4.5 seconds |
| Target range | 18 metres |
| Animation | 0.92-second reach, reel, and release |
| Damage | 18 base spectral damage; normal damage modifiers apply |
| Normal victims | Pulled toward you, staggered, and briefly will-broken on impact |
| Boss victims | Stay in place while you grapple toward them; no automatic will break |
| Obstacles | Registered columns and tree trunks block the initial tether |

The spectral tether follows the animated hand and victim's chest. Follow it with a light attack for **Rift Talon**, a heavy launcher, or an execution during a normal victim's brief will-break window. Boss executions still require 20% vitality or less. The move can be cancelled by other permitted combat actions; it does not grant full-animation invulnerability.

**Quick Confluence:** cast fire, press X to swap to psychic damage, then cast again to trigger the existing Pyrokinetic Rupture reaction. Equip other pairs using the original R wheel. Swapping does not bypass individual power cooldowns or wrath costs.

## The three Rift Hunts

Rift positions are resolved into nearby clearings away from registered trunks and columns. Use the map's dedicated Rift Hunt buttons rather than relying on fixed coordinates.

| Rift | Region | Covenant for the current run |
|---|---|---|
| The Unburied Choir | Toward the Pale Necropolis | +10 maximum vitality |
| The Furnace Wound | Toward Cinderwatch Bastion | +8 percentage points of base-damage bonus |
| The Hollow Vigil | Toward the Hollow Grove | +20 percentage points of wrath-regeneration bonus |

During an active wave, approach within five metres and press **G**. Three marked guardians join the hunt. Defeat all three to seal the rift. Only one Rift Hunt can be active at a time.

Each sealed rift also awards **500 score**, restores up to **30 vitality and 30 wrath**, and contributes combat style. Guardians additionally award their normal kill rewards. A rift cannot be farmed repeatedly: its reward is granted once per run. Covenants and rift progress reset on restart; they are not permanent account upgrades. Guardians count as surviving enemies, so they must be defeated before that wave can end.

## Combat style

The new meter grades performance **D → C → B → A → S → SSS**. Successful melee, elemental damage, tether impacts, perfect parries, perfect evasions, reflected hexes, executions, and sealed rifts contribute. Repeating the same scored technique within four seconds earns reduced style. Swinging into empty space does not fill the meter.

- Style begins decaying after three seconds without a scored action; decay accelerates after seven seconds.
- Taking damage removes 24 style points.
- Pauses and finisher playback do not advance the style-decay timer.
- A wave-clear bonus equals `floor(2 × peak style)` for that wave, up to **400 score**. The blessing screen reports the exact bonus.
- The death summary reports the run's peak style value.

Style measures combat variety and momentum. It does not itself multiply your damage or execution rewards.

## World and character presentation

- A shader-rendered eclipse corona, moving cloud noise, and subtle stars replace the old paired-sphere sun.
- Drifting, layered ground mist adds depth without downloading image assets.
- Fog and directional-light colors blend between the four districts.
- Broken obelisks and inscriptions outline the outer approaches.
- New angular breastplates, pauldrons, bracers, greaves, and emissive engravings strengthen the player silhouette.
- Wings tuck closer during regular combat and close-contact executions, while retaining broad ceremonial and aerial poses.
- Locomotion blends more smoothly into idle, with turning lean, footstep dust, and synthesized footstep sounds.

## Camera, information, and audio

- The gameplay camera uses a shoulder offset and collision checks against registered columns and tree trunks. This is not full-mesh collision and does not constrain every cinematic shot.
- Adjustable **6–11 metre camera distance** and **50–80 degree base FOV** persist in this browser.
- Dynamic sprint/charge FOV changes can be disabled separately from camera shake.
- Attack labels distinguish **PARRY**, **REFLECT**, and **EVADE**. Offscreen threats move to the screen edge; labels can be disabled.
- Directional damage feedback, tether recovery, quick-swap destination, Rift Hunt progress, and style have dedicated HUD readouts.
- Optional synthesized bass pulses respond to low health, higher combat style, and boss presence. These supplement the existing ambient wind, drones, and impacts; they are not a recorded soundtrack.

## Reliability and rendering

Tree bark now shares a material so the world batching system can combine it. Retired character rigs, replaced spectral materials, enemy telegraphs, and transient effects are cleaned up more thoroughly. Restart clears temporary effects and all Eclipse run state. The performance tier renders fewer mist layers and still bypasses bloom and shadows.

The game remains a contained, procedurally animated prototype rather than a campaign-sized or motion-captured AAA RPG. Current runs are not saved. Preferences and best-run records persist when browser storage is available.

## Verification

Automated Chromium checks cover:

- All 20 normal-size and 20 boss-size finisher previews, resource restoration, unique finite motion traces, actual E selection, and once-only live execution rewards.
- Tether cost, recovery, normal pull, boss grapple, quick swap, and live attack-warning labels.
- All three Rift Hunts, duplicate-interaction protection, rewards, map destinations, and restart resets.
- Style gain, pause safety, decay, and wave-clear bonus reporting.
- All fifteen power casts, blessings, Ascension, elemental reactions, boss phase two, settings, audio, and record persistence.
- The portable build loading without outbound HTTP requests or the development testing API.

See **README.md** for the complete controls and combat systems, and **FINISHERS.md** for every execution.
