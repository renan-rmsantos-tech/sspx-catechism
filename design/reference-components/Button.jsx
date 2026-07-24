/**
 * Button — the Catequese design system's primary control.
 *
 * The source repo (sspx-catechism) already ships a `button.tsx`; the redesign
 * proposal's stated next step was to replace its loose Tailwind + inline hex
 * with these tokens. This is that component, expressed against the token
 * classes in assets/catequese-ds.css.
 *
 * Two rules this component exists to enforce:
 *
 *   1. ONE primary per screen. Nothing here can check that for you, but
 *      `variant="primary"` should appear exactly once in any screen tree.
 *   2. A DISABLED BUTTON SAYS WHY. That is why `disabledLabel` exists and
 *      why passing `disabled` without one warns in development — a greyed-out
 *      button with an unchanged label is an anti-pattern in this system.
 *      See DESIGN.md §9.5.
 */

import React from 'react';

const VARIANTS = {
  primary: 'btn-primary',     // --accent fill, --shadow-2
  secondary: 'btn-secondary', // surface + border + --shadow-1
  ghost: 'btn-ghost',         // transparent, --muted ink
  danger: 'btn-danger',       // OUTLINED, never a filled red button
};

const SIZES = {
  sm: 'btn-sm',   // 34px — coordination console only, never a catechist surface
  md: '',         // 44px — the touch floor
  lg: 'btn-lg',   // 52px
  icon: 'btn-icon',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  block = false,
  disabled = false,
  /** Required when `disabled` is true: what the user must do to enable it. */
  disabledLabel,
  icon,
  children,
  className = '',
  ...rest
}) {
  // `process` is undefined when these run straight in a browser (as they do in
  // index.html), so the guard is read defensively rather than assumed.
  const isDev = typeof process === 'undefined' || process.env?.NODE_ENV !== 'production';

  if (isDev && disabled && !disabledLabel) {
    console.warn(
      '[Catequese DS] A disabled button must explain itself. Pass `disabledLabel` ' +
      '(e.g. "Faltam 4") instead of leaving the resting label in place. DESIGN.md §9.5.'
    );
  }

  const classes = [
    'btn',
    VARIANTS[variant],
    SIZES[size],
    block ? 'btn-block' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type="button" className={classes} disabled={disabled} {...rest}>
      {icon}
      {disabled && disabledLabel ? disabledLabel : children}
    </button>
  );
}

/**
 * The canonical use: the attendance sheet's confirm button, which counts down
 * rather than sitting greyed out and silent.
 *
 *   <Button
 *     variant="primary"
 *     size="lg"
 *     disabled={remaining > 0}
 *     disabledLabel={`Faltam ${remaining}`}
 *     onClick={confirm}
 *   >
 *     Confirmar chamada
 *   </Button>
 */
export function ConfirmAttendanceButton({ remaining, onConfirm }) {
  return (
    <Button
      variant="primary"
      size="lg"
      disabled={remaining > 0}
      disabledLabel={`Faltam ${remaining}`}
      onClick={onConfirm}
      data-od-id="confirm-attendance"
    >
      Confirmar chamada
    </Button>
  );
}
