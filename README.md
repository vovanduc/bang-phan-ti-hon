# Tiny Chalk People

A chalkboard toy for small children (play-tested with a 3-year-old). Draw chalk lines with a finger or mouse; tiny chalk people walk on them, climb, stack into towers and react to what you add to the board.

**Play:** https://vovanduc.github.io/tiny-chalk-people/

Inspired by teamLab's *A Blackboard where Little People Live*. Only the **mechanics** are re-created; all drawings and sounds are made from scratch in code (see [ADR-0004](knowledge/decisions/0004-bang-phan-v4-tai-tao-co-che.md)).

## How to play
Designed for toddlers: big touch targets, no reading required, no losing, no scary sounds.

| Do this | What happens |
|---|---|
| Drag on the board | Draw a chalk line. People walk on it, climb gentle slopes, turn at steep walls, fall off the ends. Lines fade after 60 s. |
| Tap a person | They jump and say "ouch". A sleeping person wakes up. |
| Tap a cloud | It rains. Rain grows clover, flowers and berry bushes, and collects in puddles. |
| Tap the sun | A sunbeam makes people in it spin and glow. Sun and rain together make a rainbow people can walk over. |
| Press and hold the sun | Night falls: the board turns dark blue, the moon comes out, fireflies glow, crickets chirp, and most people yawn and lie down to sleep. |
| Tap the moon | Morning comes and everyone wakes up. |
| Tap a star | It bursts into sparkles and drops seeds. |
| Tap a bubble | It pops and drops a ladder, mushroom (trampoline), fire, cow, crocodile, monkey, bear, berry or star. |
| Tap a parachute | Every 2–3 minutes a plane flies over and drops 5–10 gift boxes on parachutes, each wrapped in a bubble. Tap one and the gift falls out: berries, seeds, a mushroom, a ladder or a star. Untapped boxes float down and wait on the ground until someone walks into them. Tap the plane for an extra box. |
| Tap Santa's sleigh | Santa says "ho ho ho" and drops an extra present. Tap a gift wagon and it drops one of its presents; tap the reindeer and Rudolph's nose flashes. |
| Tap a firework box | It lights and fires a long show of fireworks: round bursts, rings, hearts, stars, smiley faces, golden willows. Tap it again while it fires for one more rocket. |
| Tap an animal | Crocodile rolls over giggling, monkey does a backflip, bear hugs the nearest person. |

## What else happens
**People** walk, stop to look around, turn back at walls and climb on each other into towers up to 5 high. They eat ripe berries (hearts float up), get launched by mushrooms, climb ladders, and burst stars when they jump high enough. A paper-bird flock lands on chalk lines to rest.

**Fire**: a person who touches fire catches it and turns black. A small fire burns out by itself. A big fire makes them cry for help ("cứu! cứu!") and run toward water: a raining cloud, a puddle or the crocodile, otherwise the nearest cloud. Without water a big fire lasts about half a minute; rain puts a person out instantly and a fire on the ground in about 3 s. A very big fire spreads to people nearby, who pass it on more weakly. Nobody gets hurt; burned people turn back to normal a few seconds after the fire is out.

**Mushrooms** hop around by themselves and bounce anyone standing next to them when they land.

**Plane**: the first one comes after about a minute, then every 2–3 minutes. Gift boxes that land on the ground open when a person or animal walks into them, or by themselves after 45 s.

**Santa**: about two minutes in, and then every 4–6 minutes, Santa flies across below the clouds in his sleigh, pulled by four reindeer led by red-nosed Rudolph, with 5–10 gift wagons behind. Each wagon drops 3–5 presents wrapped in bubbles; inside can be anything a bubble holds, and every trip brings at least one firework box. Presents that land wait on the ground until someone walks into them.

**Fireworks** burst below the clouds with realistic launch, boom and crackle sounds. Nearby people react: some stop, face the show and raise their arms; others get scared by the noise and run around. In daytime the bursts leave drifting smoke; at night they glow, flash and glitter, and wake up sleepers nearby.

**Day and night** also change by themselves: night falls after about 2.5 minutes of play and morning returns about 90 seconds later.

**Nature**: rain runs downhill and pools. On flat ground it makes shallow puddles people splash through; draw a U-shaped line under a cloud and it fills into a pond. Well-watered clover blooms into flowers, butterflies come to rest on them, and people stop to sniff the flowers and sneeze.

**Animals**: the **crocodile** carries people on its back, snaps at the air, and sprays water on anyone on fire, and swims in big puddles. The **monkey** picks berries and throws them to people, and races up ladders to leap at the stars. The **bear** lets people stack on its head, eats a whole berry bush and falls asleep (its belly becomes a trampoline), and stomps out fires.

🔊 Sound starts after the first tap (browser rule). The speaker button bottom-left mutes it.

## Run locally
- Double-click `index.html` (works from `file://`), or
- `python3 -m http.server 8765`, then open http://127.0.0.1:8765/

The first run needs internet: PixiJS 8.6.6 loads from the jsDelivr CDN.

## Versions
Full notes: [CHANGELOG.md](CHANGELOG.md) · downloads: [GitHub releases](https://github.com/vovanduc/tiny-chalk-people/releases).

| Version | Date | Highlights |
|---|---|---|
| [1.5.0](https://github.com/vovanduc/tiny-chalk-people/releases/tag/v1.5.0) | 2026-10-24 | Santa's sleigh with reindeer and gift wagons; firework shows with real-sounding booms; people watch or run from the noise |
| [1.4.0](https://github.com/vovanduc/tiny-chalk-people/releases/tag/v1.4.0) | 2026-10-23 | Plane drops parachute gift boxes; bigger, longer fires that rain puts out and that spread to many people; hopping mushrooms; corner link removed so toddlers don't leave the game |
| [1.3.0](https://github.com/vovanduc/tiny-chalk-people/releases/tag/v1.3.0) | 2026-10-14 | Day and night: moon, fireflies, crickets, people and bear go to sleep |
| [1.2.0](https://github.com/vovanduc/tiny-chalk-people/releases/tag/v1.2.0) | 2026-10-13 | Rainbow bridge, puddles and ponds, flowers, butterflies |
| [1.1.1](https://github.com/vovanduc/tiny-chalk-people/releases/tag/v1.1.1) | 2026-10-13 | Versioned script URLs so browsers never mix cached files |
| [1.1.0](https://github.com/vovanduc/tiny-chalk-people/releases/tag/v1.1.0) | 2026-10-13 | Crocodile, monkey, bear; people catch fire and run to the rain |
| [1.0.0](https://github.com/vovanduc/tiny-chalk-people/releases/tag/v1.0.0) | 2026-10-13 | First public release: chalk lines, people, towers, stars, rain, berries, sun, bubbles, birds, synthesized sound |

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
| `night.js` | Day and night, moon, fireflies, sleeping |
| `plane.js` | Plane and parachute gift boxes |
| `santa.js` | Santa's sleigh and gift wagons, fireworks |
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
