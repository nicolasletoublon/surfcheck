// Dawn Patrol — beach config, mock 5-day forecast, and surf-score engine.
// Prototype: deterministic mock data shaped like the Open-Meteo marine/forecast responses.
export const BEACHES = [
  { id: 'bondi', name: 'Bondi', lat: -33.8908, lon: 151.2743, facing: 135, bestDir: 150, dirWidth: 75, expoBase: 0.7, sst: 17.3, notes: 'South end more protected; handles S swell well', webcam: 'https://www.swellnet.com/surfcams/nsw/bondi-beach' },
  { id: 'tamarama', name: 'Tamarama', lat: -33.9005, lon: 151.2703, facing: 120, bestDir: 130, dirWidth: 70, expoBase: 0.75, sst: 17.2, notes: 'Small bay, focuses swell, punchy shorebreak', webcam: 'https://www.swellnet.com/surfcams/nsw/tamarama' },
  { id: 'bronte', name: 'Bronte', lat: -33.9036, lon: 151.2699, facing: 100, bestDir: 110, dirWidth: 70, expoBase: 0.55, sst: 17.2, notes: 'Beach break, best on mid tide', webcam: 'https://www.swellnet.com/surfcams/nsw/bronte' },
  { id: 'coogee', name: 'Coogee', lat: -33.9205, lon: 151.2585, facing: 110, bestDir: 120, dirWidth: 55, expoBase: 0.25, sst: 17.4, notes: 'Sheltered by Wedding Cake Island; needs bigger swell', webcam: 'https://www.swellnet.com/surfcams/nsw/coogee' },
  { id: 'maroubra', name: 'Maroubra', lat: -33.95, lon: 151.257, facing: 115, bestDir: 140, dirWidth: 90, expoBase: 1.0, sst: 17.0, notes: 'Most swell-exposed; picks up everything', webcam: 'https://www.swellnet.com/surfcams/nsw/maroubra' },
];
export const SKILL_NAMES = ['Beginner', 'Intermediate', 'Experienced'];
export const SKILLS = {
  Beginner: { center: 0.85, spread: 0.5, windMult: 1.3 },
  Intermediate: { center: 1.5, spread: 0.8, windMult: 1.0 },
  Experienced: { center: 2.2, spread: 1.0, windMult: 0.85 },
};
const TIDE = { mean: 0.95, amp: 0.62, peakT: 12.67, period: 12.42 };
// Wind keyframes per day: [hourOfDay, dirFrom°, speed kn]
const WIND_DAYS = [
  [[0, 300, 5], [5, 290, 6], [8, 10, 7], [10, 40, 10], [13, 45, 13], [17, 50, 9], [21, 20, 6], [24, 340, 7]],
  [[0, 320, 6], [5, 285, 8], [9, 290, 9], [11, 300, 8], [13, 50, 11], [17, 55, 10], [21, 10, 6], [24, 350, 6]],
  [[0, 200, 10], [4, 190, 16], [8, 185, 20], [13, 180, 22], [18, 190, 18], [24, 200, 14]],
  [[0, 230, 10], [6, 250, 9], [10, 270, 8], [13, 140, 11], [17, 135, 13], [24, 180, 8]],
  [[0, 290, 5], [6, 300, 6], [10, 30, 8], [13, 40, 14], [17, 45, 12], [24, 20, 8]],
];
const C16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
export const compass = d => C16[Math.round((((d % 360) + 360) % 360) / 22.5) % 16];
export const angDiff = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const lerpAngle = (a, b, f) => { const d = ((b - a + 540) % 360) - 180; return (a + d * f + 360) % 360; };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function hourAt(t) { // t = hours since today 00:00 (float), 0..120
  let swellH, swellP, swellDir;
  const h1 = t < 36 ? 1.5 + 0.05 * Math.sin(t / 6) : Math.max(0.7, 1.5 - 0.02 * (t - 36));
  const h2 = t >= 96 ? Math.min(1.9, 0.5 + 0.055 * (t - 96)) : 0;
  if (h2 > h1) { swellH = h2; swellP = 14; swellDir = 175; }
  else { swellH = h1; swellP = 12.5 - 0.015 * t; swellDir = 155 + t * 0.05; }
  const day = clamp(Math.floor(t / 24), 0, 4), hd = t - day * 24, kfs = WIND_DAYS[day];
  let windDir = kfs[kfs.length - 1][1], windSpd = kfs[kfs.length - 1][2];
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i], b = kfs[i + 1];
    if (hd >= a[0] && hd <= b[0]) { const f = (hd - a[0]) / ((b[0] - a[0]) || 1); windDir = lerpAngle(a[1], b[1], f); windSpd = a[2] + (b[2] - a[2]) * f; break; }
  }
  const tide = TIDE.mean + TIDE.amp * Math.cos(2 * Math.PI * (t - TIDE.peakT) / TIDE.period);
  return { t, swellH, swellP, swellDir, windDir, windSpd, tide };
}
export const tideRising = t => Math.sin(2 * Math.PI * (t - TIDE.peakT) / TIDE.period) < 0;
export function nextTideExtreme(t) {
  const P = TIDE.period;
  const above = base => { let x = base; while (x - P > t) x -= P; while (x <= t) x += P; return x; };
  const hi = above(TIDE.peakT), lo = above(TIDE.peakT + P / 2);
  return hi < lo ? { kind: 'high', t: hi } : { kind: 'low', t: lo };
}
export function tideStage(level) {
  const n = (level - (TIDE.mean - TIDE.amp)) / (2 * TIDE.amp);
  return n < 0.3 ? 'low' : n > 0.7 ? 'high' : 'mid';
}
export function scoreHour(beach, hr, skillName) {
  const s = SKILLS[skillName];
  const eff = hr.swellH * Math.sqrt(hr.swellP / 10);
  const dd = angDiff(hr.swellDir, beach.bestDir);
  const falloff = Math.max(0, 1 - (dd / beach.dirWidth) ** 2);
  const expo = beach.expoBase * falloff;
  const breakH = eff * expo;
  const offDir = (beach.facing + 180) % 360;
  const wd = angDiff(hr.windDir, offDir);
  let wind;
  if (hr.windSpd < 5) wind = 9;
  else if (wd <= 55) wind = 9.5 - Math.max(0, hr.windSpd - 18) * 0.35;
  else if (wd <= 115) wind = 6 - hr.windSpd * 0.25 * s.windMult;
  else wind = 5 - hr.windSpd * 0.5 * s.windMult;
  wind = clamp(wind, 0, 10);
  const size = 10 * Math.exp(-(((breakH - s.center) / s.spread) ** 2));
  const dir = Math.min(10, expo * 10);
  const period = hr.swellP < 7 ? 3 : hr.swellP < 8 ? 5 : hr.swellP < 10 ? 7 : hr.swellP < 11 ? 8.5 : 10;
  const n = (hr.tide - (TIDE.mean - TIDE.amp)) / (2 * TIDE.amp);
  const tide = 10 - 3.5 * (2 * Math.abs(n - 0.5)) ** 2;
  let score = 0.35 * wind + 0.2 * size + 0.25 * dir + 0.1 * period + 0.1 * tide;
  if (breakH < 0.35) score = Math.min(score, 1.6);
  else if (breakH < 0.55) score = Math.min(score, 4.5);
  return { score: Math.round(score * 10) / 10, breakH, windF: wind, windTag: wd <= 55 ? 'offshore' : wd <= 115 ? 'cross-shore' : 'onshore' };
}
export const scoreLabel = s => s < 2 ? 'Flat' : s < 4 ? 'Poor' : s < 7 ? 'Fair' : s < 8.5 ? 'Good' : 'Firing';
export const sun = d => ({ sr: 6.55 - d / 60, ss: 17.37 + d / 60 }); // Sydney, early Aug
export function fmtClock(h) {
  const h24 = ((h % 24) + 24) % 24;
  let hh = Math.floor(h24), mm = Math.round((h24 - hh) * 60);
  if (mm === 60) { mm = 0; hh = (hh + 1) % 24; }
  const ap = hh < 12 ? 'am' : 'pm';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return mm === 0 ? `${h12} ${ap}` : `${h12}:${String(mm).padStart(2, '0')} ${ap}`;
}
export const wetsuit = t => t > 21 ? 'Springsuit' : t >= 18 ? '3/2 steamer' : t >= 15 ? '3/2 + booties' : '4/3 steamer';
export function whyLine(beach, hr, sc) {
  if (sc.breakH < 0.35) {
    return beach.id === 'coogee'
      ? `Wedding Cake Island is soaking up this swell — barely ${sc.breakH.toFixed(1)} m breaking.`
      : `Not really breaking — this swell angle misses ${beach.name}.`;
  }
  const clean = sc.windTag === 'offshore' ? 'Clean' : sc.windF >= 5 ? 'Workable' : 'Bumpy';
  const kind = hr.swellP >= 11 ? 'groundswell' : hr.swellP >= 8 ? 'swell' : 'windswell';
  const stage = tideStage(hr.tide);
  const dirn = tideRising(hr.t) ? 'rising' : 'falling';
  return `${clean} ${hr.swellH.toFixed(1)} m ${compass(hr.swellDir)} ${kind} at ${Math.round(hr.swellP)} s, ${Math.round(hr.windSpd)} kn ${compass(hr.windDir)} ${sc.windTag}, ${stage} tide ${dirn}.`;
}
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function dayLabel(baseDate, d) {
  if (d === 0) return 'Today';
  const dt = new Date(baseDate.getTime() + d * 864e5);
  return (d === 1 ? 'Tmrw' : DOW[dt.getDay()]) + ' ' + dt.getDate();
}
export function buildModel(skillName, nowT, baseDate) {
  const beaches = BEACHES.map(b => {
    const hr = hourAt(nowT), sc = scoreHour(b, hr, skillName);
    const ext = nextTideExtreme(nowT);
    const days = [], hourly = [];
    for (let d = 0; d < 5; d++) {
      const { sr, ss } = sun(d);
      let best = 0, swMin = 99, swMax = 0, vx = 0, vy = 0, spdSum = 0, n = 0;
      const hrs = [];
      for (let h = 0; h < 24; h++) {
        const t = d * 24 + h, hh = hourAt(t);
        const s2 = scoreHour(b, hh, skillName);
        hrs.push({ h, swellH: hh.swellH, windSpd: hh.windSpd, tide: hh.tide, score: s2.score });
        if (h >= Math.floor(sr) && h <= Math.ceil(ss)) {
          best = Math.max(best, s2.score);
          swMin = Math.min(swMin, hh.swellH); swMax = Math.max(swMax, hh.swellH);
          const r = hh.windDir * Math.PI / 180;
          vx += Math.sin(r) * hh.windSpd; vy += Math.cos(r) * hh.windSpd; spdSum += hh.windSpd; n++;
        }
      }
      const avgDir = (Math.atan2(vx, vy) * 180 / Math.PI + 360) % 360;
      days.push({ d, best: Math.round(best * 10) / 10, label: scoreLabel(best), lbl: dayLabel(baseDate, d), swMin, swMax, windLbl: `${compass(avgDir)} ${Math.round(spdSum / n)} kn` });
      hourly.push(hrs);
    }
    return {
      id: b.id, name: b.name, notes: b.notes, webcam: b.webcam, sst: b.sst,
      score: sc.score, label: scoreLabel(sc.score), why: whyLine(b, hr, sc),
      swell: { h: hr.swellH, p: hr.swellP, dirFrom: hr.swellDir, going: (hr.swellDir + 180) % 360 },
      wind: { spd: hr.windSpd, dirFrom: hr.windDir, going: (hr.windDir + 180) % 360, tag: sc.windTag },
      tide: { level: hr.tide, stage: tideStage(hr.tide), rising: tideRising(nowT), nextKind: ext.kind, nextT: ext.t },
      days, hourly,
    };
  }).sort((a, b) => b.score - a.score);
  // Best window in the next 48 daylight hours, across beaches
  let bw = null;
  for (let t = Math.ceil(nowT); t <= nowT + 48; t++) {
    const d = Math.floor(t / 24), h = t - d * 24;
    if (d > 4) break;
    const { sr, ss } = sun(d);
    if (h < sr - 0.5 || h > ss) continue;
    for (const b of BEACHES) {
      const s2 = scoreHour(b, hourAt(t), skillName);
      if (!bw || s2.score > bw.score) bw = { beach: b, t, score: s2.score };
    }
  }
  let bestWindow = null;
  if (bw) {
    const d = Math.floor(bw.t / 24), { sr, ss } = sun(d);
    let s = bw.t, e = bw.t;
    while (s - 1 >= d * 24 + sr - 0.5 && scoreHour(bw.beach, hourAt(s - 1), skillName).score >= bw.score - 0.5) s--;
    while (e + 1 <= d * 24 + ss && scoreHour(bw.beach, hourAt(e + 1), skillName).score >= bw.score - 0.5) e++;
    const dayLbl = d === Math.floor(nowT / 24) ? 'today' : d === Math.floor(nowT / 24) + 1 ? 'tomorrow' : dayLabel(baseDate, d);
    bestWindow = { name: bw.beach.name, dayLbl, span: `${fmtClock(s - d * 24)}–${fmtClock(e + 1 - d * 24)}`, score: bw.score, label: scoreLabel(bw.score) };
  }
  return { beaches, bestWindow };
}
