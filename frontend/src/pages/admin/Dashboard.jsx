import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { apiErrorMessage } from '../../api/client';
import ErrorBanner from '../../components/ErrorBanner';
import EmptyState, { EmptyIcons } from '../../components/EmptyState';
import { LineSkeleton } from '../../components/Skeleton';

const STAT_ICONS = {
  calendar: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  ),
  clock: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  ),
  truck: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="7" width="14" height="10" rx="1" /><path d="M15 10h4l3 3v4h-7z" /><circle cx="6" cy="19" r="1.6" /><circle cx="17.5" cy="19" r="1.6" />
    </svg>
  ),
  box: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" />
    </svg>
  ),
  money: (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

function StatCard({ label, value, icon }) {
  return (
    <div className="card card-hover fade-in" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <span className="icon-circle" style={{ width: 46, height: 46 }}>{STAT_ICONS[icon]}</span>
      <div>
        <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)' }}>{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.dashboard().then(setData).catch((err) => setError(apiErrorMessage(err)));
  }, []);

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Today's snapshot of bookings, inventory, and revenue.</p>
      <ErrorBanner message={error} />

      {!data && !error && (
        <div className="grid grid-cols-3" style={{ marginBottom: 32 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="card" key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="skeleton" style={{ width: 46, height: 46, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <LineSkeleton width="70%" height={11} />
                <div style={{ height: 6 }} />
                <LineSkeleton width="50%" height={20} />
              </div>
            </div>
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-3" style={{ marginBottom: 32 }}>
            <StatCard label="Today's bookings" value={data.todaysBookings} icon="calendar" />
            <StatCard label="Pending requests" value={data.pendingRequests} icon="clock" />
            <StatCard label="Active rentals" value={data.activeRentals} icon="truck" />
            <StatCard label="Available inventory" value={data.availableInventoryItems} icon="box" />
            <StatCard label="Monthly revenue" value={`PHP ${Number(data.monthlyRevenue).toLocaleString()}`} icon="money" />
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Most rented items</h3>
            {data.mostRentedItems.length === 0 ? (
              <EmptyState icon={EmptyIcons.box} title="No bookings yet" subtitle="Rented items will show up here once customers start booking." />
            ) : (
              <table>
                <thead>
                  <tr><th>Item</th><th>Category</th><th>Total rented</th></tr>
                </thead>
                <tbody>
                  {data.mostRentedItems.map((i) => (
                    <tr key={i.itemId}>
                      <td>{i.name}</td>
                      <td style={{ textTransform: 'capitalize' }}>{i.category}</td>
                      <td>{i.totalRented}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
