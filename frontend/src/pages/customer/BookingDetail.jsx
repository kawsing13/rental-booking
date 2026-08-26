import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bookingsApi } from '../../api/bookings';
import { paymentsApi } from '../../api/payments';
import { apiErrorMessage } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import StatusTimeline from '../../components/StatusTimeline';
import ErrorBanner from '../../components/ErrorBanner';

const PAYMENT_METHODS = [
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'pickup_cash', label: 'Cash on Pickup' },
];
const CASH_METHODS = ['cod', 'pickup_cash'];

// Money is summed here the same way the backend does (integer cents) so the
// UI's idea of "balance due" never drifts from what the server will
// actually accept - a float sum like 0.1 + 0.2 landing on 0.30000000000004
// is exactly the kind of thing that could leave a fully-paid booking
// reading as "still owes ₱0.0000004" and keep the payment form showing.
function toCents(n) {
  return Math.round(Number(n) * 100);
}
function fromCents(cents) {
  return Math.round(cents) / 100;
}

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');
  const [payForm, setPayForm] = useState({ method: 'gcash', type: 'reservation', amount: '', cashTendered: '' });
  const [paying, setPaying] = useState(false);

  // Returns a promise so callers (handlePay) can await the refreshed
  // balance before re-enabling the "Pay now" button - previously this ran
  // fire-and-forget, so the button re-enabled with the *stale* balance
  // still on screen and a fast double-click could submit a second payment
  // before the real balance ever appeared. That race was the actual cause
  // of the double-payment bug, not just a missing server-side check.
  const load = async () => {
    const [freshBooking] = await Promise.all([
      bookingsApi.getOne(id).then(setBooking).catch((err) => setError(apiErrorMessage(err))),
      paymentsApi.listForBooking(id).then(setPayments).catch(() => {}),
    ]);
    return freshBooking;
  };

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCents = booking ? toCents(booking.totalAmount) : 0;
  const paidCents = payments
    .filter((p) => p.status === 'paid' && p.type !== 'refund')
    .reduce((sum, p) => sum + toCents(p.amount), 0);
  const balanceDueCents = Math.max(totalCents - paidCents, 0);
  const balanceDue = fromCents(balanceDueCents);
  const fullyPaid = booking && balanceDueCents <= 0;

  // Default/re-sync the payment amount to the current balance whenever it
  // changes (booking loads, or a payment just landed) - defaults to "pay
  // what's left" rather than always re-suggesting the reservation fee,
  // and never leaves a stale amount sitting in the field that no longer
  // matches reality (that staleness was part of how the double-pay bug
  // could happen in the first place).
  useEffect(() => {
    if (booking) {
      setPayForm((f) => ({ ...f, amount: balanceDue > 0 ? balanceDue : '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking, balanceDueCents]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const updated = await bookingsApi.cancel(id);
      setBooking(updated);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const isCash = CASH_METHODS.includes(payForm.method);
  const amountCents = toCents(payForm.amount || 0);
  const tenderedCents = toCents(payForm.cashTendered || 0);
  const changeDue = isCash && payForm.cashTendered !== '' ? fromCents(tenderedCents - amountCents) : null;
  const cashInsufficient = isCash && payForm.cashTendered !== '' && tenderedCents < amountCents;

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');

    if (amountCents <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (amountCents > balanceDueCents) {
      setError(`That would overpay this booking - only PHP ${balanceDue.toFixed(2)} is left to pay.`);
      return;
    }
    if (cashInsufficient) {
      setError('Cash tendered is less than the amount being paid.');
      return;
    }

    setPaying(true);
    try {
      await paymentsApi.create({
        bookingId: id,
        method: payForm.method,
        type: payForm.type,
        amount: Number(payForm.amount),
        cashTendered: isCash && payForm.cashTendered !== '' ? Number(payForm.cashTendered) : undefined,
      });
      await load(); // wait for the real balance before re-enabling the form
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  if (!booking) return <div className="container" style={{ paddingTop: 40 }}><ErrorBanner message={error} />{!error && 'Loading...'}</div>;

  const totalPaid = fromCents(paidCents);
  const canCancel = ['pending', 'approved'].includes(booking.status);

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
          {canCancel && <button className="btn btn-danger btn-sm" onClick={handleCancel}>Cancel booking</button>}
        </div>

        <div style={{ marginTop: 24 }}>
          <StatusTimeline status={booking.status} />
        </div>

        <div style={{ display: 'flex', gap: 32, marginTop: 8, fontSize: 14 }}>
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

        <div style={{ marginTop: 16, fontSize: 14 }}>
          <Row label="Delivery fee" value={booking.deliveryFee} />
          <Row label="Total amount" value={booking.totalAmount} bold />
          <Row label="Reservation fee" value={booking.reservationFee} />
          <Row label="Paid so far" value={totalPaid} />
          <Row label="Balance due" value={balanceDue} bold />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Payment history</h3>
        {payments.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No payments yet.</p>}
        {payments.map((p) => (
          <div key={p.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{p.type} via {p.method.replace('_', ' ')} {p.receiptNumber ? `(${p.receiptNumber})` : ''}</span>
              <span>
                PHP {Number(p.amount).toLocaleString()} <StatusBadge status={p.status} />
              </span>
            </div>
            {p.cashTendered != null && (
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Cash tendered PHP {Number(p.cashTendered).toLocaleString()} &middot; Change PHP {Number(p.changeDue).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {fullyPaid && !['completed', 'cancelled', 'rejected'].includes(booking.status) && (
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            fontWeight: 700,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          This booking is fully paid - no balance remaining.
        </div>
      )}

      {!fullyPaid && !['completed', 'cancelled', 'rejected'].includes(booking.status) && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Make a payment</h3>
          <form onSubmit={handlePay} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Method</label>
              <select
                value={payForm.method}
                onChange={(e) => setPayForm({ ...payForm, method: e.target.value, cashTendered: '' })}
              >
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Type</label>
              <select value={payForm.type} onChange={(e) => setPayForm({ ...payForm, type: e.target.value })}>
                <option value="reservation">Reservation</option>
                <option value="balance">Balance</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Amount (PHP)</label>
              <input
                type="number"
                min={0.01}
                max={balanceDue}
                step="0.01"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                style={{ width: 120 }}
              />
            </div>
            {isCash && (
              <div className="form-group" style={{ margin: 0 }}>
                <label>Cash tendered (PHP)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Optional"
                  value={payForm.cashTendered}
                  onChange={(e) => setPayForm({ ...payForm, cashTendered: e.target.value })}
                  style={{ width: 130 }}
                />
              </div>
            )}
            <button className="btn btn-primary" disabled={paying || cashInsufficient}>{paying ? 'Processing...' : 'Pay now'}</button>
          </form>

          {isCash && payForm.cashTendered !== '' && (
            <div
              className="fade-in"
              style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: cashInsufficient ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                color: cashInsufficient ? 'var(--color-danger)' : 'var(--color-success)',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {cashInsufficient
                ? `Cash tendered is PHP ${(amountCents / 100 - tenderedCents / 100).toFixed(2)} short.`
                : `Change: PHP ${changeDue.toFixed(2)}`}
            </div>
          )}

          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
            GCash/Maya confirm instantly. Bank transfer / cash payments are marked pending until staff confirms
            receipt. Balance due right now: <strong>PHP {balanceDue.toFixed(2)}</strong>.
          </p>
        </div>
      )}
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
