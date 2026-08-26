import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bookingsApi } from '../../api/bookings';
import { paymentsApi } from '../../api/payments';
import { apiErrorMessage } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import StatusTimeline from '../../components/StatusTimeline';
import ErrorBanner from '../../components/ErrorBanner';

const NEXT_ACTIONS = {
  pending: ['approved', 'rejected'],
  approved: ['reserved', 'cancelled'],
  reserved: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['in_use'],
  in_use: ['returned'],
  returned: ['completed'],
};

export default function AdminBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');

  const load = () => {
    bookingsApi.getOne(id).then(setBooking).catch((err) => setError(apiErrorMessage(err)));
    paymentsApi.listForBooking(id).then(setPayments).catch(() => {});
  };

  useEffect(load, [id]);

  const handleTransition = async (status) => {
    try {
      await bookingsApi.updateStatus(id, status);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const handleConfirmPayment = async (paymentId) => {
    try {
      await paymentsApi.confirm(paymentId);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  if (!booking) return <div className="container" style={{ paddingTop: 40 }}><ErrorBanner message={error} />{!error && 'Loading...'}</div>;

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 720 }}>
      <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>&larr; Back</button>
      <ErrorBanner message={error} />

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>{booking.bookingReference}</h1>
            <StatusBadge status={booking.status} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(NEXT_ACTIONS[booking.status] || []).map((next) => (
              <button
                key={next}
                className={`btn btn-sm ${next === 'rejected' || next === 'cancelled' ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => handleTransition(next)}
              >
                {next.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <StatusTimeline status={booking.status} />
        </div>

        <div style={{ display: 'flex', gap: 32, marginTop: 8, fontSize: 14 }}>
          <div><strong>Customer</strong><div>{booking.customer?.name}</div><div>{booking.customer?.email}</div><div>{booking.customer?.phone}</div></div>
          <div><strong>Event date</strong><div>{booking.eventDate}</div></div>
          <div><strong>Return date</strong><div>{booking.returnDate}</div></div>
          <div><strong>Delivery</strong><div>{booking.deliveryAddress || 'Pickup'}</div></div>
        </div>

        <h3>Items</h3>
        {booking.items?.map((line) => (
          <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
            <span>{line.item?.name} &times; {line.quantity}</span>
            <span>PHP {Number(line.subtotal).toLocaleString()}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
          <span>Total</span><span>PHP {Number(booking.totalAmount).toLocaleString()}</span>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Payments</h3>
        {payments.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No payments yet.</p>}
        {payments.map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 14 }}>
            <span>{p.type} via {p.method.replace('_', ' ')} - PHP {Number(p.amount).toLocaleString()}</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <StatusBadge status={p.status} />
              {p.status === 'pending' && (
                <button className="btn btn-outline btn-sm" onClick={() => handleConfirmPayment(p.id)}>Confirm received</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
