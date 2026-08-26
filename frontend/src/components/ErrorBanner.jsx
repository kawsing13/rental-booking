export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div
      className="fade-in"
      style={{
        background: 'var(--color-danger-bg)',
        color: 'var(--color-danger)',
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 14,
        fontWeight: 500,
        marginBottom: 16,
      }}
    >
      {message}
    </div>
  );
}
