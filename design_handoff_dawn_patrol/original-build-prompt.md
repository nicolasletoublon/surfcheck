# Build prompt: Sydney Eastern Suburbs Surf Dashboard

Build a single-page React + Vite web app called **"Dawn Patrol"** (or suggest a better name) that tells me whether the surf is good right now — and over the next 5 days — at Sydney's Eastern Suburbs beaches. It deploys to GitHub Pages and uses only free, keyless public APIs called directly from the browser.

## Beaches

| Beach | Lat | Lon | Faces | Notes |
|---|---|---|---|---|
| Bondi | -33.8908 | 151.2743 | SE (~135°) | South end more protected; handles S swell well |
| Tamarama | -33.9005 | 151.2703 | ESE (~120°) | Small bay, focuses swell, punchy shorebreak |
| Bronte | -33.9036 | 151.2699 | E (~100°) | Beach break, best on mid tide |
| Coogee | -33.9205 | 151.2585 | ESE (~110°) | Sheltered by Wedding Cake Island; needs bigger swell |
| Maroubra | -33.9500 | 151.2570 | ESE (~115°) | Most swell-exposed; picks up everything |

Use each beach's facing direction to compute offshore/onshore wind and swell exposure.

## Data sources (verified working, no API key)

**Marine — swell, tide, water temp** (Open-Meteo Marine API):

```
https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&hourly=swell_wave_height,swell_wave_direction,swell_wave_period,wave_height,sea_level_height_msl,sea_surface_temperature&forecast_days=5&timezone=auto
```

Returns hourly arrays: `swell_wave_height` (m), `swell_wave_direction` (°), `swell_wave_period` (s), `wave_height` (m, total), `sea_level_height_msl` (m — modelled tide curve; find local highs/lows from it and label it "modelled tide"), `sea_surface_temperature` (°C). Times are local ISO8601.

**Weather — wind, sunrise** (Open-Meteo Forecast API):

```
https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=sunrise,sunset&forecast_days=5&timezone=auto&wind_speed_unit=kn
```

Returns hourly `wind_speed_10m` (kn), `wind_direction_10m` (°), `wind_gusts_10m` (kn); daily `sunrise`/`sunset`.

Fetch both APIs per beach on load (10 requests total), show skeleton loaders while fetching, cache responses in `localStorage` for 30 minutes, and show a clear per-beach error state with retry if a fetch fails. Beaches are close together, so batch requests politely (they're cheap; parallel fetch is fine).

## Surf score (0–10, plus label: Flat / Poor / Fair / Good / Firing)

Compute per beach per hour, from:

1. **Wind (heaviest weight).** Offshore for these beaches ≈ W–NW–SW (i.e. blowing from land, opposite the beach facing). Offshore or <5 kn = full points; cross-shore = partial; onshore >12 kn = heavy penalty.
2. **Swell size**, scored against the selected skill band (see toggle below), using swell height + period (a 0.8 m at 13 s beats 1.2 m at 6 s — factor period into effective size/power).
3. **Swell direction vs beach exposure.** S–SE swell lights up Maroubra/Bondi; Coogee needs size to break at all; penalise swell the beach can't receive.
4. **Swell period.** <7 s weak windswell (penalty), 8–10 s decent, 11 s+ groundswell (bonus).
5. **Tide.** Use the modelled tide curve; mid tide is safest default for all five beaches, slight penalty at dead low/high extremes.

**Skill toggle** (persistent, in the header): Beginner / Intermediate / Experienced. It re-weights live:
- Beginner: 0.5–1.2 m effective ideal; anything overhead or heavy scores low; wind penalties stronger.
- Intermediate: 1–2 m ideal; balanced weights.
- Experienced: 1.5–3 m+ ideal; small days score poor; more tolerance for challenging conditions.

**"Why this score":** each beach card shows a one-line plain-English explanation, e.g. *"Clean 1.4 m SE groundswell at 11 s, 8 kn W offshore, mid tide rising."* Generate it from the same factors as the score — never contradict the number.

## Layout (single page, phone-first)

- **Header:** app name, skill toggle, "updated X min ago".
- **Beach cards, ranked by current score** (best first). Each card at a glance: beach name, big score + label, swell height (m) / period / direction arrow, wind speed + direction arrow with offshore/onshore tag, tide state (rising/falling, next high/low time), and the "why" line.
- **Tap to expand a card:** 5-day outlook — a compact day-by-day strip (daily best score, swell range, dominant wind) plus an hourly chart for swell height and wind overlaid with the tide curve for today + tomorrow.
- **Per-beach extras** in the expanded view: water temp with wetsuit hint (>21° springsuit, 18–21° 3/2, 15–18° 3/2 + booties, <15° 4/3), sunrise/first light (first light ≈ sunrise − 25 min), and a webcam link-out (use placeholder links to each beach's Swellnet surfcam page; make the URLs an easily editable constant).

## Design direction

Surf-culture aesthetic: deep ocean-blue-to-teal gradients, warm coral/sand accent for scores and highlights, generous rounded cards, a subtle wave motif (SVG divider or animated gradient), bold condensed display font for scores with a clean sans for data. Direction arrows should actually rotate to the real bearing. Score colours: grey (flat) → amber (fair) → green (good) → something special for "Firing". Dark-friendly enough to check at 5:45 am. Delightful but data-first — numbers always legible at arm's length on a phone.

## Tech & deployment

- React 18 + Vite, no backend, no API keys, minimal dependencies (charts may use a tiny lib or hand-rolled SVG — your call).
- All units metric: waves in metres, wind in knots, temps in °C.
- Include a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys to GitHub Pages on push to `main`, and set Vite's `base` correctly for a project-pages URL (`/<repo-name>/`).
- Beach definitions (name, coords, facing, exposure notes, webcam URL) live in one `beaches.js` config file so adding a beach is a one-line change.
- README with setup + deploy steps.
