// Fetches NSW SharkSmart shark-activity feeds (the data behind the official
// map at map.pivotanalytics.com.au, embedded on sharksmart.nsw.gov.au) and
// writes a trimmed sharks.json for the app.
//
// The feeds are origin-locked, so the browser can't call them directly from
// GitHub Pages — a scheduled GitHub Action runs this server-side instead and
// publishes the result to the `shark-data` branch, which the app reads via
// raw.githubusercontent.com (CORS-open).
//
// Data: DPI Fisheries / SLSNSW sightings and tagged-shark alerts, © NSW DPIRD.

import { writeFileSync } from 'node:fs';

const BASE = 'https://ih.pivotanalytics.com.au/webhook';
const ORIGIN = 'https://map.pivotanalytics.com.au';
const KEEP_DAYS = 14;

async function getFeed(name) {
  const res = await fetch(`${BASE}/${name}`, { headers: { Origin: ORIGIN } });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const text = await res.text();
  if (!text.trim()) return { features: [] };
  return JSON.parse(text);
}

// detectionDate comes in two shapes: "2026-06-16 03:08:25.0" (UTC, despite no
// zone marker — verified against the local times quoted in the messages) and
// plain ISO "2026-08-07T05:04:18.408Z".
function parseDate(s) {
  if (!s) return null;
  const iso = s.includes('T') ? s : s.replace(' ', 'T').replace(/\.\d+$/, '') + 'Z';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

const cutoff = Date.now() - KEEP_DAYS * 864e5;

function trimFeature(f) {
  const p = f.properties ?? {};
  const [lon, lat] = f.geometry?.coordinates ?? [];
  if (lon == null || lat == null) return null;
  const notes = (p._notifications ?? [])
    .filter(n => n.message && n.title !== 'Drone Location')
    .map(n => ({ t: parseDate(n.detectionDate)?.toISOString(), msg: n.message.replace(/\s+/g, ' ').trim(), src: n.title }))
    .filter(n => n.t && new Date(n.t).getTime() >= cutoff)
    .sort((a, b) => (a.t < b.t ? 1 : -1));
  if (!notes.length) return null;
  return { beach: p.beachName ?? '', suburb: p.suburb ?? '', lat, lon, notes };
}

const [sls, dpi, events] = await Promise.all([
  getFeed('SLSNSW2.geojson'), getFeed('DPINSW.geojson'), getFeed('EVENTS.geojson'),
]);

// Merge SLS + DPI features by location, deduping identical messages.
const byKey = new Map();
for (const f of [...(sls.features ?? []), ...(dpi.features ?? [])]) {
  const t = trimFeature(f);
  if (!t) continue;
  const key = `${t.beach}|${t.suburb}`;
  const prev = byKey.get(key);
  if (!prev) { byKey.set(key, t); continue; }
  const seen = new Set(prev.notes.map(n => n.msg));
  prev.notes.push(...t.notes.filter(n => !seen.has(n.msg)));
  prev.notes.sort((a, b) => (a.t < b.t ? 1 : -1));
}

const activeEvents = (events.features ?? [])
  .map(trimFeature)
  .filter(Boolean);

const out = {
  updatedAt: new Date().toISOString(),
  source: 'NSW SharkSmart (DPIRD) — sharksmart.nsw.gov.au',
  keepDays: KEEP_DAYS,
  beaches: [...byKey.values()],
  events: activeEvents,
};

writeFileSync('sharks.json', JSON.stringify(out));
console.log(`sharks.json: ${out.beaches.length} beaches with activity in the last ${KEEP_DAYS} days, ${activeEvents.length} active events`);
