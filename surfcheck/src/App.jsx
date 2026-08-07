import { useEffect, useMemo, useState } from 'react';
import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BEACHES, SKILL_NAMES, SKILLS } from './beaches.js';
import { buildModel, compass, fmtClock, scoreLabel, tideStage, wetsuit } from './engine.js';
import { fetchBeach, sydneyNow } from './api.js';

const LABEL_COLOR = {
  Flat: 'var(--dp-flat)', Poor: 'var(--dp-poor)', Fair: 'var(--dp-amber)',
  Good: 'var(--dp-green)', Firing: 'var(--dp-violet)',
};

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = e => setMatches(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

function ScoreNum({ score, label, size }) {
  return (
    <span
      className={`dp-scorenum ${label === 'Firing' ? 'dp-firing' : ''}`}
      style={{ fontSize: size, color: label === 'Firing' ? undefined : LABEL_COLOR[label] }}
    >
      {score.toFixed(1)}
    </span>
  );
}

function Arrow({ deg, color }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" style={{ transform: `rotate(${Math.round(deg)}deg)` }}>
      <path d="M12 2l7 11h-4.6v9H9.6v-9H5z" fill={color} />
    </svg>
  );
}

function Star({ pinned, onClick }) {
  return (
    <button className="dp-star" title="Pin to top" onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          d="M12 3.6l2.5 5.1 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8z"
          fill={pinned ? 'var(--dp-sand)' : 'transparent'}
          stroke={pinned ? 'var(--dp-sand)' : 'var(--dp-soft)'}
          strokeWidth="1.6" strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function WaveDivider() {
  return (
    <svg className="dp-wave" viewBox="0 0 580 26" preserveAspectRatio="none">
      <path d="M0 16 Q 36 4, 72 14 T 145 14 T 218 14 T 290 14 T 362 14 T 435 14 T 508 14 T 580 14 V 26 H 0 Z" fill="var(--dp-teal)" fillOpacity="0.09" />
      <path d="M0 20 Q 48 10, 96 18 T 193 18 T 290 18 T 386 18 T 483 18 T 580 18" stroke="var(--dp-teal)" strokeOpacity="0.25" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

const GOOD_SCORE = 7; // matches scoreLabel's Fair/Good boundary

// Contiguous [startHour, endHour) ranges where the hourly score clears GOOD_SCORE.
function goodRanges(hours) {
  const ranges = [];
  let start = null;
  hours.forEach((h, i) => {
    if (h.score >= GOOD_SCORE && start === null) start = i;
    if (h.score < GOOD_SCORE && start !== null) { ranges.push([start, i]); start = null; }
  });
  if (start !== null) ranges.push([start, hours.length]);
  return ranges;
}

const scoreColor = s => LABEL_COLOR[scoreLabel(s)];

// Contiguous runs of hours sharing the same score label: [{from, to (inclusive), color}]
function labelRuns(hours) {
  const runs = [];
  hours.forEach((h, i) => {
    const color = scoreColor(h.score);
    if (runs.length && runs[runs.length - 1].color === color) runs[runs.length - 1].to = i;
    else runs.push({ from: i, to: i, color });
  });
  return runs;
}

// Surfline-style condition strip: one colour-graded segment per stretch of hours.
function ScoreRibbon({ hours }) {
  return (
    <div className="dp-ribbon">
      {hours.map(h => (
        <span key={h.h} style={{ background: scoreColor(h.score) }} title={`${fmtClock(h.h)} · ${h.score.toFixed(1)}`} />
      ))}
    </div>
  );
}

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const label = scoreLabel(p.score);
  return (
    <div className="dp-tip">
      <div className="dp-tip-head">
        <span>{fmtClock(p.h)}</span>
        <span style={{ color: LABEL_COLOR[label] }}>{p.score.toFixed(1)} · {label}</span>
      </div>
      {p.faceHi >= 0.3 && (
        <div className="dp-tip-row"><span className="dp-dot" style={{ background: 'var(--dp-sand)' }} />faces {p.faceLo.toFixed(1)}–{p.faceHi.toFixed(1)} m</div>
      )}
      <div className="dp-tip-row"><span className="dp-dot" style={{ background: 'var(--dp-teal)' }} />swell {p.swellH.toFixed(1)} m · {Math.round(p.swellP)} s {compass(p.swellDir)}</div>
      <div className="dp-tip-row">
        <span className="dp-dot" style={{ background: 'var(--dp-coral)' }} />
        wind {Math.round(p.windSpd)} kn {compass(p.windDir)}
        <span className={`dp-chip dp-tag-${p.windTag}`}>{p.windTag.toUpperCase()}</span>
      </div>
      <div className="dp-tip-row"><span className="dp-dot" style={{ background: 'var(--dp-soft)' }} />{tideStage(p.tideN)} tide</div>
    </div>
  );
}

function HourlyChart({ hours, isToday, nowT }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <ComposedChart data={hours} margin={{ top: 16, right: 8, bottom: 0, left: -6 }}>
        {goodRanges(hours).map(([a, b]) => (
          <ReferenceArea key={a} yAxisId="m" x1={a} x2={Math.min(23, b)} fill="var(--dp-green)" fillOpacity={0.13} />
        ))}
        <CartesianGrid vertical={false} stroke="var(--dp-line)" />
        <XAxis
          dataKey="h" type="number" domain={[0, 23]} ticks={[0, 6, 12, 18, 23]}
          tickFormatter={h => (h === 23 ? '11 pm' : fmtClock(h))}
          tick={{ fontSize: 10, fill: 'var(--dp-soft)' }} axisLine={false} tickLine={false}
        />
        <YAxis
          yAxisId="m" domain={[0, dataMax => Math.max(2.5, Math.ceil(dataMax))]} allowDecimals={false}
          tickFormatter={v => (v ? `${v} m` : '')}
          tick={{ fontSize: 10, fill: 'var(--dp-soft)' }} axisLine={false} tickLine={false} width={44}
        />
        <YAxis yAxisId="kn" orientation="right" domain={[0, dataMax => Math.max(25, dataMax)]} hide />
        <YAxis yAxisId="n" domain={[0, 1]} hide />
        <Tooltip content={<ChartTip />} cursor={{ stroke: 'var(--dp-soft)', strokeDasharray: '3 3' }} />
        <Area yAxisId="n" dataKey="tideN" stroke="none" fill="var(--dp-soft)" fillOpacity={0.13} isAnimationActive={false} />
        <Area
          yAxisId="m" dataKey="swellH" stroke="var(--dp-teal)" strokeWidth={2.2}
          fill="var(--dp-teal)" fillOpacity={0.2} isAnimationActive={false}
          activeDot={{ r: 3.5, strokeWidth: 0, fill: 'var(--dp-teal)' }}
        />
        <Line
          yAxisId="kn" dataKey="windSpd" stroke="var(--dp-coral)" strokeWidth={1.8}
          strokeDasharray="4 4" dot={false} isAnimationActive={false}
          activeDot={{ r: 3, strokeWidth: 0, fill: 'var(--dp-coral)' }}
        />
        {/* Condition strip along the bottom of the plot, colour-graded by score label */}
        {labelRuns(hours).map(r => (
          <ReferenceArea
            key={`run-${r.from}`} yAxisId="n"
            x1={r.from === 0 ? 0 : r.from - 0.5} x2={r.to === 23 ? 23 : r.to + 0.5}
            y1={0} y2={0.05} fill={r.color} fillOpacity={0.9} strokeOpacity={0}
          />
        ))}
        {isToday && nowT != null && (
          <ReferenceLine
            yAxisId="m" x={Math.min(23, Math.max(0, nowT))}
            stroke="var(--dp-coral)" strokeWidth={1.4} strokeDasharray="2 2"
            label={{ value: 'NOW', position: 'top', fill: 'var(--dp-coral)', fontSize: 9, fontWeight: 700 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function ChartCard({ b, day, nowT }) {
  return (
    <div className="dp-chart-card">
      <div className="dp-chart-head">
        <div className="dp-chart-title">{b.days[day]?.lbl ?? ''} · hourly</div>
        <div className="dp-legend">
          <span><span className="dp-dot" style={{ background: 'var(--dp-teal)' }} />swell m</span>
          <span><span className="dp-dot" style={{ background: 'var(--dp-coral)' }} />wind kn</span>
          <span><span className="dp-dot" style={{ background: 'var(--dp-soft)' }} />tide</span>
          <span><span className="dp-dot" style={{ background: 'var(--dp-green)' }} />good window</span>
        </div>
      </div>
      <HourlyChart hours={b.hourly[day] ?? []} isToday={day === 0} nowT={nowT} />
    </div>
  );
}

function DayPills({ days, hourly, day, setDay }) {
  return (
    <div className="dp-days">
      {days.map(d => (
        <button key={d.d} className={`dp-day ${d.d === day ? 'on' : ''}`} onClick={() => setDay(d.d)}>
          <span className="dp-day-lbl">{d.lbl}</span>
          <span className="dp-day-score" style={{ color: LABEL_COLOR[d.label] }}>{d.best.toFixed(1)}</span>
          <span className="dp-day-sw">{d.swMin.toFixed(1)}–{d.swMax.toFixed(1)} m</span>
          <span className="dp-day-wind">{d.windLbl}</span>
          <ScoreRibbon hours={hourly[d.d] ?? []} />
        </button>
      ))}
    </div>
  );
}

const tideText = t => {
  const stage = `${t.stage[0].toUpperCase() + t.stage.slice(1)} tide ${t.rising ? 'rising' : 'falling'}`;
  return t.nextKind ? `${stage} · ${t.nextKind} ${fmtClock(t.nextT % 24)}` : stage;
};

function StatsRow({ b }) {
  return (
    <div className="dp-stats">
      <div className="dp-stat dp-stat-face">
        {b.face.hi < 0.3
          ? <span>faces: flat</span>
          : <span>faces {b.face.lo.toFixed(1)}–{b.face.hi.toFixed(1)} m · {b.face.label}</span>}
      </div>
      <div className="dp-stat">
        <Arrow deg={b.swell.going} color="var(--dp-teal)" />
        <span>{b.swell.h.toFixed(1)} m · {Math.round(b.swell.p)} s {compass(b.swell.dirFrom)}</span>
      </div>
      <div className="dp-stat">
        <Arrow deg={b.wind.going} color="var(--dp-coral)" />
        <span>{Math.round(b.wind.spd)} kn {compass(b.wind.dirFrom)}</span>
        <span className={`dp-chip dp-tag-${b.wind.tag}`}>{b.wind.tag.toUpperCase()}</span>
      </div>
      <div className="dp-stat">{tideText(b.tide)}</div>
    </div>
  );
}

function Extras({ b, day }) {
  const sun = b.sun[Math.min(day, b.sun.length - 1)];
  return (
    <div className="dp-extras">
      <div className="dp-extra">
        <div className="dp-extra-eyebrow">WATER</div>
        <div className="dp-extra-big">{b.sst.toFixed(1)}°C</div>
        <div className="dp-extra-small">{wetsuit(b.sst)}</div>
      </div>
      <div className="dp-extra">
        <div className="dp-extra-eyebrow">FIRST LIGHT</div>
        <div className="dp-extra-big">{fmtClock(sun.sr - 25 / 60)}</div>
        <div className="dp-extra-small">sunrise {fmtClock(sun.sr)}</div>
      </div>
      <div className="dp-extra">
        <div className="dp-extra-eyebrow">SURFCAMS</div>
        <div className="dp-cams">
          {b.cams.map(c => (
            <a key={c.url + c.label} href={c.url} target="_blank" rel="noreferrer">{c.label} →</a>
          ))}
        </div>
      </div>
    </div>
  );
}

function BeachCard({ b, fav, onToggleFav, onOpen }) {
  return (
    <article className="dp-card" onClick={onOpen}>
      <div className="dp-card-score">
        <ScoreNum score={b.score} label={b.label} size={42} />
        <div className="dp-scorelbl" style={{ color: LABEL_COLOR[b.label] }}>{b.label}</div>
      </div>
      <div className="dp-card-info">
        <div className="dp-card-name-row">
          <div className="dp-card-name-left">
            <div className="dp-card-name">{b.name}</div>
            {fav && <span className="dp-chip dp-chip-pinned">PINNED</span>}
          </div>
          <div className="dp-card-actions">
            <Star pinned={fav} onClick={e => { e.stopPropagation(); onToggleFav(); }} />
            <div className="dp-chev">›</div>
          </div>
        </div>
        <StatsRow b={b} />
        <div className="dp-why">{b.why}</div>
      </div>
    </article>
  );
}

// Desktop: an always-expanded card with everything the sheet shows, no click needed.
function BeachPanel({ b, fav, onToggleFav, nowT }) {
  const [day, setDay] = useState(0);
  return (
    <section className="dp-panel">
      <div className="dp-panel-head">
        <div className="dp-panel-title">
          <div className="dp-card-name-left">
            <div className="dp-sheet-name">{b.name}</div>
            {fav && <span className="dp-chip dp-chip-pinned">PINNED</span>}
            <Star pinned={fav} onClick={onToggleFav} />
          </div>
          <div className="dp-sheet-why">{b.why}</div>
        </div>
        <div className="dp-scorecol">
          <ScoreNum score={b.score} label={b.label} size={44} />
          <div className="dp-scorelbl" style={{ color: LABEL_COLOR[b.label] }}>{b.label}</div>
        </div>
      </div>
      <StatsRow b={b} />
      <DayPills days={b.days} hourly={b.hourly} day={day} setDay={setDay} />
      <ChartCard b={b} day={day} nowT={nowT} />
      <Extras b={b} day={day} />
      <div className="dp-sheet-notes">{b.notes}</div>
    </section>
  );
}

function Sheet({ b, day, setDay, onClose, nowT }) {
  return (
    <>
      <div className="dp-scrim" onClick={onClose} />
      <div className="dp-sheet">
        <div className="dp-handle" />
        <div className="dp-sheet-head">
          <div style={{ flex: 1 }}>
            <div className="dp-sheet-name">{b.name}</div>
            <div className="dp-sheet-why">{b.why}</div>
          </div>
          <div className="dp-scorecol">
            <ScoreNum score={b.score} label={b.label} size={40} />
            <div className="dp-scorelbl" style={{ color: LABEL_COLOR[b.label] }}>{b.label}</div>
          </div>
        </div>
        <DayPills days={b.days} hourly={b.hourly} day={day} setDay={setDay} />
        <ChartCard b={b} day={day} nowT={nowT} />
        <Extras b={b} day={day} />
        <div className="dp-sheet-notes">{b.notes}</div>
      </div>
    </>
  );
}

const loadFavs = () => { try { return JSON.parse(localStorage.getItem('dp-favs')) || []; } catch { return []; } };
const loadSkill = () => { const s = localStorage.getItem('dp-skill'); return s && SKILLS[s] ? s : 'Intermediate'; };

export default function App() {
  const [skill, setSkill] = useState(loadSkill);
  const [favs, setFavs] = useState(loadFavs);
  const [sheetId, setSheetId] = useState(null);
  const [day, setDay] = useState(0);
  const [data, setData] = useState({});   // beachId -> { status, dataset?, error? }
  const [, setTick] = useState(0);        // re-render each minute for "updated X min ago" / now-hour rollover
  const isDesktop = useMediaQuery('(min-width: 1000px)');

  const load = (only = null) => {
    const targets = only ? BEACHES.filter(b => b.id === only) : BEACHES;
    setData(prev => {
      const next = { ...prev };
      targets.forEach(b => { next[b.id] = { status: 'loading' }; });
      return next;
    });
    targets.forEach(beach => {
      fetchBeach(beach)
        .then(dataset => setData(prev => ({ ...prev, [beach.id]: { status: 'ok', dataset } })))
        .catch(err => setData(prev => ({ ...prev, [beach.id]: { status: 'error', error: String(err.message || err) } })));
    });
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const ready = BEACHES.filter(b => data[b.id]?.status === 'ok');
  const model = useMemo(() => {
    if (!ready.length) return null;
    const { nowT, baseDate } = sydneyNow();
    return buildModel(ready.map(b => data[b.id].dataset), skill, nowT, baseDate);
  }, [data, skill, ready.length, Math.floor(Date.now() / 60_000)]);

  const ranked = model
    ? [...model.beaches].sort((a, b) => (favs.includes(b.id) - favs.includes(a.id)) || (b.score - a.score))
    : [];
  const { nowT } = sydneyNow();

  // Desktop: favourites expand into full panels at the top (top 2 by score if nothing pinned).
  const featured = isDesktop
    ? (favs.length ? ranked.filter(b => favs.includes(b.id)) : ranked.slice(0, 2))
    : [];
  const compact = ranked.filter(b => !featured.some(f => f.id === b.id));
  const sheetBeach = model && sheetId ? model.beaches.find(b => b.id === sheetId) : null;

  const newest = Math.max(0, ...ready.map(b => data[b.id].dataset.fetchedAt ?? 0));
  const updatedAgo = newest ? `${Math.max(0, Math.round((Date.now() - newest) / 60_000))} min ago` : '…';

  const pickSkill = name => { localStorage.setItem('dp-skill', name); setSkill(name); };
  const toggleFav = id => {
    const next = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    localStorage.setItem('dp-favs', JSON.stringify(next));
    setFavs(next);
  };

  return (
    <div className="dp-page">
      <div className="dp-col">
        <header className="dp-header">
          <div className="dp-header-top">
            <div>
              <div className="dp-title">DAWN PATROL<span className="dot">.</span></div>
              <div className="dp-subtitle">Sydney · Eastern Suburbs</div>
            </div>
            <div className="dp-updated">updated {updatedAgo}</div>
          </div>
          <div className="dp-seg">
            {SKILL_NAMES.map(name => (
              <button key={name} className={name === skill ? 'on' : ''} onClick={() => pickSkill(name)}>{name}</button>
            ))}
          </div>
          <WaveDivider />
        </header>

        {model?.bestWindow && (
          <div className="dp-banner">
            <div className="dp-banner-info">
              <div className="dp-eyebrow">BEST WINDOW · NEXT 48 H</div>
              <div className="dp-banner-what">{model.bestWindow.name} — {model.bestWindow.dayLbl}, {model.bestWindow.span}</div>
            </div>
            <div className="dp-scorecol">
              <ScoreNum score={model.bestWindow.score} label={model.bestWindow.label} size={30} />
              <div className="dp-scorelbl" style={{ fontSize: 10, letterSpacing: '1.2px', color: LABEL_COLOR[model.bestWindow.label] }}>
                {model.bestWindow.label}
              </div>
            </div>
          </div>
        )}

        {featured.length > 0 && (
          <section className="dp-panels">
            {featured.map(b => (
              <BeachPanel key={b.id} b={b} fav={favs.includes(b.id)} onToggleFav={() => toggleFav(b.id)} nowT={nowT} />
            ))}
          </section>
        )}

        <main className={`dp-main ${isDesktop ? 'dp-main-grid' : ''}`}>
          {compact.map(b => (
            <BeachCard
              key={b.id} b={b} fav={favs.includes(b.id)}
              onToggleFav={() => toggleFav(b.id)}
              onOpen={() => { setSheetId(b.id); setDay(0); }}
            />
          ))}
          {BEACHES.filter(b => data[b.id]?.status === 'loading').map(b => (
            <div key={b.id} className="dp-skel" aria-label={`Loading ${b.name}…`} />
          ))}
          {BEACHES.filter(b => data[b.id]?.status === 'error').map(b => (
            <div key={b.id} className="dp-error">
              <div>
                <div className="dp-error-name">{b.name}</div>
                <div className="dp-error-msg">Couldn't load conditions — {data[b.id].error}</div>
              </div>
              <button className="dp-retry" onClick={() => load(b.id)}>Retry</button>
            </div>
          ))}
        </main>

        <div className="dp-foot">
          Data: Open-Meteo (marine + weather) · tide is modelled, not official BoM tables · scores are a heuristic — check the cam before you drive.
        </div>
      </div>

      {sheetBeach && <Sheet b={sheetBeach} day={day} setDay={setDay} onClose={() => setSheetId(null)} nowT={nowT} />}
    </div>
  );
}
