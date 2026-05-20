import { useState, useEffect } from 'react';

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '$0.00';
  const s = n.toFixed(3);
  return `$${s.endsWith('0') ? n.toFixed(2) : s}`;
}

function PickupPage() {
  const [products, setProducts] = useState([]);
  const [preordersEnabled, setPreordersEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [pickupName, setPickupName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const cancelled = params.get('cancelled') === 'true';

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  useEffect(() => {
    document.title = 'Pickup Orders — Outta Town Donuts';
    fetch('/shop/api/pickup')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setPreordersEnabled(data.preordersEnabled !== false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function adjustQty(id, max, delta) {
    setQuantities((prev) => {
      const next = Math.max(0, Math.min(max, (prev[id] || 0) + delta));
      return { ...prev, [id]: next };
    });
  }

  const subtotal = products.reduce((sum, p) => sum + (p.price || 0) * (quantities[p._id] || 0), 0);
  const hasItems = subtotal > 0;

  async function handleCheckout() {
    const items = products.filter((p) => (quantities[p._id] || 0) > 0).map((p) => ({ refId: p._id, quantity: quantities[p._id] }));

    if (items.length === 0) return;

    if (!pickupName.trim()) {
      setError('Please enter your name for pickup.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/shop/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ items, pickupName: pickupName.trim(), customerEmail: customerEmail.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="otd-section">
        <div className="container otd-text-center otd-py-5">
          <div className="otd-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="otd-section">
      <div className="container">
        <div className="otd-section-header">
          <h1>Pickup Orders</h1>
          <p className="otd-text-muted">Pick what you want. Quantities are real &mdash; when it&rsquo;s gone, it&rsquo;s gone.</p>
          <hr className="otd-divider" />
        </div>

        {!preordersEnabled ? (
          <div className="otd-alert otd-alert-warning">Sorry &mdash; preorders are currently turned off. Please visit the flea market to make your order with cash.</div>
        ) : (
          <>
            {cancelled && <div className="otd-alert otd-alert-warning">Your payment was cancelled. Your order was not placed. You can try again below.</div>}

            {products.length ? (
              <div id="order-form">
                <table className="otd-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-end">Price</th>
                      <th className="text-center">Available</th>
                      <th className="text-center" style={{ width: 140 }}>
                        Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td className="text-end">{fmtCurrency(product.price)}</td>
                        <td className="text-center">{product.available > 0 ? <span>{product.available}</span> : <span className="otd-text-muted">&mdash;</span>}</td>
                        <td className="text-center">
                          {product.available > 0 ? (
                            <div className="qty-stepper">
                              <button className="qty-btn qty-dec" type="button" aria-label={`Decrease quantity for ${product.name}`} onClick={() => adjustQty(product._id, product.available, -1)}>
                                &minus;
                              </button>
                              <input className="otd-input-qty qty-input" type="number" min="0" max={product.available} value={quantities[product._id] || 0} readOnly aria-label={`Quantity for ${product.name}`} />
                              <button className="qty-btn qty-inc" type="button" aria-label={`Increase quantity for ${product.name}`} onClick={() => adjustQty(product._id, product.available, 1)}>
                                +
                              </button>
                            </div>
                          ) : (
                            <span className="otd-text-muted">Sold out</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="otd-mt-3" style={{ borderTop: '1px solid var(--otd-border)', paddingTop: '1rem' }}>
                  <div className="otd-mb-3">
                    <label className="otd-label" htmlFor="pickup-name">
                      Your name for pickup
                    </label>
                    <input id="pickup-name" className="otd-input" type="text" name="pickupName" maxLength={100} placeholder="e.g. Jane Smith" autoComplete="name" value={pickupName} onChange={(e) => setPickupName(e.target.value)} />
                  </div>
                  <div className="otd-mb-3">
                    <label className="otd-label" htmlFor="customer-email">
                      Email for receipt{' '}
                      <span className="otd-text-muted" style={{ fontWeight: 'normal' }}>
                        (optional)
                      </span>
                    </label>
                    <input id="customer-email" className="otd-input" type="email" name="customerEmail" maxLength={254} placeholder="e.g. jane@example.com" autoComplete="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span style={{ fontWeight: 'bold' }}>Subtotal:&nbsp;</span>
                      <span id="order-subtotal">{fmtCurrency(subtotal)}</span>
                    </div>
                    <button id="checkout-btn" className="otd-btn otd-btn-primary" type="button" disabled={!hasItems || submitting} onClick={handleCheckout}>
                      Checkout
                    </button>
                  </div>
                </div>

                {error && <div className="otd-alert otd-alert-error otd-mt-2">{error}</div>}

                {submitting && (
                  <div className="otd-text-center otd-mt-3">
                    <div className="otd-spinner" />
                    <p className="otd-mt-1 otd-text-muted">Redirecting to payment...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="otd-text-center otd-py-5">
                <h3 className="otd-text-muted">Nothing available right now.</h3>
                <p className="otd-text-muted">Check back tomorrow morning.</p>
              </div>
            )}
          </>
        )}

        <div className="otd-mt-4">
          <a className="otd-text-muted" href="/shop">
            &larr; Back to storefront
          </a>
        </div>
      </div>
    </div>
  );
}

export default PickupPage;
