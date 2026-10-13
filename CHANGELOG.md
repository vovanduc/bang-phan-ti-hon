# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [Semantic Versioning](https://semver.org/).

The names v1–v3 in `archive/` and "v4" in `docs/` are internal prototype names, not release versions.

## [Unreleased]

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

[Unreleased]: https://github.com/vovanduc/tiny-chalk-people/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/vovanduc/tiny-chalk-people/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/vovanduc/tiny-chalk-people/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/vovanduc/tiny-chalk-people/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/vovanduc/tiny-chalk-people/releases/tag/v1.0.0
