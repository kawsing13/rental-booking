import { Link } from 'react-router-dom';
import CategoryIcon from './CategoryIcon';
import { useCategories } from '../context/CategoriesContext';

export default function ItemCard({ item }) {
  const { getLabel, getIcon } = useCategories();

  return (
    <Link
      to={`/items/${item.id}`}
      className="card card-hover fade-in"
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        style={{
          height: 140,
          borderRadius: 'var(--radius-sm)',
          background: item.images?.[0] ? `url(${item.images[0]}) center/cover` : 'var(--gradient-hero)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        {!item.images?.[0] && <CategoryIcon category={item.category} icon={getIcon(item.category)} size={64} />}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 2, lineHeight: 1.3 }}>{item.name}</div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10 }}>
        {getLabel(item.category)} &middot; {item.quantityTotal} in stock
      </div>
      <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--color-primary-dark)' }}>
        PHP {Number(item.rentalPrice).toLocaleString()}
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' }}> / rental</span>
      </div>
    </Link>
  );
}
