import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { apiErrorMessage } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import ErrorBanner from '../../components/ErrorBanner';

const NEXT_STATUS = { scheduled: 'out', out: 'completed' };

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ bookingId: '', type: 'delivery', scheduledDate: '', address: '', assignedPersonnel: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    adminApi.listDeliveries(dateFilter || undefined).then(setDeliveries).catch((err) => setError(apiErrorMessage(err)));
  };

  useEffect(load, [dateFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await adminApi.createDelivery(form);
      setForm({ bookingId: '', type: 'delivery', scheduledDate: '', address: '', assignedPersonnel: '' });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const advanceStatus = async (delivery) => {
    const next = NEXT_STATUS[delivery.status];
    if (!next) return;
    await adminApi.updateDelivery(delivery.id, { status: next });
    load();
  };

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 className="page-title">Delivery Management</h1>
      <p className="page-subtitle">Schedule and track deliveries and pickups.</p>
      <ErrorBanner message={error} />

      <div className="card" style={{ marginBottom: 24, borderTop: '3px solid var(--color-primary)' }}>
        <h3 style={{ marginTop: 0 }}>Schedule delivery / pickup</h3>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          Copy the booking ID from the booking detail page URL.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 260px' }}>
            <label>Booking ID</label>
            <input required value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Date</label>
            <input type="date" required value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <label>Address (optional, defaults to booking)</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Assigned personnel</label>
            <input value={form.assignedPersonnel} onChange={(e) => setForm({ ...form, assignedPersonnel: e.target.value })} />
          </div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Schedule'}</button>
        </form>
      </div>

      <div className="form-group" style={{ maxWidth: 200 }}>
        <label>Filter by date</label>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
      </div>

      <div className="card table-scroll" style={{ padding: 0 }}>
        <table style={{ minWidth: 760 }}>
          <thead>
            <tr><th>Booking</th><th>Type</th><th>Date</th><th>Address</th><th>Personnel</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id}>
                <td>{d.booking?.bookingReference}</td>
                <td style={{ textTransform: 'capitalize' }}>{d.type}</td>
                <td>{d.scheduledDate}</td>
                <td>{d.address}</td>
                <td>{d.assignedPersonnel || '-'}</td>
                <td><StatusBadge status={d.status} /></td>
                <td>
                  {NEXT_STATUS[d.status] && (
                    <button className="btn btn-outline btn-sm" onClick={() => advanceStatus(d)}>
                      Mark {NEXT_STATUS[d.status]}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
