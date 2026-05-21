import { useState, useEffect } from 'react';

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '$0.00';
  const s = n.toFixed(3);
  return `$${s.endsWith('0') ? n.toFixed(2) : s}`;
}

function CustomBoxesPage() {
  const [data, setData] = useState({ boxConfigs: [], products: [], preordersEnabled: true });
  const [loading, setLoading] = useState(true);

  // Flyout state
  const [activeBox, setActiveBox] = useState(null); // { id, size, discountPct, name }
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [pickupName, setPickupName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  useEffect(() => {
    document.title = 'Bundles — Outta Town Donuts';
    fetch('/shop/api/bundles')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Lock body scroll when flyout is open
  useEffect(() => {
    document.body.style.overflow = flyoutOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [flyoutOpen]);

  // Close flyout on Escape key
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && flyoutOpen) closeFlyout();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [flyoutOpen]);

  function openFlyout(cfg) {
    setActiveBox(cfg);
    setQuantities({});
    setPickupName('');
    setError('');
    setFlyoutOpen(true);
  }

  function closeFlyout() {
    setFlyoutOpen(false);
    setActiveBox(null);
  }

  function setQty(refId, max, rawValue) {
    setQuantities((prev) => {
      let val = Math.max(0, Math.min(max, parseInt(rawValue, 10) || 0));
      const next = { ...prev, [refId]: val };

      // Enforce box size cap — reduce this item if over
      if (activeBox) {
        const total = Object.values(next).reduce((a, b) => a + b, 0);
        if (total > activeBox.size) {
          next[refId] = Math.max(0, val - (total - activeBox.size));
        }
      }
      return next;
    });
  }

  function adjustQty(refId, max, delta) {
    setQty(refId, max, (quantities[refId] || 0) + delta);
  }

  // Derived totals
  const simpleProducts = data.products.filter((p) => p.productType === 'simple');
  const totalSelected = Object.values(quantities).reduce((a, b) => a + b, 0);
  const remaining = activeBox ? activeBox.size - totalSelected : 0;
  const pct = activeBox ? Math.min(100, Math.round((totalSelected / activeBox.size) * 100)) : 0;

  const gross = simpleProducts.reduce((sum, p) => sum + (p.price || 0) * (quantities[p._id] || 0), 0);
  const discountAmt = activeBox ? Math.round(gross * (activeBox.discountPct / 100) * 100) / 100 : 0;
  const net = Math.max(0, Math.round((gross - discountAmt) * 100) / 100);

  const boxFull = activeBox && totalSelected === activeBox.size;

  function checkoutBtnText() {
    if (!activeBox) return 'Choose your items first';
    if (totalSelected === activeBox.size) return 'Checkout';
    if (totalSelected > activeBox.size) return `Too many items — remove ${totalSelected - activeBox.size}`;
    return `Choose your items (${remaining} left)`;
  }

  async function handleCheckout() {
    if (!activeBox || !boxFull) return;

    if (!pickupName.trim()) {
      setError('Please enter your name for pickup.');
      return;
    }

    const selections = simpleProducts.filter((p) => (quantities[p._id] || 0) > 0).map((p) => ({ refId: p._id, quantity: quantities[p._id] }));

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/shop/api/bundle-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          boxConfigId: activeBox.id,
          selections,
          pickupName: pickupName.trim(),
          customerEmail: customerEmail.trim() || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to create order');
      if (d.checkoutUrl) {
        window.location.href = d.checkoutUrl;
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
          <h1>Bundles</h1>
          <p className="otd-text-muted">Pick your flavors, fill your box, and we&rsquo;ll have it ready for you.</p>
          <hr className="otd-divider" />
        </div>

        {!data.preordersEnabled ? (
          <div className="otd-alert otd-alert-warning">Sorry &mdash; online ordering is currently turned off. Please visit the flea market to place your order.</div>
        ) : !data.boxConfigs.length ? (
          <div className="otd-text-center otd-py-5">
            <h3 className="otd-text-muted">No bundles available right now.</h3>
            <p className="otd-text-muted">Check back soon.</p>
          </div>
        ) : (
          <>
            {/* Box type cards */}
            <div id="box-step-1">
              <h2 className="otd-mb-3">Choose a box</h2>
              <div className="otd-products">
                {data.boxConfigs.map((cfg) => (
                  <div
                    key={cfg._id}
                    className="otd-product-card otd-box-option"
                    onClick={() =>
                      openFlyout({
                        id: cfg._id,
                        size: cfg.size,
                        discountPct: cfg.discountPct || 0,
                        name: cfg.name,
                      })
                    }
                  >
                    <div className="otd-product-name">{cfg.name}</div>
                    <div className="otd-text-muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>
                      {cfg.size} items
                    </div>
                    {cfg.discountPct > 0 && (
                      <div className="otd-badge otd-badge-available" style={{ marginTop: 6 }}>
                        {cfg.discountPct}% off
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Flyout panel — always mounted, visibility controlled by opacity + pointer-events */}
            <div
              id="box-flyout"
              aria-modal="true"
              role="dialog"
              aria-label="Build your box"
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1050,
                display: 'flex',
                opacity: flyoutOpen ? 1 : 0,
                pointerEvents: flyoutOpen ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
              }}
            >
              {/* Backdrop */}
              <div id="box-flyout-backdrop" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={closeFlyout} />

              {/* Panel */}
              <div
                className="box-flyout-panel"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: 'min(600px, 100vw)',
                  background: 'var(--otd-surface, #111)',
                  borderLeft: '1px solid var(--otd-border, #2a2a2a)',
                  boxShadow: '-6px 0 32px rgba(0,0,0,0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transform: flyoutOpen ? 'translateX(0)' : 'translateX(100%)',
                  transition: 'transform 0.25s ease',
                }}
              >
                {/* Header */}
                <div
                  className="box-flyout-header"
                  style={{
                    padding: '18px 24px',
                    borderBottom: '1px solid var(--otd-border, #2a2a2a)',
                    flexShrink: 0,
                  }}
                >
                  <div className="d-flex align-items-start justify-content-between">
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                      <h2 id="flyout-box-name" style={{ margin: 0, fontSize: '1.15rem' }}>
                        {activeBox ? `${activeBox.name} — ${activeBox.size} items` : ''}
                      </h2>
                      <div
                        className="box-progress-bar-wrap"
                        style={{
                          background: 'var(--otd-border, #333)',
                          borderRadius: 8,
                          height: 6,
                          marginTop: 6,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          id="flyout-progress-bar"
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: 'var(--otd-orange, #e97320)',
                            borderRadius: 8,
                            transition: 'width 0.25s',
                          }}
                        />
                      </div>
                      <span
                        id="flyout-count-label"
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--otd-text-muted, #888)',
                          marginTop: 4,
                          display: 'block',
                        }}
                      >
                        {activeBox && remaining > 0 ? `${remaining} more item${remaining !== 1 ? 's' : ''} to fill your box` : activeBox && totalSelected === activeBox.size ? 'Your box is full — ready to checkout!' : activeBox ? `Too many — remove ${totalSelected - activeBox.size}` : ''}
                      </span>
                    </div>
                    <button id="flyout-close-btn" className="flyout-close-btn" type="button" aria-label="Close" onClick={closeFlyout}>
                      &times;
                    </button>
                  </div>
                </div>

                {/* Scrollable product list */}
                <div className="box-flyout-body" style={{ flex: 1, overflowY: 'auto', padding: '0 24px 16px' }}>
                  {simpleProducts.length ? (
                    <table className="otd-table" style={{ marginTop: 16 }}>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th className="text-end">Price</th>
                          <th className="text-center">In Stock</th>
                          <th className="text-center" style={{ width: 130 }}>
                            Qty
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {simpleProducts.map((product) => (
                          <tr key={product._id}>
                            <td>{product.name}</td>
                            <td className="text-end">{fmtCurrency(product.price)}</td>
                            <td className="text-center">{product.available > 0 ? <span>{product.available}</span> : <span className="otd-text-muted">&mdash;</span>}</td>
                            <td className="text-center">
                              {product.available > 0 ? (
                                <div className="qty-stepper">
                                  <button className="qty-btn qty-dec" type="button" aria-label={`Decrease quantity for ${product.name}`} onClick={() => adjustQty(product._id, product.available, -1)} disabled={!quantities[product._id]}>
                                    &minus;
                                  </button>
                                  <input className="otd-input-qty box-qty-input" type="number" min="0" max={product.available} value={quantities[product._id] || 0} readOnly aria-label={`Quantity for ${product.name}`} />
                                  <button className="qty-btn qty-inc" type="button" aria-label={`Increase quantity for ${product.name}`} onClick={() => adjustQty(product._id, product.available, 1)} disabled={totalSelected >= (activeBox ? activeBox.size : 0)}>
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
                  ) : (
                    <div className="otd-text-center otd-py-5">
                      <h3 className="otd-text-muted">Nothing available right now.</h3>
                      <p className="otd-text-muted">Check back tomorrow morning.</p>
                    </div>
                  )}
                </div>

                {/* Footer: summary + checkout */}
                <div
                  className="box-flyout-footer"
                  style={{
                    padding: '16px 24px',
                    borderTop: '1px solid var(--otd-border, #2a2a2a)',
                    flexShrink: 0,
                  }}
                >
                  <div className="flyout-summary-row">
                    <span>Price before discount:</span>
                    <span id="box-gross">{fmtCurrency(gross)}</span>
                  </div>
                  <div className="flyout-summary-row" style={{ color: 'var(--otd-orange, #e97320)' }}>
                    <span id="box-discount-label">{activeBox ? `${activeBox.name} discount (${activeBox.discountPct}%):` : 'Discount:'}</span>
                    <span id="box-discount-amount">-{fmtCurrency(discountAmt)}</span>
                  </div>
                  <div className="flyout-summary-row flyout-summary-total">
                    <span>Total:</span>
                    <span id="box-total">{fmtCurrency(net)}</span>
                  </div>

                  <div className="otd-mt-3">
                    <label className="otd-label" htmlFor="box-pickup-name">
                      Your name for pickup
                    </label>
                    <input id="box-pickup-name" className="otd-input" type="text" name="pickupName" maxLength={100} placeholder="e.g. Jane Smith" autoComplete="name" value={pickupName} onChange={(e) => setPickupName(e.target.value)} />
                  </div>
                  <div className="otd-mt-3">
                    <label className="otd-label" htmlFor="box-customer-email">
                      Email for receipt{' '}
                      <span className="otd-text-muted" style={{ fontWeight: 'normal' }}>
                        (optional)
                      </span>
                    </label>
                    <input id="box-customer-email" className="otd-input" type="email" name="customerEmail" maxLength={254} placeholder="e.g. jane@example.com" autoComplete="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                  </div>

                  <button id="box-checkout-btn" className="otd-btn otd-btn-primary otd-mt-3" type="button" style={{ width: '100%' }} disabled={!boxFull || submitting} onClick={handleCheckout}>
                    {submitting ? 'Processing...' : checkoutBtnText()}
                  </button>

                  {error && (
                    <div id="box-order-error" className="otd-alert otd-alert-error otd-mt-2">
                      {error}
                    </div>
                  )}

                  {submitting && (
                    <div id="box-order-loading" className="otd-text-center otd-mt-3">
                      <div className="otd-spinner" />
                      <p className="otd-mt-1 otd-text-muted">Redirecting to payment...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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

export default CustomBoxesPage;
