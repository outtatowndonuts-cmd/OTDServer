import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const fmt = (n) => '$' + (Number(n) || 0).toFixed(2);

function CustomerDisplay() {
  const [state, setState] = useState({
    status: 'idle', // idle | cart | awaiting | paid
    cart: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    qrDataUrl: null,
  });

  // Default to 'pos-main' — matches the fixed ID used by the clerk screen.
  // Bookmark http://<your-server>/pos/display on the customer tablet.
  const displayId = new URLSearchParams(window.location.search).get('id') || 'pos-main';

  useEffect(() => {
    let es;
    let retryTimer;

    function connect() {
      es = new EventSource(`/pos/api/display/${displayId}/stream`);

      es.onmessage = (e) => {
        try {
          setState(JSON.parse(e.data));
        } catch {
          /* ignore malformed frames */
        }
      };

      es.onerror = () => {
        es.close();
        retryTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (es) es.close();
      clearTimeout(retryTimer);
    };
  }, [displayId]);

  /* ── Idle: welcome screen ── */
  if (state.status === 'idle') {
    return (
      <div className="display-idle">
        <div className="store-logo">🍩</div>
        <h1>Outta Town Donuts</h1>
        <p>Welcome!</p>
      </div>
    );
  }

  /* ── Awaiting: QR code for Stripe Checkout ── */
  if (state.status === 'awaiting') {
    return (
      <div className="display-awaiting">
        <h1>Scan to Pay</h1>
        <p className="total-big">{fmt(state.total)}</p>
        {state.qrDataUrl ? <img className="qr-code" src={state.qrDataUrl} alt="QR code — scan with your phone to pay" /> : <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '28px' }}>Loading…</p>}
        <p className="hint">
          <strong>Point your camera</strong> at the code to pay on your device
        </p>
      </div>
    );
  }

  /* ── Paid: thank-you receipt ── */
  if (state.status === 'paid') {
    return (
      <div className="display-paid">
        <div className="big-check">✅</div>
        <h1>Thank You!</h1>
        <p className="total-big">{fmt(state.total)}</p>
        {state.cart && state.cart.length > 0 && (
          <div className="receipt-items">
            {state.cart.map((item) => (
              <div key={item.refId} className="receipt-item">
                <span className="item-qty">{item.quantity}×</span>
                <span className="item-name">{item.nameSnapshot}</span>
                <span className="item-price">{fmt(item.priceSnapshot * item.quantity)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Cart: live order summary ── */
  return (
    <div className="display-cart">
      <h2>Your Order</h2>
      <div className="order-items">
        {state.cart.map((item) => (
          <div key={item.refId} className="order-item">
            <span className="item-qty">{item.quantity}×</span>
            <span className="item-name">{item.nameSnapshot}</span>
            <span className="item-price">{fmt(item.priceSnapshot * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="order-totals">
        <div className="total-row">
          <span>Subtotal</span>
          <span>{fmt(state.subtotal)}</span>
        </div>
        <div className="total-row">
          <span>Tax</span>
          <span>{fmt(state.tax)}</span>
        </div>
        <div className="total-row grand">
          <span>Total</span>
          <span>{fmt(state.total)}</span>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('customer-root')).render(<CustomerDisplay />);
