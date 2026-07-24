/**
 * Sidebar — the coordination console's persistent navigation.
 *
 * 244px, sticky, full height, with modules grouped under mono uppercase labels
 * ("Ano letivo" / "Estrutura"). A pending count rides as a gold badge on the
 * right of its nav item.
 *
 * RESPONSIVE RULE: at 1024px this becomes a horizontally scrolling top strip
 * (handled entirely in catequese-ds.css — the group labels hide, the items stay
 * in a row). It does NOT become a hamburger. Seven modules that a coordinator
 * moves between constantly should never cost a tap to see. DESIGN.md §9.9.
 */

import React from 'react';

export function Sidebar({ groups, active, onNavigate, user, brand, onSignOut }) {
  return (
    <aside className="sidebar" data-od-id="admin-sidebar">
      {brand}

      {groups.map((group) => (
        <div className="nav-group" key={group.label}>
          <p className="nav-label">{group.label}</p>
          {group.items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={active === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </div>
      ))}

      <span className="spacer sidebar-foot" />

      <div className="nav-group sidebar-foot">
        <div className="row-tight" style={{ padding: '8px 10px', flexWrap: 'nowrap' }}>
          <span className="avatar" aria-hidden="true">{user.name.charAt(0)}</span>
          <div style={{ lineHeight: 1.25, minWidth: 0 }}>
            <div className="small" style={{ fontWeight: 560 }}>{user.name}</div>
            <div className="meta">{user.role}</div>
          </div>
        </div>
        <button className="nav-item" type="button" onClick={onSignOut}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M15 17l5-5-5-5M20 12H9M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
          </svg>
          Sair
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ item, active, onClick }) {
  return (
    <button
      type="button"
      className={`nav-item${active ? ' is-active' : ''}`}
      onClick={onClick}
    >
      {item.icon}
      {item.label}
      {/* Gold badge = something is waiting for a decision. Gold is signal, never action. */}
      {item.badge > 0 ? <span className="badge num">{item.badge}</span> : null}
    </button>
  );
}

/**
 * Shell — the two-column grid the console lives in.
 * `grid-template-columns: 244px minmax(0, 1fr)`; the minmax(0,…) is what keeps
 * a wide table from forcing the whole page to scroll horizontally.
 */
export function Shell({ sidebar, children }) {
  return (
    <div className="shell" data-od-id="admin-shell">
      {sidebar}
      <main className="workarea">{children}</main>
    </div>
  );
}
