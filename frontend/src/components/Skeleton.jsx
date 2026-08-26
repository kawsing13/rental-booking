// Shimmering placeholder blocks shown while data loads, instead of a bare
// "Loading..." string. `ItemCardSkeleton` mirrors ItemCard's layout so the
// catalog grid doesn't visually jump once real data arrives.
export function ItemCardSkeleton() {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div className="skeleton" style={{ height: 140, marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8, borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 12, width: '45%', marginBottom: 14, borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 18, width: '35%', borderRadius: 4 }} />
    </div>
  );
}

export function CatalogSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function LineSkeleton({ width = '100%', height = 14 }) {
  return <div className="skeleton" style={{ width, height, borderRadius: 4 }} />;
}
