import { useEffect, useState } from 'react';
import { notificationsApi } from '../../api/notifications';
import { apiErrorMessage } from '../../api/client';
import ErrorBanner from '../../components/ErrorBanner';
import EmptyState, { EmptyIcons } from '../../components/EmptyState';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  const load = () => {
    notificationsApi.listMine().then(setNotifications).catch((err) => setError(apiErrorMessage(err)));
  };

  useEffect(load, []);

  const handleMarkRead = async (id) => {
    await notificationsApi.markRead(id);
    load();
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    load();
  };

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 640 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button className="btn btn-outline btn-sm" onClick={handleMarkAllRead}>Mark all as read</button>
        )}
      </div>
      <p className="page-subtitle">Updates about your bookings and payments.</p>
      <ErrorBanner message={error} />

      {notifications.length === 0 && !error && (
        <EmptyState icon={EmptyIcons.bell} title="You're all caught up" subtitle="New booking and payment updates will show up here." />
      )}

      {notifications.map((n) => (
        <div
          key={n.id}
          className="card fade-in"
          style={{
            marginBottom: 10,
            padding: 16,
            borderLeft: n.isRead ? '3px solid transparent' : '3px solid var(--color-primary)',
            background: n.isRead ? 'var(--color-surface)' : 'var(--color-primary-light)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
            <span style={{ fontWeight: n.isRead ? 400 : 600 }}>{n.message}</span>
            {!n.isRead && (
              <button className="btn btn-outline btn-sm" style={{ flexShrink: 0 }} onClick={() => handleMarkRead(n.id)}>Mark read</button>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
            {new Date(n.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
