# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [Semantic Versioning](https://semver.org/).

The names v1–v3 in `archive/` and "v4" in `docs/` are internal prototype names, not release versions.

## [Unreleased]

### Changed
- Firework shows last about 30 s: 95–110 rockets plus the finale (was 28–40 rockets, about 10 s).

## [1.5.0] - 2026-10-24

### Added
- **Santa**: about two minutes in, then every 4–6 minutes, Santa flies across below the clouds in a red sleigh pulled by four reindeer (red-nosed Rudolph in front), towing 5–10 gift wagons. Sleigh bells jingle and he calls "ho ho ho".
- Each wagon drops 3–5 presents wrapped in bubbles. A present can hold anything a bubble holds (ladder, mushroom, fire, cow, crocodile, monkey, bear, berry, star). Tap a falling present to open it; presents that land wait until a person or animal walks into them.
- Tap the sleigh for up to 3 extra presents, tap a wagon to make it drop a present now, tap the reindeer to flash Rudolph's nose. At night Rudolph's nose and the sleigh lantern glow.
- **Fireworks**: every Santa trip brings at least one firework box. Tap it, or let a person or animal bump into it, and it fires 28–40 rockets plus a finale, bursting below the clouds as round bursts, rings, hearts, stars, smiley faces, golden willows, splitting crossettes and two-colour shells. Tap it while it fires for an extra rocket.
- Firework sounds: launch thump with occasional whistle, a deep boom that arrives a moment after the flash, and crackling glitter.
- Daytime bursts leave drifting smoke; night bursts glow, flash the sky and glitter, and wake sleepers nearby.
- Nearby people react to fireworks: some stop and watch with raised arms, others get scared by the noise and run around.

### Changed
- Up to 16 items can be on the board at once (was 10), so Santa's presents don't vanish as soon as they open. Firework boxes are never faded out early.

## [1.4.0] - 2026-10-23

### Added
- **Plane and parachutes**: every 2–3 minutes (first one after about a minute) a plane flies across the sky and drops 5–10 gift boxes on parachutes, each wrapped in a bubble with a picture of the gift. Tap a box and the bubble pops and the gift falls out: berries (three at once), seeds, a mushroom, a ladder or a star. Untapped boxes float down; the bubble pops on landing and the box waits until a person or animal walks into it (or opens by itself after 45 s). Tap the plane for up to 3 extra boxes.
- Mushrooms hop around by themselves every few seconds and bounce nearby people into the air when they land.

### Changed
- Fire is bigger, grows over time and lasts 30 s instead of 10 s. Rain shrinks it and puts it out in about 3 s. It shows up twice as often in bubbles; mushrooms also show up more often.
- People on fire burn about twice as long without water (big fire ~20 s, then small ~8 s). A very big fire spreads to up to 3 people nearby from a wider reach, and the chain weakens each time.

### Removed
- The "inspired by teamLab" link in the corner: small children kept tapping it and leaving the game. Credit stays in the README.

## [1.3.0] - 2026-10-14

### Added
- **Day and night**: night falls by itself after about 2.5 minutes, or when you press and hold the sun for 1 second. Tap the moon (or wait about 90 seconds) for morning.
- At night the board turns dark blue while chalk stays bright, the sun becomes a crescent moon, stars grow bigger, fireflies blink near the ground, crickets chirp softly and the music box plays slower and lower.
- People yawn and lie down to sleep (about a quarter stay up and wander). Tap a sleeping person to wake them. The bear sleeps through the night too.
- Gentle dusk and dawn chimes.
## [1.2.0] - 2026-10-13

### Added
- **Rainbow**: when the sun is shining while a cloud rains, a rainbow appears and people can walk over it like a bridge. It stays 14 s after the sun or rain stops, then fades and anyone on it floats down.
- **Puddles**: rain runs downhill and pools. Flat ground gets shallow puddles; a U-shaped chalk line fills into a pond. Puddles dry up after the rain stops.
- People splash through puddles. A burning person who walks into water is put out, and big fires make people run to the nearest puddle.
- The crocodile swims in big puddles.
- **Flowers**: clover that keeps getting rain blooms into flowers.
- **Butterflies** fly in to rest on flowers. People stop to sniff a flower and sneeze, startling the butterflies.
## [1.1.1] - 2026-10-13

### Fixed
- Scripts are loaded as `file.js?v=<version>` so a browser never mixes freshly deployed files with old cached ones (GitHub Pages caches for 10 minutes). A mix could freeze the game right after a deploy.

## [1.1.0] - 2026-10-13

### Added
- Three new animals that drop from bubbles, alongside the cow:
  - **Crocodile**: carries people on its back, snaps at the air (people hop away, nobody gets hurt), sprays water on anyone on fire. Burning people run to it like to a raining cloud. Tap it and it rolls over giggling.
  - **Monkey**: picks berries from ripe bushes and throws them to people, races up ladders and leaps into the sky (bursting stars it touches). Tap it for a backflip.
  - **Bear**: people stack on its head, eats a whole berry bush then sleeps (its belly is a trampoline), runs over to stomp out fires. Tap it and it hugs the nearest person; tap a sleeping bear to wake it.
- Tapping an animal takes priority over tapping a person walking past it.
- Burning: a person who touches fire catches it (random strength). A small fire burns out by itself in a few seconds. A big fire makes the person cry for help ("cứu! cứu!"), drop off any tower and run toward water: a raining cloud or a crocodile first, otherwise the nearest cloud.
- A big fire spreads to at most one person standing next to the burner or in the same tower. A person who caught fire this way does not pass it on.
- Rain puts a burning person out immediately, with a soft hiss and steam rings.
- Burned people turn black (eyes stay white) and fade back to normal 6 s after the fire is out.
- Burning people add to the fire crackle sound.

### Changed
- Repository renamed `bang-phan-ti-hon` → `tiny-chalk-people`. New play URL: https://vovanduc.github.io/tiny-chalk-people/. The old Pages URL no longer works.
- README and CHANGELOG rewritten in English.

## [1.0.0] - 2026-10-13

First release on GitHub Pages: the game known internally as "v4", moved from `community-builder@a3089da`.

### Added
- PixiJS 8.6.6 chalkboard: draw chalk lines; little people walk, climb and fall along them.
- People walk, pause to look around, turn back at walls, and climb on each other into towers up to 5 high.
- Stars, clouds and rain, berry bushes (people eat berries, hearts float up), sun (spin and glow), bubbles that drop items (ladder, mushroom, fire, cow, berry, star), birds.
- Sounds synthesized with Web Audio (no audio files), with nothing loud or startling.
- Test hook `window.__bb`.
- `archive/` prototypes v1–v3, `docs/` specs and build contracts, `knowledge/` project notes.

[Unreleased]: https://github.com/vovanduc/tiny-chalk-people/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/vovanduc/tiny-chalk-people/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/vovanduc/tiny-chalk-people/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/vovanduc/tiny-chalk-people/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/vovanduc/tiny-chalk-people/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/vovanduc/tiny-chalk-people/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/vovanduc/tiny-chalk-people/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/vovanduc/tiny-chalk-people/releases/tag/v1.0.0
