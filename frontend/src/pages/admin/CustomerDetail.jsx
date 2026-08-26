import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { apiErrorMessage } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import ErrorBanner from '../../components/ErrorBanner';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getCustomer(id).then(setData).catch((err) => setError(apiErrorMessage(err)));
  }, [id]);

  if (!data) return <div className="container" style={{ paddingTop: 40 }}><ErrorBanner message={error} />{!error && 'Loading...'}</div>;

  const { customer, outstandingBalance } = data;

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 720 }}>
      <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>&larr; Back</button>
      <ErrorBanner message={error} />

      <div className="card" style={{ marginBottom: 20 }}>
        <h1 className="page-title">{customer.name}</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>{customer.email} &middot; {customer.phone}</p>
        <p>{customer.address}</p>
        <p style={{ fontWeight: 700 }}>
          Outstanding balance: <span style={{ color: outstandingBalance > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            PHP {Number(outstandingBalance).toLocaleString()}
          </span>
        </p>
      </div>

      <div className="card table-scroll" style={{ padding: 0 }}>
        <table style={{ minWidth: 560 }}>
          <thead>
            <tr><th>Reference</th><th>Event date</th><th>Status</th><th>Total</th><th></th></tr>
          </thead>
          <tbody>
            {customer.bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.bookingReference}</td>
                <td>{b.eventDate}</td>
                <td><StatusBadge status={b.status} /></td>
                <td>PHP {Number(b.totalAmount).toLocaleString()}</td>
                <td><Link to={`/admin/bookings/${b.id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
