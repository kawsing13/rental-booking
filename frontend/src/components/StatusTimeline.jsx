// Horizontal progress stepper for the booking lifecycle (mirrors the
// workflow diagram in the PDF spec). Gives a booking detail page an
// at-a-glance sense of "how far along is this" instead of just a badge.
const STEPS = [
  { key: 'pending', label: 'Requested' },
  { key: 'approved', label: 'Approved' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'out_for_delivery', label: 'Delivery' },
  { key: 'in_use', label: 'In Use' },
  { key: 'returned', label: 'Returned' },
  { key: 'completed', label: 'Completed' },
];

export default function StatusTimeline({ status }) {
  if (status === 'rejected' || status === 'cancelled') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          background: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
        This booking was {status}.
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', padding: '4px 0 8px' }}>
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const color = done || active ? 'var(--color-primary)' : 'var(--color-border)';
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i === STEPS.length - 1 ? '0 0 auto' : 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 74 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: done ? 'var(--color-primary)' : active ? '#fff' : '#fff',
                  border: `2.5px solid ${color}`,
                  color: done ? '#fff' : 'var(--color-primary-dark)',
                  boxShadow: active ? 'var(--shadow-glow)' : 'none',
                  transition: 'all 0.2s var(--ease)',
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  marginTop: 6,
                  textAlign: 'center',
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                }}
              >
                {step.label}
              </span>
            </div>
            {i !== STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2.5, background: done ? 'var(--color-primary)' : 'var(--color-border)', marginTop: -20, minWidth: 16 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
