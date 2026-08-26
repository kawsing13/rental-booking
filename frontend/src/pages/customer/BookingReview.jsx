import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingDraft } from '../../context/BookingDraftContext';
import { bookingsApi } from '../../api/bookings';
import { apiErrorMessage } from '../../api/client';
import ErrorBanner from '../../components/ErrorBanner';

export default function BookingReview() {
  const draft = useBookingDraft();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!draft.eventDate || !draft.returnDate) {
      setError('Event date and return date are required.');
      return;
    }
    if (draft.lines.length === 0) {
      setError('Add at least one item before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const booking = await bookingsApi.create({
        eventDate: draft.eventDate,
        returnDate: draft.returnDate,
        deliveryAddress: draft.deliveryAddress || undefined,
        notes: draft.notes || undefined,
        items: draft.lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
      });
      draft.clear();
      navigate(`/my-bookings/${booking.id}`, { replace: true });
    } catch (err) {
      // 409 conflict details tell us exactly which item/how many remain -
      // surface that instead of a generic message so the customer can fix it.
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const deliveryFee = draft.deliveryAddress ? 200 : 0;
  const total = draft.subtotal + deliveryFee;
  const reservationFee = Number((total * 0.2).toFixed(2));

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 640 }}>
      <h1 className="page-title">Review your booking</h1>
      <p className="page-subtitle">Confirm items, dates, and delivery before submitting.</p>

      <ErrorBanner message={error} />

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label>Event date</label>
            <input type="date" value={draft.eventDate} onChange={(e) => draft.setEventDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label>Return date</label>
            <input type="date" value={draft.returnDate} onChange={(e) => draft.setReturnDate(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Delivery address (leave blank for pickup)</label>
          <input
            value={draft.deliveryAddress}
            onChange={(e) => draft.setDeliveryAddress(e.target.value)}
            placeholder="e.g. 123 Sample St, Quezon City"
          />
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea rows={2} value={draft.notes} onChange={(e) => draft.setNotes(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Items</h3>
        {draft.lines.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No items yet — browse the catalog to add some.</p>}
        {draft.lines.map((line) => (
          <div key={line.itemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{line.name}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>PHP {line.unitPrice.toLocaleString()} each</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) => draft.updateQuantity(line.itemId, Math.max(1, Number(e.target.value)))}
                style={{ width: 70 }}
              />
              <button className="btn btn-outline btn-sm" onClick={() => draft.removeItem(line.itemId)}>Remove</button>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 16, fontSize: 14 }}>
          <Row label="Items subtotal" value={draft.subtotal} />
          <Row label="Delivery fee" value={deliveryFee} />
          <Row label="Total amount" value={total} bold />
          <Row label="Reservation fee (20%, due now)" value={reservationFee} />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 16 }}
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting...' : 'Submit booking request'}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: bold ? 700 : 400 }}>
      <span>{label}</span>
      <span>PHP {Number(value).toLocaleString()}</span>
    </div>
  );
}
