import BrandMark, { BrandWordmark } from './BrandMark';

// Shared shell for the four auth pages (login/register/forgot/reset) - the
// gradient backdrop + logo mark were being copy-pasted, so it's centralized
// here instead.
export default function AuthLayout({ children, maxWidth = 420 }) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        background: 'var(--gradient-hero)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
      }}
    >
      <div className="fade-in" style={{ width: '100%', maxWidth }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <BrandMark size={56} />
          <BrandWordmark size={24} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
            }}
          >
            Rent &middot; Book &middot; Enjoy
          </span>
        </div>
        <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>{children}</div>
      </div>
    </div>
  );
}
