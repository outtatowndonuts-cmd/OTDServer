import { useState, useEffect } from 'react';

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '$0.00';
  const s = n.toFixed(3);
  return `$${s.endsWith('0') ? n.toFixed(2) : s}`;
}

function statusLabel(status) {
  switch (status) {
    case 'completed':
      return 'Confirmed — Ready for Pickup';
    case 'pending':
      return 'Processing';
    case 'filled':
      return 'Filled';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status || 'Unknown';
  }
}

function statusClass(status) {
  if (status === 'completed' || status === 'filled' || status === 'delivered') return 'otd-text-success';
  if (status === 'cancelled') return 'otd-text-danger';
  return 'otd-text-warning';
}

function OrderLookupPage() {
  const [input, setInput] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function doLookup(confirmationNumber) {
    const trimmed = confirmationNumber.toUpperCase().trim();
    if (!trimmed) return;
    setError('');
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch(`/shop/api/order-lookup?confirmationNumber=${encodeURIComponent(trimmed)}`);
      if (res.status === 404) {
        setError('No order found with that confirmation number.');
        return;
      }
      if (!res.ok) throw new Error('Lookup failed. Please try again.');
      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Auto-lookup if confirmation number is in the URL (e.g. from email link)
  useEffect(() => {
    document.title = 'Order Status — Outta Town Donuts';
    const params = new URLSearchParams(window.location.search);
    const cn = params.get('confirmationNumber');
    if (cn) {
      const upper = cn.toUpperCase().trim();
      setInput(upper);
      doLookup(upper);
    }
  }, []);

  async function handleLookup(e) {
    e.preventDefault();
    doLookup(input);
  }

  return (
    <div className="otd-section">
      <div className="container">
        <div className="otd-confirmation">
          <h1>Check Order Status</h1>
          <p className="otd-text-muted">Enter the confirmation number from your receipt or confirmation page.</p>

          <form onSubmit={handleLookup} className="otd-mt-3">
            <div className="otd-mb-3">
              <label className="otd-label" htmlFor="conf-number">
                Confirmation Number
              </label>
              <input id="conf-number" className="otd-input" type="text" placeholder="OTD-XXXXXX" value={input} maxLength={12} autoComplete="off" spellCheck={false} onChange={(e) => setInput(e.target.value.toUpperCase())} />
            </div>
            <button className="otd-btn otd-btn-primary" type="submit" disabled={loading}>
              {loading ? 'Looking up…' : 'Look Up Order'}
            </button>
          </form>

          {error && <div className="otd-alert otd-alert-error otd-mt-3">{error}</div>}

          {order && (
            <div className="otd-confirmation-card otd-mt-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <div>
                  <div className="otd-text-muted" style={{ fontSize: '0.85rem' }}>
                    Confirmation Number
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '0.04em' }}>{order.confirmationNumber}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="otd-text-muted" style={{ fontSize: '0.85rem' }}>
                    Status
                  </div>
                  <div className={`${statusClass(order.status)}`} style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    {statusLabel(order.status)}
                  </div>
                </div>
              </div>

              {order.pickupName && (
                <p className="otd-mb-2">
                  <strong>Pickup name:&nbsp;</strong>
                  {order.pickupName}
                </p>
              )}

              <table className="otd-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, i) => (
                    <tr key={i}>
                      <td>{item.nameSnapshot}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end">{fmtCurrency((item.priceSnapshot || 0) * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {order.subtotal != null && (
                    <tr>
                      <td className="text-end" colSpan={2}>
                        Subtotal
                      </td>
                      <td className="text-end">{fmtCurrency(order.subtotal)}</td>
                    </tr>
                  )}
                  {order.tax != null && order.tax > 0 && (
                    <tr>
                      <td className="text-end" colSpan={2}>
                        Tax
                      </td>
                      <td className="text-end">{fmtCurrency(order.tax)}</td>
                    </tr>
                  )}
                  {order.total != null && (
                    <tr>
                      <td className="text-end" colSpan={2}>
                        <strong>Total</strong>
                      </td>
                      <td className="text-end">
                        <strong>{fmtCurrency(order.total)}</strong>
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          )}

          <div className="otd-mt-4">
            <a className="otd-text-muted" href="/shop">
              &larr; Back to Storefront
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderLookupPage;
