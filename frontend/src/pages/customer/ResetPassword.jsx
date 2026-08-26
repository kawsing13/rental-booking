import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { apiErrorMessage } from '../../api/client';
import ErrorBanner from '../../components/ErrorBanner';
import AuthLayout from '../../components/AuthLayout';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ token: '', newPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await authApi.resetPassword(form.token, form.newPassword);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="page-title" style={{ textAlign: 'center' }}>Reset password</h1>
      <p className="page-subtitle" style={{ textAlign: 'center' }}>Paste the token you received by email (valid for 30 minutes).</p>
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="token">Reset token</label>
          <input
            id="token"
            required
            value={form.token}
            onChange={(e) => setForm({ ...form, token: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
          {submitting ? 'Saving...' : 'Set new password'}
        </button>
      </form>
    </AuthLayout>
  );
}
