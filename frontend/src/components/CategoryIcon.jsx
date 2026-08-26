// Small inline SVG glyphs per rental category, rendered inside the shared
// .icon-circle gradient badge. Kept as real iconography (not text initials)
// so the catalog/item pages read as a designed product instead of
// placeholder boxes. Categories are admin-editable (see api/categories.js),
// so anything outside this known set falls back to a generic tag glyph
// rather than silently reusing the chair icon.
const ICONS = {
  chair: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
      <path d="M5 10h14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-5Z" />
      <path d="M7 16v4M17 16v4" />
    </svg>
  ),
  table: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h18" />
      <path d="M3 8l1.5 3M21 8l-1.5 3" />
      <path d="M6 11v9M18 11v9" />
    </svg>
  ),
  karaoke: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v4M9 21h6" />
    </svg>
  ),
  tent: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20 12 4l9 16Z" />
      <path d="M12 4v16M8 20l4-7 4 7" />
    </svg>
  ),
  decor: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M4.9 4.9l2.8 2.8M2 12h4M4.9 19.1l2.8-2.8M19.1 19.1l-2.8-2.8M22 12h-4M19.1 4.9l-2.8 2.8" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  ),
  catering: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 0-5 5c0 3 2 4 2 7h6c0-3 2-4 2-7a5 5 0 0 0-5-5Z" />
      <path d="M9 21h6M12 14v7" />
    </svg>
  ),
  // Generic fallback: a price/label tag, used for any admin-added category
  // that doesn't have a specific icon key mapped above.
  tag: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.3 20.6a2 2 0 0 1-2.8 0l-6-6a2 2 0 0 1 0-2.9L11.7 3.4h8.9v8.9Z" />
      <circle cx="16.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export default function CategoryIcon({ category, icon, size = 56, style }) {
  const glyph = ICONS[icon] || ICONS[category] || ICONS.tag;
  return (
    <span className="icon-circle" style={{ width: size, height: size, ...style }}>
      {glyph}
    </span>
  );
}
