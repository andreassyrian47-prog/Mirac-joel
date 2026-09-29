# HELLBOUND — Carnage
## v0.8.0 · contact, combat, ragdolls and boss executions

Play **HELLBOUND.html** in a modern desktop browser, or use the live game preview. The standalone file needs no installation, CDN or network connection. Keyboard, mouse and WebGL are required.

## The fire-ring drag is actually a drag now

**Cinder Spiral — 5.2 seconds:** sweep → ankle seizure → backward travel around the fire ring → swing and release. The grip controls the victim's position while the pelvis stays low; the held leg bends toward the hand. The free limbs react during the scrape instead of the victim simply orbiting upright.

The boss-sized **Throne of Cinders** uses the same maintained grip, then repositions the demon beside the fallen boss's chest for two stomps.

## Fixing the underlying alignment

- Palm, foot and knee constraints are reapplied after the blended pose, rather than relying solely on the initial authored pose.
- Reach correction accounts for actor/victim scale. Nearby unconstrained support feet retain their positions during small final corrections.
- A fall-blending bug no longer overwrites grabs, kneels and arm poses when the fall weight is zero.
- Crown of Ruin, Hell's Guillotine, Furnace Heart and Infernal Pillar have retimed strike windows: contact precedes the victim's launch/descent, rather than chasing a body already thrown away.
- Infernal Pillar adds tucked aerial legs and a closer pursuit path. Gravity Coffin adds repeated compression reactions. Soul Sever starts with a physical chest hook.
- Cinder Spiral and boss executions have expanded, individually authored beats. Soulbreaker's original chest punch → rear dash → lift → ground slam remains intact.

This is a shared interaction/motion upgrade, not a claim that every old clip has been entirely replaced.

## Three longer boss-only executions

| Move | Duration | Six beats |
|---|---:|---|
| **Kingbreaker** | 6.8s | Break the knee → seize the crown → drive the knee → hammer the king → tear the crown → cast down |
| **Throne of Cinders** | 7.6s | Collapse the stance → seize the ankle → drag through fire → swing and bury → trample the throne → cinder rupture |
| **Sovereign's Ruin** | 7.2s | Shatter the guard → temple lock → raise the sovereign → first compression → gravity reversal → sever the crown |

Press **V → BOSS** to preview or equip them. Standard and boss choices are independent and persistent. Each has its own no-repeat shuffle pool. **E** on an eligible boss automatically uses the boss pool; normal foes never receive a boss-exclusive move. Bosses must have at most 20% vitality.

There are **23 total executions**. [FINISHERS.md](FINISHERS.md) lists all names, phases, descriptions and durations.

## Deeper melee

| Input / situation | Result |
|---|---|
| **A or D + right-click** | **Reaver Sweep:** directional heavy branch; nonboss survivors enter a physical knockdown. |
| **Right-click with a downed target** | **Ruin Stomp:** grounded follow-up with extra force. |
| **S + right-click** | **Hook and Haul:** pull a target into a brief clinch. |
| **Right-click during that clinch** | **Crushing Knee:** heavier follow-up and launch. |
| **Perfect parry/evade, then attack** | **Ruin Counter:** a dedicated counterattack clip. |
| **Keep F held after the initial parry** | **Held guard:** frontal protection, slower movement, wrath cost and chip damage. |
| **Queue light/heavy during the amber window** | **Perfect Link:** +12% damage, +40% posture pressure and +3 wrath per hit. |

Guard absorbs 85% of blockable frontal damage and costs `6 + incoming damage × 0.25` wrath. Insufficient wrath breaks the guard. Rear attacks and crimson unblockable attacks bypass it. A Perfect Link is queued shortly after contact, not by indiscriminate button mashing.

Existing charged heavies, light-chain branches, aerial juggling, dash attacks, spellweaving, posture breaks, elemental reactions, **C** tether, **X** quick swap, **Q / Shift+Q** powers and **hold R** wheel remain available.

## Expanded physical reactions and optional gore

- Recoverable ragdoll knockdowns from sweeps; surviving foes blend from their captured physical pose into a get-up.
- Burn ticks continue during knockdown/recovery. Starting E on a downed foe blends from the captured pose instead of immediately resetting all joints.
- Existing constrained corpses now accept nearby melee impulses, with limited particle self-separation.
- Stylized blood spray and ground stains accompany qualifying hits and executions.
- Selected boss executions sever a head or forearm. Strong lethal knockback hits can detach a forearm. This is not arbitrary per-limb dismemberment on every attack.
- **O → Stylized gore:** switching it off clears existing gore and disables new gore. Finishers and ragdolls still work.
- Fixed budgets: 160 blood droplets, 48 stains, 10 detached parts, 12 retained corpses. Parts last up to 6 seconds, corpses 5 seconds, stains 35 seconds. Preview-owned gore is cleaned when a preview ends or is cancelled.

## Verification and preview

**CARNAGE-motion-preview.mp4** is a 26.4-second, silent, 30-fps capture of the actual in-game rigs on a simplified review stage: Cinder Spiral, Kingbreaker, Throne of Cinders and Sovereign's Ruin. It is a motion study, not a claim about gameplay frame rate. Temporal frames from all four were visually reviewed.

Automated checks passed for:

- All 20 standard previews, 20 boss-scale previews, and 20 live standard executions.
- All three new boss previews and live executions; native E routing, independent equipping, six-beat UI, saved boss choice, isolated 1,195-point boss execution reward, and interleaved normal/boss shuffle cycles.
- Maintained ankle grip over more than 130 full-weight simulation frames in each dragging execution, with maximum sampled error below 0.002 world units.
- Strong-contact residuals below 0.2 world units in the 43 standard/boss-scale audit scenarios. Ritual/remote moves with no physical contact constraints have no contact measurement; this is not evidence of pixel-perfect animation.
- Native sweep/stomp, hook/knee, held guard, timed links, live knockdown/recovery, burn continuity, downed-target execution and gore disable/cleanup.
- Physical body settling, wall projection, all 15 Overcasts and cast releases, motion, Eclipse systems, blessings, boss phases, records, audio/preferences and catalog flow.
- Production build and offline standalone: zero outbound HTTP requests, zero page errors, no development testing API.

## Scope and limitations

This remains a stylized procedural Three.js prototype, not motion capture, soft-body anatomy or a commercial rigid-body engine. Body constraints and selected particle self-separation do not model every armor surface; extreme poses and crowded geometry may still clip. The temporal review focused on the reworked drag and three new boss moves, not an exhaustive visual certification of every possible combat combination.

The four districts, wave survival, 15 powers, blessings, Ascension, boss phases, rift hunts and offline support are preserved. No campaign-sized world expansion is implied.

## Source and reproduction

```sh
npm install
npm run dev
# Development game and test harness: http://localhost:5174/?test
node tests/carnage-test.mjs
node tests/boss-routing.mjs
node tests/contact-audit.mjs
npm run standalone
python3 scripts/serve-game.py --port 5173
```

Browser tests need Playwright Chromium (`npx playwright install chromium`) and its platform dependencies. Run software-rendered browser suites sequentially. Optional reel capture uses `tests/carnage-reel.mjs` and `scripts/encode-carnage.py`; encoding additionally needs Python Pillow and imageio-ffmpeg.
