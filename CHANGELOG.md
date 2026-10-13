# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [Semantic Versioning](https://semver.org/).

The names v1–v3 in `archive/` and "v4" in `docs/` are internal prototype names, not release versions.

## [Unreleased]

### Added
- Burning: a person who touches fire catches it (random strength). A small fire burns out by itself in a few seconds. A big fire makes the person cry for help ("cứu! cứu!"), drop off any tower and run toward the nearest cloud, raining clouds first.
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

[Unreleased]: https://github.com/vovanduc/tiny-chalk-people/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/vovanduc/tiny-chalk-people/releases/tag/v1.0.0
