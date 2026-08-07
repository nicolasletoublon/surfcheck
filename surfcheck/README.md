# Dawn Patrol 🌊

A phone-first surf dashboard for Sydney's Eastern Suburbs beaches — Bondi, Tamarama, Bronte, Coogee, and Maroubra. Ranks beaches by a computed 0–10 surf score, shows a 5-day outlook, and answers "where should I paddle out this morning?"

**Live:** https://nicolasletoublon.github.io/surfcheck/

## Features

Each beach shows an estimated breaking-face height — what you'd actually eyeball from the sand, trough to lip — as a "smaller waves to bigger sets" range with a body-relative label (e.g. "faces 0.7–1.3 m · chest–shoulder"). It's the Komar & Gaughan (1972) breaker formula fed with the swell that survives each beach's exposure/direction filter, with the set range from Rayleigh wave statistics (typical ≈ 0.7×, sets ≈ 1.3× the significant breaker). Heuristic, not bathymetry-aware — sandbanks will beg to differ.

Live swell, wind, and tide per beach with a surf-quality score calibrated to a skill level you pick (Beginner / Intermediate / Experienced — the toggle re-weights scoring instantly). A "best window in the next 48 h" banner, pinnable favourite beaches, per-beach 5-day forecast with an hourly swell/wind/tide chart (interactive: hover for the score and conditions at any hour, with a NOW marker and green "good window" bands), water temp with wetsuit hint, first-light time, and surfcam links (free council/SLSC cams where they exist, Swellnet otherwise).

On screens ≥1000px wide it switches to a desktop layout: pinned beaches (or the top two by score) expand into full always-open panels — no tapping into a sheet — with the rest as compact cards below. Charts are [Recharts](https://recharts.org) (v2 — the v3 tooltip doesn't fire in this setup).

## Data

All data comes from free, keyless [Open-Meteo](https://open-meteo.com) APIs, fetched directly from the browser and cached in `localStorage` for 30 minutes:

- **Marine API** — swell height/direction/period, sea level (modelled tide), water temperature
- **Forecast API** — wind speed/direction (knots), sunrise/sunset

The tide curve is model-derived (`sea_level_height_msl`), not official BoM tide tables — fine for surf checks, don't navigate a boat with it. Scores are a heuristic; always check the cam before you drive.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Pushes to `main` build and deploy automatically via GitHub Actions.

One-time setup: in the repo go to **Settings → Pages** and set **Source** to **GitHub Actions**. That's it.

If you rename the repo, update `base` in `vite.config.js` to match (`/<repo-name>/`).

## Add a beach

One line in `src/beaches.js` — coords, the direction the beach faces, which swell direction suits it best, how exposed it is, and a webcam URL. Everything else (scoring, cards, forecast) follows automatically.

## How the score works

Weighted 0–10 per hour: wind 35% (offshore = beach facing + 180°, penalties scale with skill), swell size 20% (gaussian around the skill band's ideal, using period-weighted effective height × beach exposure), swell direction vs beach exposure 25%, period 10% (<7 s windswell penalised, ≥11 s groundswell bonus), tide 10% (mid tide best). Tiny break heights cap the score (Flat). Labels: <2 Flat, <4 Poor, <7 Fair, <8.5 Good, ≥8.5 Firing.

---

Design: Claude Design handoff (`design_handoff_dawn_patrol/`) · Build: Claude
