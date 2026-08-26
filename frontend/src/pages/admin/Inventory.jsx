import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { itemsApi } from '../../api/items';
import { apiErrorMessage } from '../../api/client';
import ErrorBanner from '../../components/ErrorBanner';
import StatusBadge from '../../components/StatusBadge';
import CategoryIcon from '../../components/CategoryIcon';
import { useCategories } from '../../context/CategoriesContext';

const EMPTY_FORM = { name: '', category: '', description: '', rentalPrice: '', quantityTotal: '', rentalTerms: '' };

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { categories, getLabel, getIcon } = useCategories();

  const load = () => {
    itemsApi.list({ limit: 100 }).then((d) => setItems(d.items)).catch((err) => setError(apiErrorMessage(err)));
  };

  useEffect(load, []);

  // Once categories load, default the "add item" form to the first one
  // instead of leaving the select on an empty/invalid option.
  useEffect(() => {
    if (!editingId && !form.category && categories.length > 0) {
      setForm((f) => ({ ...f, category: categories[0].slug }));
    }
  }, [categories, editingId, form.category]);

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description || '',
      rentalPrice: item.rentalPrice,
      quantityTotal: item.quantityTotal,
      rentalTerms: item.rentalTerms || '',
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, category: categories[0]?.slug || '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = { ...form, rentalPrice: Number(form.rentalPrice), quantityTotal: Number(form.quantityTotal) };
    try {
      if (editingId) {
        await itemsApi.update(editingId, payload);
      } else {
        await itemsApi.create(payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    try {
      await itemsApi.remove(id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const toggleMaintenance = async (item) => {
    const status = item.status === 'available' ? 'under_maintenance' : 'available';
    await itemsApi.update(item.id, { status });
    load();
  };

  return (
    <div className="container fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Add, edit, or remove rental items.</p>
        </div>
        <Link to="/admin/categories" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
          Manage categories
        </Link>
      </div>
      <ErrorBanner message={error} />

      <div className="card" style={{ marginBottom: 24, borderTop: '3px solid var(--color-primary)' }}>
        <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit item' : 'Add new item'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 180px' }}>
            <label>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Category</label>
            <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.length === 0 && <option value="">No categories yet</option>}
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Price (PHP)</label>
            <input type="number" min={0} step="0.01" required style={{ width: 110 }} value={form.rentalPrice} onChange={(e) => setForm({ ...form, rentalPrice: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Quantity</label>
            <input type="number" min={0} required style={{ width: 90 }} value={form.quantityTotal} onChange={(e) => setForm({ ...form, quantityTotal: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 220px' }}>
            <label>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 220px' }}>
            <label>Rental terms</label>
            <input value={form.rentalTerms} onChange={(e) => setForm({ ...form, rentalTerms: e.target.value })} />
          </div>
          <button className="btn btn-primary" disabled={saving || categories.length === 0}>{editingId ? 'Save changes' : 'Add item'}</button>
          {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
        </form>
        {categories.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 10, marginBottom: 0 }}>
            No categories yet - <Link to="/admin/categories">add one</Link> before adding items.
          </p>
        )}
      </div>

      <div className="card table-scroll" style={{ padding: 0 }}>
        <table style={{ minWidth: 640 }}>
          <thead>
            <tr><th>Name</th><th>Category</th><th>Price</th><th>Qty</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CategoryIcon category={item.category} icon={getIcon(item.category)} size={30} />
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                  </div>
                </td>
                <td>{getLabel(item.category)}</td>
                <td>PHP {Number(item.rentalPrice).toLocaleString()}</td>
                <td>{item.quantityTotal}</td>
                <td><StatusBadge status={item.status} /></td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => startEdit(item)}>Edit</button>
                  <button className="btn btn-outline btn-sm" onClick={() => toggleMaintenance(item)}>
                    {item.status === 'available' ? 'Set maintenance' : 'Set available'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
