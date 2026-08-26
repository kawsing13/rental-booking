import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { apiErrorMessage } from '../../api/client';
import ErrorBanner from '../../components/ErrorBanner';
import EmptyState, { EmptyIcons } from '../../components/EmptyState';

function initials(name) {
  return (name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.listCustomers().then(setCustomers).catch((err) => setError(apiErrorMessage(err)));
  }, []);

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 className="page-title">Customer Management</h1>
      <p className="page-subtitle">Customer information, booking history, and outstanding balances.</p>
      <ErrorBanner message={error} />

      {customers.length === 0 && !error ? (
        <EmptyState icon={EmptyIcons.box} title="No customers yet" subtitle="Registered customers will appear here." />
      ) : (
        <div className="card table-scroll" style={{ padding: 0 }}>
          <table style={{ minWidth: 620 }}>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th></th></tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'var(--gradient-accent)',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {initials(c.name)}
                      </span>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.address}</td>
                  <td><Link to={`/admin/customers/${c.id}`}>View &rarr;</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
