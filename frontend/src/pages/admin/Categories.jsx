import { useState } from 'react';
import { categoriesApi } from '../../api/categories';
import { apiErrorMessage } from '../../api/client';
import { useCategories } from '../../context/CategoriesContext';
import ErrorBanner from '../../components/ErrorBanner';
import CategoryIcon from '../../components/CategoryIcon';
import EmptyState, { EmptyIcons } from '../../components/EmptyState';

const ICON_OPTIONS = ['chair', 'table', 'karaoke', 'tent', 'decor', 'catering', 'tag'];
const EMPTY_FORM = { slug: '', label: '', icon: 'tag' };

// Lets an admin add new rental categories (tents, decorations, catering
// equipment, etc. - the PDF spec's "Future Enhancements" list) without
// needing a code/schema change. See backend categoryController.js.
export default function Categories() {
  const { categories, refresh } = useCategories();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null); // category being label/icon-edited, or null
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await categoriesApi.create(form);
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category) => setEditing({ id: category.id, label: category.label, icon: category.icon || 'tag' });

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await categoriesApi.update(editing.id, { label: editing.label, icon: editing.icon });
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.label}"? This only works if no items use it.`)) return;
    setError('');
    try {
      await categoriesApi.remove(category.id);
      await refresh();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 780 }}>
      <h1 className="page-title">Category Management</h1>
      <p className="page-subtitle">
        Add rental categories beyond chairs, tables, and karaoke sets - tents, decorations, catering equipment,
        and anything else the business starts renting out.
      </p>
      <ErrorBanner message={error} />

      <div className="card" style={{ marginBottom: 24, borderTop: '3px solid var(--color-primary)' }}>
        <h3 style={{ marginTop: 0 }}>Add category</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 160px' }}>
            <label>Slug (internal id)</label>
            <input
              required
              placeholder="e.g. tents"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Lowercase letters/numbers with dashes only"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
            />
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 160px' }}>
            <label>Display label</label>
            <input required placeholder="e.g. Tents" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Icon</label>
            <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
              {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <CategoryIcon category={form.slug} icon={form.icon} size={40} />
          <button className="btn btn-primary" disabled={saving}>Add category</button>
        </form>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={EmptyIcons.box} title="No categories yet" subtitle="Add one above to start listing items under it." />
      ) : (
        <div className="grid grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {editing?.id === c.id ? (
                <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
                  <select value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })}>
                    {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-primary btn-sm" disabled={saving}>Save</button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CategoryIcon category={c.slug} icon={c.icon} size={44} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{c.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{c.slug}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => startEdit(c)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
