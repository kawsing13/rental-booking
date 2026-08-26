import { useState } from 'react';
import { adminApi } from '../../api/admin';
import { apiErrorMessage } from '../../api/client';
import ErrorBanner from '../../components/ErrorBanner';

const REPORTS = [
  { value: 'bookings', label: 'Bookings' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'inventory-usage', label: 'Inventory Usage / Most Rented' },
  { value: 'cancelled', label: 'Cancelled Bookings' },
];

export default function Reports() {
  const [report, setReport] = useState('bookings');
  const [period, setPeriod] = useState('monthly');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const params = report === 'bookings' ? { period } : {};

  const handlePreview = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await adminApi.reportPreview(report, params);
      setPreview(data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    setError('');
    try {
      await adminApi.downloadReport(report, format, params);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const columns = preview?.rows?.[0] ? Object.keys(preview.rows[0]) : [];

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 className="page-title">Reports</h1>
      <p className="page-subtitle">Generate and export booking, revenue, and inventory reports.</p>
      <ErrorBanner message={error} />

      <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end', borderTop: '3px solid var(--color-primary)' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Report</label>
          <select value={report} onChange={(e) => setReport(e.target.value)}>
            {REPORTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        {report === 'bookings' && (
          <div className="form-group" style={{ margin: 0 }}>
            <label>Period</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        )}
        <button className="btn btn-outline" onClick={handlePreview} disabled={loading}>
          {loading ? 'Loading...' : 'Preview'}
        </button>
        <button className="btn btn-primary" onClick={() => handleDownload('csv')}>Export CSV</button>
        <button className="btn btn-primary" onClick={() => handleDownload('excel')}>Export Excel</button>
        <button className="btn btn-primary" onClick={() => handleDownload('pdf')}>Export PDF</button>
      </div>

      {preview && (
        <div className="card" style={{ padding: 0 }}>
          {preview.rows.length === 0 ? (
            <p style={{ padding: 20 }}>No data for this report.</p>
          ) : (
            <table>
              <thead>
                <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i}>
                    {columns.map((c) => <td key={c}>{String(row[c] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
