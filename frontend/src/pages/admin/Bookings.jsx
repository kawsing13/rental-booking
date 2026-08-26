import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../../api/bookings';
import { apiErrorMessage } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import ErrorBanner from '../../components/ErrorBanner';
import EmptyState, { EmptyIcons } from '../../components/EmptyState';

// Mirrors bookingController.ALLOWED_TRANSITIONS on the backend - keeping
// this list here means the admin only ever sees buttons for moves the API
// will actually accept.
const NEXT_ACTIONS = {
  pending: ['approved', 'rejected'],
  approved: ['reserved', 'cancelled'],
  reserved: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['in_use'],
  in_use: ['returned'],
  returned: ['completed'],
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    bookingsApi.listAll(statusFilter || undefined).then(setBookings).catch((err) => setError(apiErrorMessage(err)));
  };

  useEffect(load, [statusFilter]);

  const handleTransition = async (id, status) => {
    try {
      await bookingsApi.updateStatus(id, status);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 className="page-title">Booking Management</h1>
      <p className="page-subtitle">Review, approve, and progress bookings through the rental workflow.</p>
      <ErrorBanner message={error} />

      <div className="form-group" style={{ maxWidth: 220 }}>
        <label>Filter by status</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          {['pending', 'approved', 'reserved', 'out_for_delivery', 'in_use', 'returned', 'completed', 'rejected', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
          ))}
        </select>
      </div>

      {bookings.length === 0 && !error && (
        <EmptyState icon={EmptyIcons.box} title="No bookings found" subtitle="Try a different status filter." />
      )}

      {bookings.length > 0 && (
      <div className="card table-scroll" style={{ padding: 0 }}>
        <table style={{ minWidth: 700 }}>
          <thead>
            <tr><th>Reference</th><th>Customer</th><th>Event date</th><th>Status</th><th>Total</th><th></th></tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td><Link to={`/admin/bookings/${b.id}`}>{b.bookingReference}</Link></td>
                <td>{b.customer?.name}</td>
                <td>{b.eventDate}</td>
                <td><StatusBadge status={b.status} /></td>
                <td>PHP {Number(b.totalAmount).toLocaleString()}</td>
                <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(NEXT_ACTIONS[b.status] || []).map((next) => (
                    <button
                      key={next}
                      className={`btn btn-sm ${next === 'rejected' || next === 'cancelled' ? 'btn-danger' : 'btn-outline'}`}
                      onClick={() => handleTransition(b.id, next)}
                    >
                      {next.replaceAll('_', ' ')}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
