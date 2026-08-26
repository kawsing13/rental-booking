import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { apiErrorMessage } from '../../api/client';
import ErrorBanner from '../../components/ErrorBanner';

function toMonthValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildDayCells(monthValue) {
  const [year, month] = monthValue.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlanks = firstDay.getDay();

  const cells = Array(leadingBlanks).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month - 1, d));
  }
  return cells;
}

export default function Calendar() {
  const [month, setMonth] = useState(toMonthValue(new Date()));
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.calendar(month).then(setData).catch((err) => setError(apiErrorMessage(err)));
  }, [month]);

  const eventsForDay = (date) => {
    if (!data || !date) return [];
    const iso = date.toISOString().slice(0, 10);
    const events = [];
    data.deliveries
      .filter((d) => d.scheduledDate === iso)
      .forEach((d) => events.push({ label: `${d.type}: ${d.booking?.bookingReference}`, kind: d.type }));
    data.reservedDates
      .filter((b) => iso >= b.eventDate && iso <= b.returnDate)
      .forEach((b) => events.push({ label: b.bookingReference, kind: 'reserved' }));
    return events;
  };

  const cells = buildDayCells(month);

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <h1 className="page-title">Calendar</h1>
      <p className="page-subtitle">Deliveries, pickups, and reserved dates at a glance.</p>
      <ErrorBanner message={error} />

      <div className="form-group" style={{ maxWidth: 200 }}>
        <label>Month</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      <div className="card table-scroll">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, minWidth: 640 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>{d}</div>
        ))}
        {cells.map((date, idx) => {
          const isToday = date && date.toDateString() === new Date().toDateString();
          return (
          <div
            key={idx}
            style={{
              minHeight: 90,
              border: isToday ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 6,
              background: date ? (isToday ? 'var(--color-primary-light)' : 'var(--color-surface)') : 'transparent',
              transition: 'border-color 0.15s var(--ease)',
            }}
          >
            {date && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: isToday ? 'var(--color-primary-dark)' : 'inherit' }}>
                  {date.getDate()}
                </div>
                {eventsForDay(date).map((e, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 10,
                      padding: '2px 4px',
                      borderRadius: 4,
                      marginBottom: 2,
                      background: e.kind === 'pickup' ? 'var(--color-purple-bg)' : e.kind === 'delivery' ? 'var(--color-primary-light)' : 'var(--color-success-bg)',
                      color: e.kind === 'pickup' ? 'var(--color-purple)' : e.kind === 'delivery' ? 'var(--color-primary-dark)' : 'var(--color-success)',
                    }}
                  >
                    {e.label}
                  </div>
                ))}
              </>
            )}
          </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
