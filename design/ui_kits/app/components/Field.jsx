/**
 * Field — label, control, and one line of help or error.
 *
 * The important detail: `aria-invalid` IS the styling hook. catequese-ds.css
 * targets `.input[aria-invalid="true"]` directly, so the visual error state and
 * the accessibility state cannot drift apart — there is no separate `.is-error`
 * class to forget.
 *
 * Placeholders teach rather than repeat the label. "Nome completo" takes
 * "Como consta na certidão de batismo", answering the question the label
 * raises. See DESIGN.md §8.
 */

import React from 'react';

export function Field({ id, label, hint, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <span className="err">{error}</span> : null}
      {!error && hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function TextField({ id, label, hint, error, ...rest }) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        className="input"
        aria-invalid={error ? 'true' : 'false'}
        {...rest}
      />
    </Field>
  );
}

export function SelectField({ id, label, hint, error, options = [], ...rest }) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <select id={id} className="select" aria-invalid={error ? 'true' : 'false'} {...rest}>
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function TextAreaField({ id, label, hint, error, ...rest }) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <textarea id={id} className="textarea" aria-invalid={error ? 'true' : 'false'} {...rest} />
    </Field>
  );
}

/**
 * ChoiceGroup — the system's replacement for bare radios.
 *
 * Two-option questions ("Já fez a Primeira Comunhão?") become two 44px bordered
 * tiles. The checked state comes from `:has(input:checked)` in CSS, so there is
 * no JS-driven class to keep in sync.
 */
export function ChoiceGroup({ legend, name, value, onChange, options }) {
  return (
    <fieldset className="field" style={{ border: 0, margin: 0, padding: 0 }}>
      <legend className="field-label" style={{ padding: '0 0 6px' }}>{legend}</legend>
      <div className="choice-row">
        {options.map((option) => (
          <label className="choice" key={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Search input with the 16px icon positioned inside the control. */
export function SearchField({ label, ...rest }) {
  return (
    <div className="search-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input className="input input-search" type="search" aria-label={label} {...rest} />
    </div>
  );
}
