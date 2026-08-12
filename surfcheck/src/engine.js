// Dawn Patrol — surf-score engine.
// Ported from the Claude Design handoff (design_handoff_dawn_patrol/beaches.js),
// with the mock generator replaced by real Open-Meteo hourly data.
//
// An "hour" record (built in api.js) looks like:
// { t, swellH (m), swellP (s), swellDir (°from), windDir (°from), windSpd (kn),
//   tide (m MSL), tideN (0–1 normalised over the 5-day window) }

import { SKILLS } from './beaches.js';

const C16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
export const compass = d => C16[Math.round((((d % 360) + 360) % 360) / 22.5) % 16];
export const angDiff = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const tideStage = n => (n < 0.3 ? 'low' : n > 0.7 ? 'high' : 'mid');

// How much of the open-ocean swell reaches this beach's lineup (0–1),
// from base exposure and how far the swell angle sits off the beach's best direction.
// Gaussian falloff rather than a hard cutoff: refraction wraps swell around
// headlands, so off-axis swell arrives smaller, not absent (a hard cutoff had
// us calling Bondi "flat" on an ENE swell Surfline rated FAIR at 1–3 ft).
// Only swell actually heading away from the coast (>135° off) fades to zero.
export function exposure(beach, hr) {
  const dd = angDiff(hr.swellDir, beach.bestDir);
  const falloff = Math.exp(-0.5 * (dd / beach.dirWidth) ** 2);
  const seaward = clamp((165 - dd) / 30, 0, 1);
  return beach.expoBase * falloff * seaward;
}

// Pick whichever swell train (primary or secondary) delivers the most breaking
// energy at this beach. Byron's bay spots often ride a secondary ENE train
// while the primary S swell marches straight past the cape — scoring only the
// primary had Wategos "flat" on a day Surfline called Fair.
export function pickSwell(beach, hr) {
  const prim = { swellH: hr.swellH, swellP: hr.swellP, swellDir: hr.swellDir };
  if (!hr.s2H) return prim;
  const sec = { swellH: hr.s2H, swellP: hr.s2P, swellDir: hr.s2Dir };
  const energy = s => s.swellH * Math.sqrt(s.swellP / 10) * exposure(beach, s);
  return energy(sec) > energy(prim) ? sec : prim;
}

// Estimated breaking-face height (trough to lip, what you eyeball from the sand).
// Komar & Gaughan (1972): Hb = 0.39 g^(1/5) (T·H0²)^(2/5), fed with the swell that
// actually reaches the lineup. Rayleigh wave-height stats give the session range:
// typical waves ≈ 0.7×Hb, bigger sets ≈ 1.3×Hb.
export function faceHeight(beach, hr) {
  const sw = pickSwell(beach, hr);
  const h0 = sw.swellH * exposure(beach, sw);
  if (h0 < 0.05) return { lo: 0, hi: 0 };
  const hb = 0.39 * 9.81 ** 0.2 * (sw.swellP * h0 * h0) ** 0.4;
  return { lo: hb * 0.7, hi: hb * 1.3 };
}

// Body-relative label, judged on the set waves (the ones that decide if you paddle out).
export const faceLabel = hi =>
  hi < 0.3 ? 'flat' :
  hi < 0.6 ? 'ankle–knee' :
  hi < 0.9 ? 'knee–waist' :
  hi < 1.2 ? 'waist–chest' :
  hi < 1.5 ? 'chest–shoulder' :
  hi < 1.9 ? 'head high' :
  hi < 2.4 ? 'overhead' :
  hi < 3.2 ? 'well overhead' : 'double overhead+';

