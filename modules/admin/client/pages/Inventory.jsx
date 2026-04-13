import { useState, useEffect } from 'react';

export default function Inventory({ api }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/admin/api/inventory')
      .then((res) => {
        if (!res.ok) throw new Error(res.error || 'Failed to load');
        setItems(res.items);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (qty) => {
    if (qty <= 0) return <span className="badge badge-red">Out of stock</span>;
    if (qty <= 5) return <span className="badge badge-yellow">Low</span>;
    return <span className="badge badge-green">OK</span>;
  };

  return (
    <>
      <h2 className="section-title">Inventory</h2>
      {error && <div className="error-msg">{error}</div>}
      {loading ? (
        <div className="loading">Loading inventory…</div>
      ) : items.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>No inventory items tracked yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Kind</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.kind}</td>
                <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                <td style={{ color: '#9ca3af' }}>{item.unit || '—'}</td>
                <td>{statusBadge(item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
