# GTA VI Trophy Atlas — The Leonida Ledger

An offline guide and tracker for the 55 PlayStation 5 trophies of
Grand Theft Auto VI, built as plain static files. Open it, and the
whole book is in front of you: every official trophy with its name,
description and grade, a guide to each in our own words with its
sources named beside it, a three-step breakdown, a timing note that
says when the trophy is best attempted, and a confidence badge that
separates confirmed list facts from play advice.

This revision (the Leonida Ledger build) reworks the presentation
around a dusk-blue ledger look and keeps every feature of the atlas:
the tracker, the roadmap, the missable watch and the planner all read
from the same saved progress.

## What it does

- **Checklist with memory.** Tick trophies off and the ledger saves in
  the browser (localStorage). Tracked counters (PlayStation's own
  targets, where a trophy has one) can be stepped up and down, and a
  counter that reaches its target marks the trophy earned.
- **Filters and search.** Narrow the book by kind (story, missable,
  collectibles, activities, counters, side jobs, open world, online),
  by grade, by earned state, or by free text.
- **Spoiler shield.** While the shield is on, unearned story trophies
  show neither name nor description anywhere — checklist, roadmap and
  planner alike — until the moment they are earned.
- **Roadmap to the platinum.** Four stages built from the official
  descriptions, each with your own progress drawn in and a Watch out
  line: the story spine, the open-world rounds, the long tallies, and
  the finale with its missable check.
- **Missable watch.** An honest page: exactly one of the 55 trophies
  can be missed on a single run — Positive Mental Attitude, a Chapter 1
  moment on the balcony at Jason's house — and it is shown in full
  rather than padded out with invented warnings.
- **Next-up planner.** Six recommendations ranked from your ledger:
  the open missable first, counters already under way next, then the
  earliest unfinished roadmap stage.
- **Save & share.** Export the whole ledger to a JSON file, import it
  back on another machine, copy a one-line progress summary, or reset.

## Running it

Serve the `app/` folder with any static file server and open
`index.html` in a desktop browser. With Node installed, the bundled
preview server does it in one step:

```
node serve.ts
```

then visit http://localhost:8080/. The guide works with the network
off; every script, style and data file it loads ships inside `app/`.

## Handing it in

```
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` first validates that all 55 trophies carry a guide, at
least three steps, a timing note and a confidence badge, then copies
`app/` and `screenshots/` to the output directory and writes
`dossier.json` there with the kit's `vendor/makefun-frontend.ts`
library, byte for byte as the scorer rebuilds it.

## Data and sources

The trophy list — names, descriptions, grades, hidden flags and
tracked targets — is the official PlayStation 5 list as published by
Exophase (https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/)
and PSNProfiles (https://psnprofiles.com/trophies/43531-grand-theft-auto-vi),
the two agreeing on every name, description and grade. Each trophy's
guide names its sources beside the text; guide prose is original to
this entry and is never copied from another guide. The confidence
badges state plainly what has been checked: list data against the
published list, play advice as our own reading of the official
descriptions.

No Rockstar Games logo, official artwork or game imagery appears
anywhere in the app; the look is this entry's own.

## Layout

- `app/index.html` — the page shell
- `app/style.css` — the dusk ledger theme
- `app/js/data.js` — catalogue loading, kind/grade tables, roadmap stages
- `app/js/store.js` — localStorage progress, counters, notes, export/import
- `app/js/views.js` — checklist, detail pane, roadmap, missables, planner, save page
- `app/js/main.js` — boot, routing and event wiring
- `app/data/trophies.json` — the 55 trophies with guides, steps, timing and badges
- `screenshots/` — four real renders of the running app
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged

## License

MIT — see `LICENSE`.
