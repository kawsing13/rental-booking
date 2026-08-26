import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../../api/bookings';
import { apiErrorMessage } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import ErrorBanner from '../../components/ErrorBanner';
import EmptyState, { EmptyIcons } from '../../components/EmptyState';
import { LineSkeleton } from '../../components/Skeleton';

const CACHE_KEY = 'rb_my_bookings_cache';

export default function MyBookings() {
  const [bookings, setBookings] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi
      .listMine()
      .then((data) => {
        setBookings(data);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 className="page-title">My Bookings</h1>
      <p className="page-subtitle">Track the status of your rental requests.</p>
      <ErrorBanner message={error} />

      {loading && bookings.length === 0 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2, 3].map((i) => <LineSkeleton key={i} height={20} />)}
        </div>
      )}

      {!loading && bookings.length === 0 && !error && (
        <EmptyState
          icon={EmptyIcons.cart}
          title="No bookings yet"
          subtitle="Browse the catalog to reserve tables, chairs, or a karaoke set."
          action={<Link to="/" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>Browse rentals</Link>}
        />
      )}

      {bookings.length > 0 && (
        <div className="card table-scroll" style={{ padding: 0 }}>
          <table style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Event date</th>
                <th>Status</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.bookingReference}</td>
                  <td>{b.eventDate}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td style={{ fontWeight: 600 }}>PHP {Number(b.totalAmount).toLocaleString()}</td>
                  <td><Link to={`/my-bookings/${b.id}`}>View &rarr;</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
