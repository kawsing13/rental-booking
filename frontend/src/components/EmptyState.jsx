// Friendly "nothing here yet" placeholder with an icon, used anywhere a
// list can legitimately be empty (catalog filters, bookings, cart,
// notifications) instead of a bare line of text.
export default function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="empty-state fade-in">
      <span className="icon-circle" style={{ width: 64, height: 64, background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
        {icon}
      </span>
      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text)', marginTop: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 14, marginTop: 4 }}>{subtitle}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export const EmptyIcons = {
  box: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  ),
  bell: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 4 2 5 2 5H4s2-1 2-5Z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  ),
  cart: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21.5 8H6" />
    </svg>
  ),
};
