import { useEffect, useState } from 'react';
import { itemsApi } from '../../api/items';
import { apiErrorMessage } from '../../api/client';
import ItemCard from '../../components/ItemCard';
import ErrorBanner from '../../components/ErrorBanner';
import EmptyState, { EmptyIcons } from '../../components/EmptyState';
import { CatalogSkeletonGrid } from '../../components/Skeleton';
import { useCategories } from '../../context/CategoriesContext';

const CACHE_KEY = 'rb_catalog_cache';

export default function Catalog() {
  const [items, setItems] = useState(() => {
    // Show something instantly from the last successful fetch while the
    // network request is in flight, instead of a blank page.
    try {
      return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [filters, setFilters] = useState({ category: '', search: '', minPrice: '', maxPrice: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { categories } = useCategories();
  const categoryOptions = [{ slug: '', label: 'All' }, ...categories];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      setError('');
      itemsApi
        .list({ ...filters, limit: 50 })
        .then((data) => {
          setItems(data.items);
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.items));
        })
        .catch((err) => setError(apiErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 300); // debounce search typing

    return () => clearTimeout(timeout);
  }, [filters]);

  return (
    <div>
      <div style={{ background: 'var(--gradient-hero)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container fade-in" style={{ paddingTop: 44, paddingBottom: 36 }}>
          <h1 className="page-title" style={{ fontSize: 32 }}>
            Everything for your next event
          </h1>
          <p className="page-subtitle" style={{ marginBottom: 0, fontSize: 15 }}>
            Tables, chairs, and karaoke sets - browse, check availability, and book in minutes.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {categoryOptions.map((c) => {
              const active = filters.category === c.slug;
              return (
                <button
                  key={c.slug || 'all'}
                  className="btn btn-sm"
                  onClick={() => setFilters({ ...filters, category: c.slug })}
                  style={{
                    background: active ? 'var(--gradient-primary)' : 'var(--color-primary-light)',
                    color: active ? '#fff' : 'var(--color-primary-dark)',
                    boxShadow: active ? '0 2px 8px rgba(29,95,163,0.28)' : 'none',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              placeholder="Search by name"
              style={{ flex: '1 1 200px' }}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <input
              type="number"
              placeholder="Min price"
              style={{ flex: '0 1 120px' }}
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            />
            <input
              type="number"
              placeholder="Max price"
              style={{ flex: '0 1 120px' }}
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            />
          </div>
        </div>

        <ErrorBanner message={error} />
        {loading && items.length === 0 && <CatalogSkeletonGrid />}
        {!loading && items.length === 0 && !error && (
          <EmptyState icon={EmptyIcons.box} title="No items match your filters" subtitle="Try a different category or clear the search." />
        )}

        <div className="grid grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
