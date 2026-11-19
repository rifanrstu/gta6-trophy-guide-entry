[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/rifanrstu/gta6-trophy-guide-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/rifanrstu/gta6-trophy-guide-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Dusk Ledger — a GTA VI trophy guide and tracker

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01). Open it in a desktop browser with the network off and everything still works: the whole guide is plain static files under `app/`, with no build step and no requests to anywhere.

## What it does

- **Checklist** — every trophy with its official name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze). Tick trophies off as you earn them; progress saves in the browser's local storage as you go.
- **A guide to each trophy** — open any trophy and its pane shows the official description, a guide in our own words, a three-step breakdown, a timing line, a confidence badge, and the sources each fact comes from.
- **Counters** — the 19 trophies PlayStation counts (a target and a label each) carry a working counter with a progress bar; fill the counter and the trophy ticks itself.
- **Notes** — a private note per trophy, saved with the rest of your progress.
- **Filters and search** — by grade, and by kind: story, missable, collectibles, activities, counters, side work, open world (and online, which this list happens to have none of).
- **Spoiler shield** — with the shield on, unearned story trophies show neither name nor description until you earn them.
- **Roadmap** — the road to the platinum in four stages, each with its own progress bar and a Watch out line: story, side threads, sweeps and tallies, open-world residue.
- **Missables** — read strictly from the official descriptions, exactly one trophy has a window that closes: *Positive Mental Attitude*, in Chapter 1, on the balcony at Jason's house. The page says why the other 54 were cleared.
- **Next up** — a planner that reads your progress and queues what to chase next: counters already in motion first, then the earliest open stage.
- **Save** — export your whole progress (ticks, counters, notes) as one JSON file, import it back anywhere, or reset the ledger.

## Sources

Names, descriptions, grades and hidden flags are the official list as published by [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/); progress targets follow [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi). Each trophy's pane names its sources beside its guide. The guides themselves are original wording written for this entry, drawn from the official descriptions — cited, never copied. No Rockstar Games logo, artwork or game screenshots appear anywhere; the dusk look is this project's own.

## Run it

```sh
node serve.ts          # serves app/ at http://localhost:8917
```

Any static file server pointed at `app/` does the same job. Node 22 or later runs the TypeScript directly; nothing is installed.

## Hand it in

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` first validates that all 55 trophies carry a guide, three steps, a timing line and a confidence value, then copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with `vendor/makefun-frontend.ts`, the kit's library, left byte-for-byte unchanged.

## Layout

- `app/index.html` — the shell: masthead, progress and section tabs
- `app/style.css` — the dusk theme
- `app/js/data.js` — loads `app/data/trophies.json`; grades, kinds, roadmap stages, source lines
- `app/js/store.js` — localStorage progress, counters, notes, export / import / reset, the `?demo=13` screenshot seed
- `app/js/views.js` — the checklist, guide pane, roadmap, missables, planner and save screens
- `app/js/main.js` — boot, tab routing and event wiring
- `app/data/trophies.json` — the 55 trophies with their guides, steps, timing and confidence
- `screenshots/` — four real renders of the running app at 1280×800, listed in `shots.json`

## License

MIT — see `LICENSE`.
