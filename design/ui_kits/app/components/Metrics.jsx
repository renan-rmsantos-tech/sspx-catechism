/**
 * Metrics — stat tiles, meters and bar charts.
 *
 * Two system rules live here:
 *
 *   1. EVERY COMPARABLE NUMBER IS MONO TABULAR (`.num`). Percentages, tallies,
 *      dates, phone numbers, protocol codes. It is what makes a 22-row
 *      attendance table's columns actually line up. DESIGN.md §3.
 *   2. CHARTS FILL, THEY DON'T OUTLINE — and every chart carries role="img"
 *      plus an aria-label that reads the whole series, because a chart nobody
 *      can hear is a chart half the audience can't use. DESIGN.md §9.12.
 */

import React from 'react';

/** 30px display number over a 13.5px muted label. */
export function Stat({ value, unit, label }) {
  return (
    <div className="stat">
      <span className="stat-num num">
        {value}
        {/* 0.5em muted suffix, so "86%" reads as one unit rather than two */}
        {unit ? <span className="stat-unit">{unit}</span> : null}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function StatTile(props) {
  return (
    <div className="card card-tight stat">
      <Stat {...props} />
    </div>
  );
}

/**
 * Meter — a single proportion. Below target the FILL changes colour, never
 * the label: the number stays neutral so the eye reads the bar, not the text.
 */
export function Meter({ percent, label, target = 75 }) {
  const tone = percent >= target ? '' : percent >= target - 15 ? ' warn' : ' danger';
  return (
    <div className="stack-sm">
      <div className="row-between" style={{ gap: 'var(--sp-2)' }}>
        <span className="small muted">{label}</span>
        <span className="num small" style={{ fontWeight: 600 }}>{percent}%</span>
      </div>
      <div
        className="meter"
        role="img"
        aria-label={`${percent} por cento${percent < target ? ', abaixo do esperado' : ''}`}
      >
        <div className={`meter-fill${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/**
 * Bars — a small series. Value above, filled bar, mono caption below. No drawn
 * axis: at four to eight points the captions do that job with less ink.
 */
export function Bars({ series, unit = '%', label }) {
  const description = label
    ?? series.map((point) => `${point.caption} ${point.value} por cento`).join(', ');

  return (
    <div className="bars" role="img" aria-label={description}>
      {series.map((point, index) => (
        <div key={point.caption}>
          <span className="bar-val">{point.value}{unit}</span>
          <span className="bar-track">
            {/* bar-alt marks the most recent / provisional point */}
            <i
              className={`bar${point.muted || index === series.length - 1 ? ' bar-alt' : ''}`}
              style={{ height: `${point.value}%` }}
            />
          </span>
          <span className="bar-cap">{point.caption}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * ProgressRail — the 4px rail under the attendance sheet header.
 * Reads from the same tally as the confirm button, so the two can never
 * disagree about how much is left.
 */
export function ProgressRail({ done, total }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label="Alunos marcados"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
    >
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
