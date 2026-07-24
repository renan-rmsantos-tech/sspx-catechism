/**
 * Chip — the primary state carrier in this system.
 *
 * State belongs in a chip and, in a list, a 4–5% row wash. It does NOT belong
 * in a filled card: colouring a whole card by status is an anti-pattern here
 * (DESIGN.md §9.6), because it makes status louder than the person's name.
 *
 * Each tone maps onto a state triad from colors_and_type.css: the chip uses
 * the `-soft` ground with `-ink` text, never the base colour as text.
 */

import React from 'react';

const TONES = {
  ok: 'chip-ok',          // accent — synced, active, present, approved
  warn: 'chip-warn',      // queued, provisional, below target
  danger: 'chip-danger',  // absent, rejected
  info: 'chip-info',      // syncing, neutral advisory
  gold: 'chip-gold',      // LITURGICAL ONLY: holy days, enrolment renewal
  neutral: '',            // "Sem aula hoje" — no state at all
};

export function Chip({ tone = 'neutral', dot = true, children, className = '', ...rest }) {
  const classes = [
    'chip',
    TONES[tone],
    dot ? '' : 'chip-plain',
    className,
  ].filter(Boolean).join(' ');

  return <span className={classes} {...rest}>{children}</span>;
}

/**
 * NetworkChip — permanent in the header of any screen that writes data.
 *
 * Offline is this product's defining trait, not an error state. Hiding the
 * connection status to make a header look tidier is an anti-pattern
 * (DESIGN.md §9.7). Catechists mark attendance in a parish hall with no
 * signal; they need to know the app knows.
 */
export function NetworkChip({ online }) {
  return (
    <Chip tone={online ? 'ok' : 'warn'} data-od-id="network-chip">
      {online ? 'Online' : 'Offline'}
    </Chip>
  );
}

/** Percentages below target read as a chip, so status has shape as well as hue. */
export function AttendanceChip({ percent, target = 75 }) {
  if (percent >= target) return <span className="num">{percent}%</span>;
  return <Chip tone="danger">{percent}%</Chip>;
}
