# Letouswell

A phone-first surf dashboard that ranks beaches by a computed 0–10 surf score, shows a 5-day outlook, and answers "where should I paddle out this morning?" 🌊

Two regions, switchable in the header (persisted): **Sydney** (Bondi, Tamarama, Bronte, Maroubra, Manly, Dee Why) **Byron Bay** (The Pass, Wategos, Main/Wreck, Tallows, Suffolk Park, Broken Head) and **Canggu** (Batu Bolong, Berawa, Echo Beach, Pererenan — on Bali time; regions carry their own timezone). Adding a region is a `REGIONS` entry plus beaches tagged with its id in `src/beaches.js` — and, for shark coverage, a coastal box in `scripts/build-shark-data.mjs`.

**Live:** https://nicolasletoublon.github.io/surfcheck/

## Features

**Shark watch:** a card up top lists recent shark sightings near the tracked beaches (NSW SharkSmart / DPIRD drone and tagged-shark reports), and any beach with a sighting in the last 7 days gets a fin badge — red if it's under 24 h old and the beach hasn't reopened. The official feed is origin-locked, so a scheduled GitHub Action (`.github/workflows/shark-data.yml`, every 30 min) fetches it server-side via `scripts/build-shark-data.mjs` and publishes a trimmed `sharks.json` to the `shark-data` branch, which the app reads through raw.githubusercontent.com. If the branch or feed is unavailable the feature simply hides itself.

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

Weighted 0–10 per hour, calibrated against Surfline ratings: wind 45% (offshore = beach facing + 180°; strong offshore penalised past ~12 kn), swell size 15% (gaussian around the skill band's ideal, asymmetric — undersized is far less punished than oversized), direction 15%, period 15%, tide 10% (mid best). Each beach is scored with whichever of Open-Meteo's two swell trains delivers the most energy through its gaussian exposure window (off-axis swell arrives smaller, not absent). A continuous size gate zeroes out truly flat days without flooring small clean ones. Labels: <2 Flat, <4 Poor, <7 Fair, <8.5 Good, ≥8.5 Firing.

---

Design: Claude Design handoff (`design_handoff_dawn_patrol/`) · Build: Claude
