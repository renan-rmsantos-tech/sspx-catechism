/**
 * ReviewDrawer — where an enrolment is approved or rejected.
 *
 * WHY A DRAWER AND NOT A MODAL: the coordinator is working a queue. A modal
 * blanks the list they are working through and costs them their place; a
 * right-side panel keeps it visible behind the scrim. Using a modal here is an
 * anti-pattern in this system (DESIGN.md §9.10).
 *
 * min(460px, 100%) so it becomes a full-width sheet on a phone. --shadow-3 is
 * reserved for exactly this component — it is the only floating surface in the
 * product. Escape and the scrim both close.
 */

import React, { useEffect } from 'react';

export function ReviewDrawer({ open, enrollment, onClose, onApprove, onReject, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className="drawer"
      data-open={open ? 'true' : 'false'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawerName"
      data-od-id="enrollment-drawer"
    >
      <div className="drawer-scrim" onClick={onClose} />
      <div className="drawer-panel">
        <div className="panel-head">
          <div className="stack-sm" style={{ minWidth: 0 }}>
            <p className="eyebrow">
              Inscrição · <span className="num">{enrollment?.protocol}</span>
            </p>
            <h2 id="drawerName" style={{ overflowWrap: 'anywhere' }}>{enrollment?.name}</h2>
          </div>
          <button className="btn btn-ghost btn-icon" type="button" onClick={onClose} aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" width="18" height="18" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="drawer-body stack-lg">{children}</div>
      </div>
    </div>
  );
}

/**
 * Facts — the definition list the drawer opens with.
 * `.kv` is a 132px label column that collapses to stacked rows at 720px.
 * Values that can be long carry overflow-wrap in CSS, so an email never
 * pushes the panel wider than it should be.
 */
export function Facts({ rows }) {
  return (
    <dl className="kv">
      {rows.map(({ label, value, numeric }) => (
        <div key={label} style={{ display: 'contents' }}>
          <dt>{label}</dt>
          <dd className={numeric ? 'num' : undefined}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Rejecting always requires a reason, because the reason is sent to the parent.
 * An error that names the fix, not the failure: "O responsável precisa saber
 * o motivo."
 */
export function isRejectionValid(reason) {
  return typeof reason === 'string' && reason.trim().length > 0;
}