// ---- Score. Weights re-calibrated against Surfline ratings (Aug 2026):
// cleanliness dominates — a small glassy day should read Fair/Good, not Flat.
// wind .45, size .15, direction .15, period .15, tide .10
export function scoreHour(beach, hr, skillName) {
  const s = SKILLS[skillName];
  const sw = pickSwell(beach, hr);
  const eff = sw.swellH * Math.sqrt(sw.swellP / 10); // period-weighted effective height
  const expo = exposure(beach, sw);
  const breakH = eff * expo;
  const offDir = (beach.facing + 180) % 360;
  const wd = angDiff(hr.windDir, offDir);
  let wind;
  if (hr.windSpd < 5) wind = 9;
  // Offshore holds waves up, but strong offshore chops the face and makes the
  // paddle miserable — penalise past ~12 kn (Surfline reads 25 kn offshore as Fair).
  else if (wd <= 55) wind = 9.5 - Math.max(0, hr.windSpd - 12) * 0.3;
  else if (wd <= 115) wind = 6 - hr.windSpd * 0.25 * s.windMult;
  else wind = 5 - hr.windSpd * 0.5 * s.windMult;
  wind = clamp(wind, 0, 10);
  // Asymmetric size preference: undersized waves are far less of a problem than
  // oversized ones — small-but-clean still surfs well at every skill level.
  const spread = breakH < s.center ? s.spread * 1.7 : s.spread;
  const size = 10 * Math.exp(-(((breakH - s.center) / spread) ** 2));
  const dir = Math.min(10, expo * 10);
  const period = sw.swellP < 7 ? 3 : sw.swellP < 8 ? 5 : sw.swellP < 10 ? 7 : sw.swellP < 11 ? 8.5 : 10;
  const tide = 10 - 3.5 * (2 * Math.abs(hr.tideN - 0.5)) ** 2;
  // "Is there actually a wave" gate: fades in from 0 (dead flat, ≤0.08 m) to full
  // weight (clearly rideable, ≥0.35 m). Keeps wind/tide alone (which don't measure
  // size) from faking a score on a truly flat day, without flooring small clean days.
  const sizeGate = clamp((breakH - 0.08) / 0.27, 0, 1);
  let score = (0.45 * wind + 0.15 * size + 0.15 * dir + 0.15 * period + 0.1 * tide) * sizeGate;
  return {
    score: Math.round(score * 10) / 10,
    breakH,
    windF: wind,
    windTag: wd <= 55 ? 'offshore' : wd <= 115 ? 'cross-shore' : 'onshore',
  };
}

export const scoreLabel = s => (s < 2 ? 'Flat' : s < 4 ? 'Poor' : s < 7 ? 'Fair' : s < 8.5 ? 'Good' : 'Firing');

export const wetsuit = t => (t > 21 ? 'Springsuit' : t >= 18 ? '3/2 steamer' : t >= 15 ? '3/2 + booties' : '4/3 steamer');

export function fmtClock(h) {
  const h24 = ((h % 24) + 24) % 24;
  let hh = Math.floor(h24), mm = Math.round((h24 - hh) * 60);
  if (mm === 60) { mm = 0; hh = (hh + 1) % 24; }
  const ap = hh < 12 ? 'am' : 'pm';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return mm === 0 ? `${h12} ${ap}` : `${h12}:${String(mm).padStart(2, '0')} ${ap}`;
}

