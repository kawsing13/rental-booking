import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { apiErrorMessage } from '../../api/client';
import ErrorBanner from '../../components/ErrorBanner';
import AuthLayout from '../../components/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="page-title" style={{ textAlign: 'center' }}>Forgot password</h1>
      <p className="page-subtitle" style={{ textAlign: 'center' }}>We'll email you a reset link if the account exists.</p>
      <ErrorBanner message={error} />
      {message ? (
        <p style={{ textAlign: 'center' }}>{message} <Link to="/reset-password">Have a token already?</Link></p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
      <div style={{ marginTop: 16, fontSize: 14, textAlign: 'center' }}>
        <Link to="/login">Back to log in</Link>
      </div>
    </AuthLayout>
  );
}
