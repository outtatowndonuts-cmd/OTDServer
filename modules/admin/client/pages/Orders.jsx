import { useState, useEffect } from 'react';

const fmt = (n) => {
  const s = n.toFixed(3);
  return '$' + (s.endsWith('0') ? n.toFixed(2) : s);
};

export default function Orders({ api }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', dateFrom: '', dateTo: '' });

  const fetchOrders = (params = {}) => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (params.type) qs.set('type', params.type);
    if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params.dateTo) qs.set('dateTo', params.dateTo);
    const url = `/admin/api/orders${qs.toString() ? `?${qs}` : ''}`;
    api(url)
      .then((res) => {
        if (!res.ok) throw new Error(res.error || 'Failed to load');
        setOrders(res.orders);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleFilter = () => fetchOrders(filters);

  return (
    <>
      <h2 className="section-title">Orders</h2>
      <div className="filter-bar">
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="sale">Sale</option>
          <option value="production">Production</option>
        </select>
        <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} placeholder="From" />
        <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} placeholder="To" />
        <button onClick={handleFilter}>Filter</button>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {loading ? (
        <div className="loading">Loading orders…</div>
      ) : orders.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>No orders found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Type</th>
              <th>Source</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Items</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td style={{ fontFamily: 'monospace' }}>{o._id.slice(-6).toUpperCase()}</td>
                <td>
                  <span className={`badge ${o.type === 'sale' ? 'badge-blue' : 'badge-gray'}`}>{o.type}</span>
                </td>
                <td>{o.source || '—'}</td>
                <td>
                  <span className={`badge ${o.status === 'completed' ? 'badge-green' : o.status === 'pending' ? 'badge-yellow' : 'badge-gray'}`}>{o.status}</span>
                </td>
                <td>
                  {o.paymentMethod !== 'none' ? (
                    <span className={`badge ${o.paymentStatus === 'paid' ? 'badge-green' : 'badge-yellow'}`}>
                      {o.paymentMethod} / {o.paymentStatus}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{o.total != null ? fmt(o.total) : '—'}</td>
                <td>{o.items ? o.items.length : 0}</td>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