export function whyLine(beach, hr, sc, rising) {
  if (sc.breakH < 0.15) {
    return `Not really breaking — this swell angle misses ${beach.name}.`;
  }
  const clean = sc.windTag === 'offshore' ? 'Clean' : sc.windF >= 5 ? 'Workable' : 'Bumpy';
  const kind = hr.swellP >= 11 ? 'groundswell' : hr.swellP >= 8 ? 'swell' : 'windswell';
  const stage = tideStage(hr.tideN);
  const dirn = rising ? 'rising' : 'falling';
  return `${clean} ${hr.swellH.toFixed(1)} m ${compass(hr.swellDir)} ${kind} at ${Math.round(hr.swellP)} s, ${Math.round(hr.windSpd)} kn ${compass(hr.windDir)} ${sc.windTag}, ${stage} tide ${dirn}.`;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function dayLabel(baseDate, d) {
  if (d === 0) return 'Today';
  const dt = new Date(baseDate.getTime() + d * 864e5);
  return (d === 1 ? 'Tmrw' : DOW[dt.getDay()]) + ' ' + dt.getDate();
}

// ---- Real-tide helpers (hourly resolution)
export const tideRisingAt = (hours, i) => {
  const a = hours[Math.min(i, hours.length - 2)];
  const b = hours[Math.min(i + 1, hours.length - 1)];
  return b.tide > a.tide;
};

export function nextTideExtreme(hours, t) {
  for (let i = Math.max(1, Math.ceil(t)); i < hours.length - 1; i++) {
    const p = hours[i - 1].tide, c = hours[i].tide, n = hours[i + 1].tide;
    if (c >= p && c >= n && c !== n) return { kind: 'high', t: i };
    if (c <= p && c <= n && c !== n) return { kind: 'low', t: i };
  }
  return null;
}

// ---- Model
// datasets: [{ beach, hours, sun: [{sr, ss}×5], sst }]  (from api.js)
export function buildModel(datasets, skillName, nowT, baseDate) {
  const beaches = datasets.map(({ beach: b, hours, sun, sst }) => {
    const iNow = clamp(Math.floor(nowT), 0, hours.length - 1);
    const hr = hours[iNow];
    const rising = tideRisingAt(hours, iNow);
    const sc = scoreHour(b, hr, skillName);
    const ext = nextTideExtreme(hours, nowT);
    const days = [], hourly = [];
    for (let d = 0; d < 5; d++) {
      const { sr, ss } = sun[Math.min(d, sun.length - 1)];
      let best = 0, swMin = 99, swMax = 0, vx = 0, vy = 0, spdSum = 0, n = 0;
      const hrs = [];
      for (let h = 0; h < 24; h++) {
        const t = d * 24 + h;
        if (t >= hours.length) break;
        const hh = hours[t];
        const s2 = scoreHour(b, hh, skillName);
        const f2 = faceHeight(b, hh);
        const sw2 = pickSwell(b, hh); // display the train this beach actually rides
        hrs.push({
          h, score: s2.score,
          swellH: sw2.swellH, swellP: sw2.swellP, swellDir: sw2.swellDir,
          windSpd: hh.windSpd, windDir: hh.windDir, windTag: s2.windTag, tideN: hh.tideN,
          faceLo: f2.lo, faceHi: f2.hi,
        });
        if (h >= Math.floor(sr) && h <= Math.ceil(ss)) {
          best = Math.max(best, s2.score);
          swMin = Math.min(swMin, sw2.swellH);
          swMax = Math.max(swMax, sw2.swellH);
          const r = (hh.windDir * Math.PI) / 180;
          vx += Math.sin(r) * hh.windSpd; vy += Math.cos(r) * hh.windSpd; spdSum += hh.windSpd; n++;
        }
      }
      const avgDir = ((Math.atan2(vx, vy) * 180) / Math.PI + 360) % 360;
      days.push({
        d,
        best: Math.round(best * 10) / 10,
        label: scoreLabel(best),
        lbl: dayLabel(baseDate, d),
        swMin, swMax,
        windLbl: n ? `${compass(avgDir)} ${Math.round(spdSum / n)} kn` : '—',
      });
      hourly.push(hrs);
    }
    const swNow = pickSwell(b, hr);
    return {
      id: b.id, name: b.name, notes: b.notes, cams: b.cams, sst,
      score: sc.score, label: scoreLabel(sc.score), why: whyLine(b, { ...hr, ...swNow }, sc, rising),
      face: (() => { const f = faceHeight(b, hr); return { ...f, label: faceLabel(f.hi) }; })(),
      swell: { h: swNow.swellH, p: swNow.swellP, dirFrom: swNow.swellDir, going: (swNow.swellDir + 180) % 360 },
      wind: { spd: hr.windSpd, dirFrom: hr.windDir, going: (hr.windDir + 180) % 360, tag: sc.windTag },
      tide: {
        stage: tideStage(hr.tideN),
        rising,
        nextKind: ext ? ext.kind : null,
        nextT: ext ? ext.t : null,
      },
      sun,
      days, hourly,
    };
  }).sort((a, b) => b.score - a.score);

  // Best window across beaches in the next 48 daylight hours
  let bw = null;
  for (const ds of datasets) {
    const { beach: b, hours, sun } = ds;
    for (let t = Math.ceil(nowT); t <= nowT + 48 && t < hours.length; t++) {
      const d = Math.floor(t / 24);
      if (d > 4) break;
      const { sr, ss } = sun[Math.min(d, sun.length - 1)];
      const h = t - d * 24;
      if (h < sr - 0.5 || h > ss) continue;
      const s2 = scoreHour(b, hours[t], skillName);
      if (!bw || s2.score > bw.score) bw = { ds, t, score: s2.score };
    }
  }
  let bestWindow = null;
  if (bw) {
    const { beach: b, hours, sun } = bw.ds;
    const d = Math.floor(bw.t / 24);
    const { sr, ss } = sun[Math.min(d, sun.length - 1)];
    let s = bw.t, e = bw.t;
    while (s - 1 >= d * 24 + sr - 0.5 && s - 1 >= 0 && scoreHour(b, hours[s - 1], skillName).score >= bw.score - 0.5) s--;
    while (e + 1 <= d * 24 + ss && e + 1 < hours.length && scoreHour(b, hours[e + 1], skillName).score >= bw.score - 0.5) e++;
    const today = Math.floor(nowT / 24);
    const dayLbl = d === today ? 'today' : d === today + 1 ? 'tomorrow' : dayLabel(baseDate, d);
    bestWindow = {
      name: b.name, dayLbl,
      span: `${fmtClock(s - d * 24)}–${fmtClock(e + 1 - d * 24)}`,
      score: bw.score, label: scoreLabel(bw.score),
    };
  }
  return { beaches, bestWindow };
}
