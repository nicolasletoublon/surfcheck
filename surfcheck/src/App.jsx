import { useEffect, useMemo, useState } from 'react';
import { BEACHES, SKILL_NAMES, SKILLS } from './beaches.js';
import { buildModel, compass, fmtClock, wetsuit } from './engine.js';
import { fetchBeach, sydneyNow } from './api.js';

const LABEL_COLOR = {
  Flat: 'var(--dp-flat)', Poor: 'var(--dp-poor)', Fair: 'var(--dp-amber)',
  Good: 'var(--dp-green)', Firing: 'var(--dp-coral)',
};

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

function Chart({ hours }) {
  const L = 30, R = 352, T = 12, B = 126;
  const x = i => L + ((R - L) * i) / 23;
  const ySw = v => B - ((B - T) * Math.min(v, 2.5)) / 2.5;
  const yW = v => B - ((B - T) * Math.min(v, 25)) / 25;
  const yT = n => B - (B - T) * n; // tide is pre-normalised 0–1
  const line = (f, k) => hours.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${f(p[k]).toFixed(1)}`).join(' ');
  const swellLine = line(ySw, 'swellH');
  const grid = [1, 2].map(m => ({ y: ySw(m), txt: `${m} m` }));
  const xlabels = [0, 6, 12, 18, 23].map(i => ({ x: x(i), txt: i === 23 ? '11 pm' : fmtClock(i) }));
  return (
    <svg className="dp-chart-svg" viewBox="0 0 360 150">
      {grid.map(g => (
        <g key={g.txt}>
          <line x1={L} x2={R} y1={g.y} y2={g.y} stroke="var(--dp-line)" strokeWidth="1" />
          <text x={L - 4} y={g.y + 3} textAnchor="end" fontSize="9" fill="var(--dp-soft)">{g.txt}</text>
        </g>
      ))}
      <path d={`${line(yT, 'tideN')} L${R} ${B} L${L} ${B} Z`} fill="var(--dp-soft)" fillOpacity="0.13" />
      <path d={`${swellLine} L${R} ${B} L${L} ${B} Z`} fill="var(--dp-teal)" fillOpacity="0.22" />
      <path d={swellLine} stroke="var(--dp-teal)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d={line(yW, 'windSpd')} stroke="var(--dp-coral)" strokeWidth="1.8" fill="none" strokeDasharray="4 4" strokeLinecap="round" />
      {xlabels.map(xl => (
        <text key={xl.txt} x={xl.x} y="144" textAnchor="middle" fontSize="9" fill="var(--dp-soft)">{xl.txt}</text>
      ))}
    </svg>
  );
}

function BeachCard({ b, fav, onToggleFav, onOpen }) {
  const tideTxt = b.tide.nextKind
    ? `${b.tide.stage[0].toUpperCase() + b.tide.stage.slice(1)} tide ${b.tide.rising ? 'rising' : 'falling'} · ${b.tide.nextKind} ${fmtClock(b.tide.nextT % 24)}`
    : `${b.tide.stage[0].toUpperCase() + b.tide.stage.slice(1)} tide ${b.tide.rising ? 'rising' : 'falling'}`;
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
        <div className="dp-stats">
          <div className="dp-stat">
            <Arrow deg={b.swell.going} color="var(--dp-teal)" />
            <span>{b.swell.h.toFixed(1)} m · {Math.round(b.swell.p)} s {compass(b.swell.dirFrom)}</span>
          </div>
          <div className="dp-stat">
            <Arrow deg={b.wind.going} color="var(--dp-coral)" />
            <span>{Math.round(b.wind.spd)} kn {compass(b.wind.dirFrom)}</span>
            <span className={`dp-chip dp-tag-${b.wind.tag}`}>{b.wind.tag.toUpperCase()}</span>
          </div>
          <div className="dp-stat">{tideTxt}</div>
        </div>
        <div className="dp-why">{b.why}</div>
      </div>
    </article>
  );
}

function Sheet({ b, day, setDay, onClose }) {
  const sun = b.sun[Math.min(day, b.sun.length - 1)];
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
        <div className="dp-days">
          {b.days.map(d => (
            <button key={d.d} className={`dp-day ${d.d === day ? 'on' : ''}`} onClick={() => setDay(d.d)}>
              <span className="dp-day-lbl">{d.lbl}</span>
              <span className="dp-day-score" style={{ color: LABEL_COLOR[d.label] }}>{d.best.toFixed(1)}</span>
              <span className="dp-day-sw">{d.swMin.toFixed(1)}–{d.swMax.toFixed(1)} m</span>
              <span className="dp-day-wind">{d.windLbl}</span>
            </button>
          ))}
        </div>
        <div className="dp-chart-card">
          <div className="dp-chart-head">
            <div className="dp-chart-title">{b.days[day]?.lbl ?? ''} · hourly</div>
            <div className="dp-legend">
              <span><span className="dp-dot" style={{ background: 'var(--dp-teal)' }} />swell m</span>
              <span><span className="dp-dot" style={{ background: 'var(--dp-coral)' }} />wind kn</span>
              <span><span className="dp-dot" style={{ background: 'var(--dp-soft)' }} />tide</span>
            </div>
          </div>
          <Chart hours={b.hourly[day] ?? []} />
        </div>
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
            <div className="dp-extra-eyebrow">SURFCAM</div>
            <a href={b.webcam} target="_blank" rel="noreferrer">Swellnet cam →</a>
            <div className="dp-extra-small">opens in new tab</div>
          </div>
        </div>
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

        <main className="dp-main">
          {ranked.map(b => (
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

      {sheetBeach && <Sheet b={sheetBeach} day={day} setDay={setDay} onClose={() => setSheetId(null)} />}
    </div>
  );
}
