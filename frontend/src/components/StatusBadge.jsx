// Maps every booking/payment/delivery status to a semantic color token so
// the same status always looks the same everywhere in the app (dashboard,
// tables, detail pages). Values are CSS variables (not literal hex) so the
// pills automatically repaint correctly in dark mode - see theme.css.
const COLORS = {
  pending: { bg: 'var(--color-warning-bg)', fg: 'var(--color-warning)' },
  approved: { bg: 'var(--color-primary-light)', fg: 'var(--color-primary-dark)' },
  reserved: { bg: 'var(--color-primary-light)', fg: 'var(--color-primary-dark)' },
  out_for_delivery: { bg: 'var(--color-purple-bg)', fg: 'var(--color-purple)' },
  in_use: { bg: 'var(--color-teal-bg)', fg: 'var(--color-teal)' },
  returned: { bg: 'var(--color-muted-status-bg)', fg: 'var(--color-muted-status)' },
  completed: { bg: 'var(--color-success-bg)', fg: 'var(--color-success)' },
  rejected: { bg: 'var(--color-danger-bg)', fg: 'var(--color-danger)' },
  cancelled: { bg: 'var(--color-danger-bg)', fg: 'var(--color-danger)' },
  paid: { bg: 'var(--color-success-bg)', fg: 'var(--color-success)' },
  failed: { bg: 'var(--color-danger-bg)', fg: 'var(--color-danger)' },
  refunded: { bg: 'var(--color-muted-status-bg)', fg: 'var(--color-muted-status)' },
  available: { bg: 'var(--color-success-bg)', fg: 'var(--color-success)' },
  under_maintenance: { bg: 'var(--color-warning-bg)', fg: 'var(--color-warning)' },
};

export default function StatusBadge({ status }) {
  const color = COLORS[status] || { bg: 'var(--color-muted-status-bg)', fg: 'var(--color-muted-status)' };
  return (
    <span className="badge" style={{ background: color.bg, color: color.fg }}>
      {String(status).replaceAll('_', ' ')}
    </span>
  );
}
