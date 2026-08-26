import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { apiErrorMessage } from '../../api/client';
import ErrorBanner from '../../components/ErrorBanner';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', address: user.address || '' });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const { user: updated } = await authApi.updateMe(form);
      setUser(updated);
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 480 }}>
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">Your personal information, contact details, and delivery address.</p>

      <div className="card">
        <ErrorBanner message={error} />
        {saved && <p style={{ color: 'var(--color-success)' }}>Profile updated.</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email (not editable)</label>
            <input value={user.email} disabled />
          </div>
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Mobile number</label>
            <input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="address">Delivery address</label>
            <input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
        </form>
      </div>
    </div>
  );
}
