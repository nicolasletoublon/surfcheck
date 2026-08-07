// Open-Meteo fetching + 30-minute localStorage cache.
// Both APIs are free and keyless. Times are requested in Australia/Sydney local
// time so array index = hours since Sydney midnight of day 0.

import { TIMEZONE } from './beaches.js';

const CACHE_TTL = 30 * 60 * 1000; // 30 min
const FORECAST_DAYS = 5;

const marineUrl = b =>
  `https://marine-api.open-meteo.com/v1/marine?latitude=${b.lat}&longitude=${b.lon}` +
  `&hourly=swell_wave_height,swell_wave_direction,swell_wave_period,sea_level_height_msl,sea_surface_temperature` +
  `&forecast_days=${FORECAST_DAYS}&timezone=${encodeURIComponent(TIMEZONE)}`;

const forecastUrl = b =>
  `https://api.open-meteo.com/v1/forecast?latitude=${b.lat}&longitude=${b.lon}` +
  `&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=sunrise,sunset` +
  `&forecast_days=${FORECAST_DAYS}&timezone=${encodeURIComponent(TIMEZONE)}&wind_speed_unit=kn`;

// Current date/time in Sydney regardless of the visitor's timezone.
export function sydneyNow() {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: TIMEZONE,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(new Date());
  const get = t => Number(parts.find(p => p.type === t)?.value ?? 0);
  const hour = get('hour') % 24; // some engines report midnight as 24
  return {
    nowT: hour + get('minute') / 60,
    baseDate: new Date(get('year'), get('month') - 1, get('day')),
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
  };
}

function readCache(key, dateKey) {
  try {
    const raw = JSON.parse(localStorage.getItem(key));
    // Cache is only valid same-Sydney-day (array index 0 must be today) and within TTL.
    if (raw && raw.dateKey === dateKey && Date.now() - raw.ts < CACHE_TTL) return raw;
  } catch { /* ignore */ }
  return null;
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.reason || 'API error');
  return json;
}

const parseHourFloat = iso => {
  // "2026-08-07T06:42" -> 6.7
  const [h, m] = iso.slice(11, 16).split(':').map(Number);
  return h + m / 60;
};

// Fill nulls (Open-Meteo occasionally returns null at range edges) with the previous value.
function fillNulls(arr, fallback = 0) {
  let last = fallback;
  return arr.map(v => (v == null ? last : ((last = v), v)));
}

// Merge the two responses into the hour records the engine expects.
function assemble(beach, marine, forecast) {
  const mh = marine.hourly, fh = forecast.hourly;
  const len = Math.min(mh.time.length, fh.time.length, FORECAST_DAYS * 24);
  const swellH = fillNulls(mh.swell_wave_height);
  const swellP = fillNulls(mh.swell_wave_period, 8);
  const swellDir = fillNulls(mh.swell_wave_direction, 135);
  const tideArr = fillNulls(mh.sea_level_height_msl);
  const windSpd = fillNulls(fh.wind_speed_10m);
  const windDir = fillNulls(fh.wind_direction_10m);
  let tMin = Infinity, tMax = -Infinity;
  for (let i = 0; i < len; i++) { tMin = Math.min(tMin, tideArr[i]); tMax = Math.max(tMax, tideArr[i]); }
  const tSpan = tMax - tMin || 1;
  const hours = [];
  for (let i = 0; i < len; i++) {
    hours.push({
      t: i,
      swellH: swellH[i], swellP: Math.max(1, swellP[i]), swellDir: swellDir[i],
      windSpd: windSpd[i], windDir: windDir[i],
      tide: tideArr[i], tideN: (tideArr[i] - tMin) / tSpan,
    });
  }
  const sun = forecast.daily.sunrise.map((sr, i) => ({
    sr: parseHourFloat(sr),
    ss: parseHourFloat(forecast.daily.sunset[i]),
  }));
  const sstArr = fillNulls(mh.sea_surface_temperature, 18);
  const iNow = Math.min(len - 1, Math.floor(sydneyNow().nowT));
  return { beach, hours, sun, sst: sstArr[iNow] };
}

// Fetch (or serve cached) data for one beach.
export async function fetchBeach(beach) {
  const { dateKey } = sydneyNow();
  const key = `dp-data-${beach.id}`;
  const cached = readCache(key, dateKey);
  if (cached) return { ...assemble(beach, cached.marine, cached.forecast), fetchedAt: cached.ts };
  const [marine, forecast] = await Promise.all([getJson(marineUrl(beach)), getJson(forecastUrl(beach))]);
  const ts = Date.now();
  try {
    localStorage.setItem(key, JSON.stringify({ ts, dateKey, marine, forecast }));
  } catch { /* storage full/blocked — fine, just don't cache */ }
  return { ...assemble(beach, marine, forecast), fetchedAt: ts };
}
