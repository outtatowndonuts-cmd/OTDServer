import { useState, useEffect, useRef } from 'react';

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '$0.00';
  const s = n.toFixed(3);
  return `$${s.endsWith('0') ? n.toFixed(2) : s}`;
}

function ConfirmationPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const refreshTimer = useRef(null);

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId');
  const sessionId = params.get('session_id');

  useEffect(() => {
    document.title = 'Order Confirmation — Outta Town Donuts';

    if (!orderId) {
      window.location.href = '/shop';
      return;
    }

    const url = `/shop/api/order-status?orderId=${encodeURIComponent(orderId)}${sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : ''}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Order not found');
        return r.json();
      })
      .then((data) => {
        setOrder(data.order);
        setLoading(false);
        // If still pending, auto-refresh after 5 seconds (mirrors original meta refresh)
        if (data.order && data.order.status === 'pending') {
          refreshTimer.current = setTimeout(() => window.location.reload(), 5000);
        }
      })
      .catch((err) => {
        setFetchError(err.message);
        setLoading(false);
      });

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="otd-section">
        <div className="container otd-text-center otd-py-5">
          <div className="otd-spinner" />
        </div>
      </div>
    );
  }

  if (fetchError || !order) {
    return (
      <div className="otd-section">
        <div className="container">
          <div className="otd-confirmation">
            <h1>Order Not Found</h1>
            <p className="otd-text-muted">We couldn&rsquo;t find this order.</p>
            <div className="otd-mt-4">
              <a className="otd-btn otd-btn-outline" href="/shop">
                Back to Storefront
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderHeading() {
    if (order.status === 'completed' && order.paymentStatus === 'paid') {
      return (
        <>
          <h1 className="otd-text-success">&#10003; Order Confirmed</h1>
          {order.pickupName ? <p className="otd-text-muted">Thank you, {order.pickupName}. Your order has been placed.</p> : <p className="otd-text-muted">Thank you. Your order has been placed.</p>}
          {order.confirmationNumber && (
            <div
              style={{
                background: 'var(--otd-surface, #f8f8f8)',
                border: '1px solid var(--otd-border)',
                borderRadius: '0.5rem',
                padding: '1rem 1.5rem',
                margin: '1rem 0',
                textAlign: 'center',
              }}
            >
              <div className="otd-text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Confirmation Number
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>{order.confirmationNumber}</div>
              <div className="otd-text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Save this number to check your order status at <a href="/shop/order-lookup">/shop/order-lookup</a>
              </div>
            </div>
          )}
        </>
      );
    }
    if (order.status === 'pending') {
      return (
        <>
          <h1 className="otd-text-warning">&#8987; Processing Payment</h1>
          <p className="otd-text-muted">Your payment is being verified. This page will update shortly.</p>
        </>
      );
    }
    if (order.status === 'cancelled') {
      return (
        <>
          <h1 className="otd-text-danger">Order Cancelled</h1>
          <p className="otd-text-muted">This order was cancelled.</p>
        </>
      );
    }
    return <h1>Order Status: {order.status}</h1>;
  }

  return (
    <div className="otd-section">
      <div className="container">
        <div className="otd-confirmation">
          {renderHeading()}

          <div className="otd-confirmation-card">
            <h3 className="otd-mb-2">Order Details</h3>
            {order.pickupName && (
              <p className="otd-mb-2">
                <strong>Pickup name:&nbsp;</strong>
                <span>{order.pickupName}</span>
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
                    <td className="text-end">{fmtCurrency(item.priceSnapshot * item.quantity)}</td>
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
                      Total
                    </td>
                    <td className="text-end">{fmtCurrency(order.total)}</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          <div className="otd-mt-4">
            <a className="otd-btn otd-btn-outline" href="/shop">
              Back to Storefront
            </a>
            <a className="otd-btn otd-btn-outline otd-ml-2" href="/shop/order-lookup" style={{ marginLeft: '0.75rem' }}>
              Check Order Status
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationPage;
