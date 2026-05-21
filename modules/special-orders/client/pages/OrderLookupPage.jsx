import { useState } from 'react';
import { fmtCurrency, STATUS_LABELS, FULFILLMENT_LABELS } from '../utils.js';

export default function OrderLookupPage() {
  const params = new URLSearchParams(window.location.search);
  const [confirmationNumber, setConfirmationNumber] = useState(params.get('confirmationNumber') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLookup(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch(`/special-orders/api/order-lookup?confirmationNumber=${encodeURIComponent(confirmationNumber.trim())}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setOrder(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="so-page so-lookup-page">
      <h1 className="so-page-title">Order Lookup</h1>
      <p>Enter your confirmation number to check your order status.</p>

      <form className="so-lookup-form" onSubmit={handleLookup}>
        <div className="so-lookup-row">
          <input type="text" className="form-control" value={confirmationNumber} onChange={(e) => setConfirmationNumber(e.target.value)} placeholder="OTD-SO-XXXXXX" maxLength={20} />
          <button type="submit" className="btn btn-primary" disabled={loading || !confirmationNumber.trim()}>
            {loading ? 'Searching…' : 'Look Up'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {order && (
        <div className="so-lookup-result">
          <div className="so-status-badge so-status-{order.status}">{STATUS_LABELS[order.status] || order.status}</div>

          <table className="so-review-table mt-3">
            <tbody>
              <tr>
                <td>Confirmation #</td>
                <td>
                  <strong>{order.confirmationNumber}</strong>
                </td>
              </tr>
              <tr>
                <td>Fulfillment</td>
                <td>{FULFILLMENT_LABELS[order.fulfillmentType] || order.fulfillmentType}</td>
              </tr>
              <tr>
                <td>Scheduled Date</td>
                <td>
                  {new Date(order.scheduledDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </td>
              </tr>
              <tr>
                <td>Name</td>
                <td>{order.customerName}</td>
              </tr>
              <tr>
                <td>Total</td>
                <td>{fmtCurrency(order.total)}</td>
              </tr>
              <tr>
                <td>Payment</td>
                <td className={order.paymentStatus === 'paid' ? 'text-success' : 'text-warning'}>{order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</td>
              </tr>
            </tbody>
          </table>

          <div className="so-lookup-variations mt-3">
            <h3>Items</h3>
            {order.variations.map((v, i) => {
              const base = v.baseRecipe?.name;
              const frosting = v.frosting?.name;
              const toppings = (v.toppings || []).map((t) => t.name).join(', ');
              return (
                <div key={i} className="so-lookup-variation-row">
                  <span className="so-lookup-qty">{v.quantity}×</span>
                  <span>
                    {base}
                    {frosting && ` + ${frosting}`}
                    {toppings && ` + ${toppings}`}
                  </span>
                  <span className="ms-auto">{fmtCurrency(v.lineTotal)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
