# GTA VI Trophy Atlas

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/rifanrstu/gta6-trophy-guide-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/rifanrstu/gta6-trophy-guide-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI — 1 platinum, 2 gold, 6 silver, 46 bronze. Static files only: open it in a desktop browser with the network off and everything still works, because the app loads nothing from anywhere else.

**Entry for make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01)** — “GTA VI Trophy Atlas”, by @senopati9316.

## What it does

- **Checklist & guides** — every trophy with its official name, description and grade as PlayStation publishes them, plus a guide to each one written for this atlas in our own words. Each guide names its sources beside it (the official list on Exophase and PSNProfiles; PowerPyx, Push Square and GTABase where their reporting is used). A guide whose trigger is not yet confirmed says so plainly instead of inventing a step.
- **Tracker** — tick trophies off and the progress is saved in the browser (localStorage), with per-trophy counters for the counted trophies (250 stunts, 42 Shooting Range golds, 18 meditation spots, 100 WAiNK locations…), personal notes, and export/import of the whole progress file.
- **Filters & search** — by kind (story, missable, collectibles, activities, side strands, world & crime, and online — the official list has no online trophies, and the app says so), by grade, by text, and a hide-earned switch.
- **Spoiler shield** — when on, story trophies you have not earned yet show neither name nor description, in the list or in the guide pane.
- **Roadmap to the platinum** — four steps built from the official descriptions: story first (with the Chapter 1 warning), the 100% checklist and its partial targets, strands and money clean-up, then the platinum check. About 200 hours, one playthrough, no difficulty or online trophies.
- **Missables** — flagged from the official descriptions and cited reporting: exactly one potentially missable trophy, Positive Mental Attitude, whose first meditation spot at Jason's house is reported gone after Chapter 1 — plus the partner trophies to attempt while both protagonists are together, and the per-chapter manual-save habit that protects a no-replay run.
- **Next up planner** — reads your saved progress and queues what to do next: missable first, then story, then counters already moving, then clean-up.

## Run it

```sh
node serve.ts          # serves app/ at http://localhost:8080
```

Or serve the `app/` folder with any static file server. No build step, no dependencies, no network requests at run time.

## Hand it in (how the entry program works)

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored library in `vendor/makefun-frontend.ts`, exactly as the make.fun gate expects:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Data & credits

Trophy names, descriptions and grades: the official PS5 list, via [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi). Guide reporting cited per trophy: [PowerPyx](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/), [Push Square](https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap), [GTABase](https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series). Sources are cited, never copied; all guide text here is original to this repository. No Rockstar Games logo, artwork, box art or game screenshots are used.

## License

MIT — see `LICENSE`.
