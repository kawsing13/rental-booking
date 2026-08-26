import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { categoriesApi } from '../api/categories';

const CategoriesContext = createContext(null);

function capitalize(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Fetches the admin-editable category list once and shares it app-wide, so
// the catalog filters, inventory form, and item cards/detail pages all stay
// in sync without each re-fetching /api/categories independently.
export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    return categoriesApi
      .list()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const bySlug = useMemo(() => new Map(categories.map((c) => [c.slug, c])), [categories]);

  // Falls back to a capitalized version of the slug for a category that
  // hasn't loaded yet (or was deleted after an item already referenced it),
  // so the UI never shows a raw lowercase slug like "tents" verbatim.
  const getLabel = useCallback((slug) => bySlug.get(slug)?.label || capitalize(slug || ''), [bySlug]);
  const getIcon = useCallback((slug) => bySlug.get(slug)?.icon || null, [bySlug]);

  return (
    <CategoriesContext.Provider value={{ categories, loading, refresh, getLabel, getIcon }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within a CategoriesProvider');
  return ctx;
}
