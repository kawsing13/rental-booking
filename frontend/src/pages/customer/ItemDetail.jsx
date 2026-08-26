import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { itemsApi } from '../../api/items';
import { apiErrorMessage } from '../../api/client';
import { useBookingDraft } from '../../context/BookingDraftContext';
import { useCategories } from '../../context/CategoriesContext';
import ErrorBanner from '../../components/ErrorBanner';
import CategoryIcon from '../../components/CategoryIcon';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const draft = useBookingDraft();
  const { getLabel, getIcon } = useCategories();

  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [addedMessage, setAddedMessage] = useState('');

  useEffect(() => {
    itemsApi.getOne(id).then(setItem).catch((err) => setError(apiErrorMessage(err)));
  }, [id]);

  const checkAvailability = async () => {
    if (!draft.eventDate || !draft.returnDate) {
      setError('Pick an event date and return date first (below) to check availability.');
      return;
    }
    setError('');
    setChecking(true);
    try {
      const result = await itemsApi.checkAvailability(id, draft.eventDate, draft.returnDate);
      setAvailability(result);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const handleAdd = () => {
    if (availability && quantity > availability.available) {
      setError(`Only ${availability.available} unit(s) available for those dates.`);
      return;
    }
    draft.addItem(item, quantity);
    setAddedMessage(`Added ${quantity} x ${item.name} to your booking.`);
  };

  if (!item) return <div className="container" style={{ paddingTop: 40 }}><ErrorBanner message={error} />{!error && 'Loading...'}</div>;

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 720 }}>
      <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        &larr; Back
      </button>

      <div className="card">
        <div
          style={{
            height: 240,
            borderRadius: 'var(--radius)',
            background: item.images?.[0] ? `url(${item.images[0]}) center/cover` : 'var(--gradient-hero)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!item.images?.[0] && <CategoryIcon category={item.category} icon={getIcon(item.category)} size={84} />}
        </div>
        <h1 className="page-title">{item.name}</h1>
        <p className="page-subtitle" style={{ marginBottom: 12 }}>{getLabel(item.category)}</p>
        <p style={{ lineHeight: 1.6 }}>{item.description}</p>
        {item.rentalTerms && (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', background: 'var(--color-primary-light)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
            <strong style={{ color: 'var(--color-primary-dark)' }}>Rental terms:</strong> {item.rentalTerms}
          </p>
        )}
        <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-primary-dark)', margin: '14px 0' }}>
          PHP {Number(item.rentalPrice).toLocaleString()}
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}> / rental</span>
        </p>

        <ErrorBanner message={error} />
        {addedMessage && (
          <div
            className="fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            {addedMessage}
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/booking/review')}>Review booking</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end', marginBottom: 12 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Event date</label>
            <input type="date" value={draft.eventDate} onChange={(e) => draft.setEventDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Return date</label>
            <input type="date" value={draft.returnDate} onChange={(e) => draft.setReturnDate(e.target.value)} />
          </div>
          <button className="btn btn-outline" onClick={checkAvailability} disabled={checking}>
            {checking ? 'Checking...' : 'Check availability'}
          </button>
        </div>

        {availability && (
          <div
            className="fade-in"
            style={{
              fontSize: 14,
              marginBottom: 12,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: availability.available > 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color: availability.available > 0 ? 'var(--color-success)' : 'var(--color-danger)',
              fontWeight: 600,
            }}
          >
            {availability.available > 0
              ? `${availability.available} of ${availability.quantityTotal} unit(s) available for these dates`
              : `None available for these dates (${availability.reserved} already reserved)`}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              style={{ width: 90 }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>Add to booking</button>
        </div>
      </div>
    </div>
  );
}
