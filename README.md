# Tiny Chalk People

A chalkboard toy for small children (play-tested with a 3-year-old). Draw chalk lines with a finger or mouse; tiny chalk people walk on them, climb, stack into towers and react to what you add to the board.

**Play:** https://vovanduc.github.io/tiny-chalk-people/

Inspired by teamLab's *A Blackboard where Little People Live*. Only the **mechanics** are re-created; all drawings and sounds are made from scratch in code (see [ADR-0004](knowledge/decisions/0004-bang-phan-v4-tai-tao-co-che.md)).

## How to play
Designed for toddlers: big touch targets, no reading required, no losing, no scary sounds.

| Do this | What happens |
|---|---|
| Drag on the board | Draw a chalk line. People walk on it, climb gentle slopes, turn at steep walls, fall off the ends. Lines fade after 60 s. |
| Tap a person | They jump and say "ouch". |
| Tap a cloud | It rains. Rain grows clover, flowers and berry bushes, and collects in puddles. |
| Tap the sun | A sunbeam makes people in it spin and glow. Sun and rain together make a rainbow people can walk over. |
| Tap a star | It bursts into sparkles and drops seeds. |
| Tap a bubble | It pops and drops a ladder, mushroom (trampoline), fire, cow, crocodile, monkey, bear, berry or star. |
| Tap an animal | Crocodile rolls over giggling, monkey does a backflip, bear hugs the nearest person. |

Fire: a person who touches fire catches it. A small fire burns out by itself. A big fire makes them cry for help and run toward the nearest cloud. Tap that cloud to make rain and put them out. Burned people turn black for a few seconds, then go back to normal. A big fire can spread to one person standing next to them.

Nature: rain runs downhill and pools. On flat ground it makes shallow puddles people splash through; draw a U-shaped line under a cloud and it fills into a pond. Well-watered clover blooms into flowers, butterflies come to rest on them, and people stop to sniff the flowers and sneeze.

Animals: the **crocodile** carries people on its back, snaps at the air, and sprays water on anyone on fire, and swims in big puddles. The **monkey** picks berries and throws them to people, and races up ladders to leap at the stars. The **bear** lets people stack on its head, eats a whole berry bush and falls asleep (its belly becomes a trampoline), and stomps out fires.

🔊 Sound starts after the first tap (browser rule). The speaker button bottom-left mutes it.

## Run locally
- Double-click `index.html` (works from `file://`), or
- `python3 -m http.server 8765`, then open http://127.0.0.1:8765/

The first run needs internet: PixiJS 8.6.6 loads from the jsDelivr CDN.

## Project layout
| Path | Contents |
|---|---|
| `index.html` | Page shell and script load order |
| `core.js` | Constants, collision mask, walking physics, chalk lines, input, game loop, test hook `window.__bb` |
| `people.js` | The little people: walking, towers, ladders, eating, burning |
| `sky.js` | Clouds and rain, stars, sun |
| `ground.js` | Clover, seeds, berry bushes |
| `things.js` | Bubbles, dropped items, birds |
| `animals.js` | Crocodile, monkey, bear |
| `nature.js` | Rainbow, puddles, flowers, butterflies |
| `sound.js` | All sounds, synthesized with Web Audio (no audio files) |
| `archive/` | Early prototypes v1–v3 |
| `docs/` | Analysis of the original artwork, specs, build contracts |
| `knowledge/` | Mechanics reference, runbook, decisions — start at [knowledge/index.md](knowledge/index.md) |

Project notes in `docs/` and `knowledge/` are written in Vietnamese.

## Development
Plain classic scripts, no build step, no modules: every file shares one global scope, so a duplicate top-level name breaks the whole page. Read the [runbook](knowledge/runbooks/bang-phan-ti-hon-van-hanh.md) before changing code, and record mechanic changes in [knowledge/domain/bang-phan-ti-hon.md](knowledge/domain/bang-phan-ti-hon.md).

Check: `node --check *.js`, open the page, drive the game with `__bb.step(n)` (60 steps = 1 s; hidden tabs pause animation), and confirm the console has no errors.

## Deploy and releases
Pushing to `main` deploys: GitHub Pages builds from the repo root in about 30 s.

Versions follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.
- PATCH (`1.0.1`): bug fixes and small tweaks.
- MINOR (`1.1.0`): new mechanics or features that keep existing play working.
- MAJOR (`2.0.0`): changes that break or replace how the game plays.

To release:
1. Move the entries under `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md) to a new version heading.
2. Bump `?v=` on every `<script>` in `index.html` to the new version (GitHub Pages caches files for 10 minutes; without this a browser can mix new and old files and freeze). Commit.
3. Tag and publish:
   ```bash
   git tag -a v1.1.0 -m "v1.1.0"
   git push origin main v1.1.0
   gh release create v1.1.0 --title "v1.1.0" --notes "<paste the CHANGELOG section>"
   ```

## Credits
Concept: [teamLab — Little People series](https://www.team-lab.com/en/blackboard/). Code, drawings and sounds in this repo are original.
