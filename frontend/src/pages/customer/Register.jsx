import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../api/client';
import ErrorBanner from '../../components/ErrorBanner';
import AuthLayout from '../../components/AuthLayout';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <AuthLayout maxWidth={460}>
      <h1 className="page-title" style={{ textAlign: 'center' }}>Create an account</h1>
      <p className="page-subtitle" style={{ textAlign: 'center' }}>Sign up to start booking tables, chairs, and karaoke sets.</p>
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full name</label>
          <input id="name" required value={form.name} onChange={update('name')} />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={update('email')} />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Mobile number</label>
          <input id="phone" value={form.phone} onChange={update('phone')} />
        </div>
        <div className="form-group">
          <label htmlFor="address">Delivery address</label>
          <input id="address" value={form.address} onChange={update('address')} />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={update('password')}
          />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
      <div style={{ marginTop: 16, fontSize: 14, textAlign: 'center' }}>
        Already have an account? <Link to="/login">Log in</Link>
      </div>
    </AuthLayout>
  );
}
