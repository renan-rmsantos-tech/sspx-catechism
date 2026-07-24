/**
 * AttendanceRow — the most-used control in the product, and its most specific.
 *
 * A catechist taps this 14–22 times per class, standing up, on a phone.
 * Everything about it follows from that.
 *
 * THE RULE THAT MATTERS: there is no hidden neutral default.
 *
 *   `mark` is `true` (present), `false` (absent), or `null` (unmarked).
 *   `null` is a REAL, VISIBLE, COUNTABLE state — the row stays white and keeps
 *   counting toward "sem marcar". That is the whole reason the confirm button
 *   can report an honest remaining count instead of silently treating unmarked
 *   students as present. Collapsing `null` into a default breaks the product.
 *   See DESIGN.md §9.8.
 *
 * Tapping the already-pressed side clears back to `null`, so a mistake is
 * recoverable without a separate "undo" affordance.
 */

import React from 'react';

const IconYes = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

const IconNo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export function AttendanceRow({ name, mark, onChange, index }) {
  // 5% accent / 4% danger wash — a tint, never a filled card.
  const stateClass = mark === true ? 'is-yes' : mark === false ? 'is-no' : '';

  // Tapping the pressed side clears the mark back to null.
  const set = (value) => onChange(mark === value ? null : value);

  return (
    <div className={`list-row ${stateClass}`} data-od-id={`student-row-${index}`}>
      <span className="avatar" aria-hidden="true">{name.charAt(0)}</span>
      <span className="row-title" style={{ flex: '1 1 auto', minWidth: 0 }}>{name}</span>
      <span className="seg">
        {/* 46 × 44 — above the touch floor, because this is tapped at arm's length */}
        <button
          type="button"
          className="seg-btn seg-yes"
          aria-pressed={mark === true}
          aria-label={`Marcar ${name} como presente`}
          onClick={() => set(true)}
        >
          <IconYes />
        </button>
        <button
          type="button"
          className="seg-btn seg-no"
          aria-pressed={mark === false}
          aria-label={`Marcar ${name} como ausente`}
          onClick={() => set(false)}
        >
          <IconNo />
        </button>
      </span>
    </div>
  );
}

/**
 * Derives the tallies the confirm button and progress rail both read from.
 * `pending` is what makes the "Faltam N" label truthful.
 */
export function tallyMarks(marks, total) {
  let present = 0;
  let absent = 0;
  marks.forEach((value) => {
    if (value === true) present += 1;
    else if (value === false) absent += 1;
  });
  return {
    present,
    absent,
    pending: total - present - absent,
    percentDone: Math.round(((present + absent) / total) * 100),
  };
}
