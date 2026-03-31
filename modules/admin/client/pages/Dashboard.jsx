import { useState, useEffect } from 'react';

export default function Dashboard({ api }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/api/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error(res.error || 'Failed to load');
        setData(res);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-msg">{error}</div>;
  if (!data) return <div className="loading">Loading dashboard…</div>;

  return (
    <>
      <h2 className="section-title">Dashboard</h2>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Sales Today</div>
          <div className="value">${data.totalSalesToday.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Orders Today</div>
          <div className="value">{data.orderCountToday}</div>
        </div>
        <div className="stat-card">
          <div className="label">Low Stock Items</div>
          <div className="value">{data.lowStock.length}</div>
        </div>
      </div>

      <h3 className="section-title">Recent Orders</h3>
      {data.recentOrders.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>No orders yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Type</th>
              <th>Status</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.recentOrders.map((o) => (
              <tr key={o._id}>
                <td>{o._id.slice(-6).toUpperCase()}</td>
                <td>
                  <span className={`badge ${o.type === 'sale' ? 'badge-blue' : 'badge-gray'}`}>{o.type}</span>
                </td>
                <td>
                  <span className={`badge ${o.status === 'completed' ? 'badge-green' : 'badge-yellow'}`}>{o.status}</span>
                </td>
                <td>{o.total != null ? `$${o.total.toFixed(2)}` : '—'}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data.lowStock.length > 0 && (
        <>
          <h3 className="section-title" style={{ marginTop: 28 }}>
            Low Stock
          </h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Kind</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {data.lowStock.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.kind}</td>
                  <td>
                    <span className={`badge ${item.quantity <= 0 ? 'badge-red' : 'badge-yellow'}`}>{item.quantity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
