import { useState, useEffect } from 'react';

const card = {
  background: '#1e2130',
  border: '1px solid #2a2d3a',
  borderRadius: 12,
  padding: '20px 24px',
  marginBottom: 20,
};

const inputStyle = {
  background: '#0f1117',
  border: '1px solid #2a2d3a',
  borderRadius: 8,
  color: '#e2e8f0',
  padding: '8px 12px',
  width: '100%',
  fontSize: '0.9rem',
};

const btnPrimary = {
  background: '#1d4ed8',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 18px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600,
};

const btnDanger = {
  background: 'transparent',
  color: '#f87171',
  border: '1px solid #f87171',
  borderRadius: 8,
  padding: '6px 14px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

const btnSecondary = {
  background: 'transparent',
  color: '#9ca3af',
  border: '1px solid #374151',
  borderRadius: 8,
  padding: '6px 14px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

const EMPTY_FORM = { name: '', size: '', discountPct: '', isActive: true, packagingSupply: '' };

export default function CustomBoxes({ api }) {
  const [configs, setConfigs] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state — null means hidden, {} means "new", {_id,...} means editing
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadConfigs();
    loadSupplies();
  }, []);

  async function loadConfigs() {
    setLoading(true);
    setError('');
    try {
      const res = await api('/admin/api/custom-boxes');
      if (!res.ok) throw new Error(res.error || 'Failed to load');
      setConfigs(res.configs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSupplies() {
    try {
      const res = await api('/admin/api/supplies');
      if (res.ok) setSupplies(res.supplies);
    } catch {
      // non-fatal: supply dropdown will just be empty
    }
  }

  function flash(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }

  function openNew() {
    setFormData(EMPTY_FORM);
    setFormError('');
  }

  function openEdit(config) {
    setFormData({
      ...config,
      size: String(config.size),
      discountPct: String(config.discountPct),
      packagingSupply: config.packagingSupply ? config.packagingSupply._id || config.packagingSupply : '',
    });
    setFormError('');
  }

  function closeForm() {
    setFormData(null);
    setFormError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError('');
    const { _id, name, size, discountPct, isActive } = formData;

    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    const sizeNum = parseInt(size, 10);
    if (!sizeNum || sizeNum < 1) {
      setFormError('Size must be a positive whole number.');
      return;
    }
    const discountNum = parseFloat(discountPct) || 0;
    if (discountNum < 0 || discountNum > 100) {
      setFormError('Discount must be between 0 and 100.');
      return;
    }

    setSaving(true);
    try {
      const url = _id ? `/admin/api/custom-boxes/${_id}` : '/admin/api/custom-boxes';
      const res = await api(url, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          size: sizeNum,
          discountPct: discountNum,
          isActive,
          packagingSupply: formData.packagingSupply || null,
        }),
      });
      if (!res.ok) throw new Error(res.error || 'Save failed');
      flash(_id ? 'Box config updated.' : 'Box config created.');
      closeForm();
      await loadConfigs();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await api(`/admin/api/custom-boxes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(res.error || 'Delete failed');
      flash('Box config deleted.');
      await loadConfigs();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleToggleActive(config) {
    try {
      const res = await api(`/admin/api/custom-boxes/${config._id}`, {
        method: 'POST',
        body: JSON.stringify({ isActive: !config.isActive }),
      });
      if (!res.ok) throw new Error(res.error || 'Update failed');
      await loadConfigs();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Custom Box Builder
        </h2>
        {formData === null && (
          <button style={btnPrimary} onClick={openNew}>
            + New Box
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div style={{ color: '#6ee7b7', background: '#064e3b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>{success}</div>}

      {/* ── Create / Edit Form ─────────────────────────────────────────────── */}
      {formData !== null && (
        <div style={card}>
          <h3 style={{ fontSize: '0.85rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>{formData._id ? 'Edit Box Config' : 'New Box Config'}</h3>
          {formError && (
            <div className="error-msg" style={{ marginBottom: 12 }}>
              {formError}
            </div>
          )}
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: 6 }}>Box Name</label>
                <input style={inputStyle} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder='e.g. "Half Dozen Box"' maxLength={100} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: 6 }}>Bundle Size (# of items)</label>
                <input style={inputStyle} type="number" min={1} step={1} value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} placeholder="6" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: 6 }}>Discount %</label>
                <input style={inputStyle} type="number" min={0} max={100} step={0.1} value={formData.discountPct} onChange={(e) => setFormData({ ...formData, discountPct: e.target.value })} placeholder="10" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                Active (visible in the shop)
              </label>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: 6 }}>Packaging Supply</label>
              <select style={inputStyle} value={formData.packagingSupply || ''} onChange={(e) => setFormData({ ...formData, packagingSupply: e.target.value })}>
                <option value="">— none —</option>
                {supplies.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                    {s.costPerUnit != null ? ` — $${s.costPerUnit.toFixed(2)}/${s.unit || 'each'}` : ''}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>Added as a packaging fee line item on every box order, after the discount.</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : formData._id ? 'Save Changes' : 'Create Box'}
              </button>
              <button type="button" style={btnSecondary} onClick={closeForm} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Config List ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="loading">Loading…</div>
      ) : configs.length === 0 ? (
        <div style={{ color: '#9ca3af', padding: '40px 0', textAlign: 'center' }}>No box configs yet. Create one to enable the custom box builder on the shop.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2d3a', color: '#9ca3af', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>Bundle Size</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>Discount</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>Packaging</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((c) => (
              <tr key={c._id} style={{ borderBottom: '1px solid #1e2130' }}>
                <td style={{ padding: '12px', fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{c.size} items</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{c.discountPct}%</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                  {c.packagingSupply ? (
                    <span title={c.packagingSupply.name}>
                      {c.packagingSupply.name}
                      {c.packagingSupply.costPerUnit != null && <span style={{ color: '#6ee7b7', marginLeft: 6 }}>${c.packagingSupply.costPerUnit.toFixed(2)}</span>}
                    </span>
                  ) : (
                    <span style={{ color: '#4b5563' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span
                    onClick={() => handleToggleActive(c)}
                    title="Click to toggle"
                    style={{
                      cursor: 'pointer',
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: c.isActive ? '#064e3b' : '#1f2937',
                      color: c.isActive ? '#6ee7b7' : '#9ca3af',
                    }}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button style={btnSecondary} onClick={() => openEdit(c)}>
                    Edit
                  </button>
                  <button style={btnDanger} onClick={() => handleDelete(c._id, c.name)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
