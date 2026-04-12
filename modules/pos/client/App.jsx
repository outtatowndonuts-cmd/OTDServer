import { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import ProductGrid from './components/ProductGrid.jsx';
import Cart from './components/Cart.jsx';
import CashModal from './components/CashModal.jsx';
import ReceiptModal from './components/ReceiptModal.jsx';
import OrderQueue from './components/OrderQueue.jsx';

/* ─── Helpers ──────────────────────────────────────────────── */
async function api(path, opts = {}) {
  const { headers: extraHeaders, ...rest } = opts;
  const res = await fetch(`/pos${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
  return res.json();
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ─── App ──────────────────────────────────────────────────── */
function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [taxRate, setTaxRate] = useState(0);
  const [csrfToken, setCsrfToken] = useState('');
  const [modal, setModal] = useState(null); // null | 'cash' | 'awaiting' | 'receipt'
  const [lastOrder, setLastOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [awaitingOrder, setAwaitingOrder] = useState(null); // { orderId, total }
  const [cardError, setCardError] = useState('');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [prevPendingCount, setPrevPendingCount] = useState(0);
  const clock = useClock();
  const pollRef = useRef(null);

  // Single fixed display ID — one POS instance, one counter display at /pos/display
  const displayId = 'pos-main';

  /* ── Boot: fetch catalog, settings; read CSRF from meta ── */
  useEffect(() => {
    const metaCsrf = document.querySelector('meta[name="csrf-token"]');
    if (metaCsrf) setCsrfToken(metaCsrf.content);

    Promise.all([api('/api/catalog'), api('/api/settings')]).then(([catRes, setRes]) => {
      if (catRes.ok) setProducts(catRes.products);
      if (setRes.ok) setTaxRate(setRes.settings.taxRate || 0);
      setLoading(false);
    });
  }, []);

  /* ── Poll pending queue every 15 s ── */
  const fetchQueue = useCallback(async () => {
    try {
      const res = await api('/api/orders/pending');
      if (res.ok) {
        setPendingOrders((prev) => {
          setPrevPendingCount(prev.length);
          return res.orders;
        });
      }
    } catch {
      /* ignore transient errors */
    }
  }, []);

  useEffect(() => {
    fetchQueue(); // initial fetch on mount
    const id = setInterval(fetchQueue, 15000);
    return () => clearInterval(id);
  }, [fetchQueue]);

  /* ── Sync cart to customer display (debounced 400 ms) ── */
  useEffect(() => {
    if (!csrfToken) return;
    const timer = setTimeout(() => {
      api(`/api/display/${displayId}/cart`, {
        method: 'POST',
        headers: { 'x-csrf-token': csrfToken },
        body: JSON.stringify({ cart, subtotal, tax, total }),
      }).catch(() => {}); // silent — display sync is best-effort
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, csrfToken, displayId]); // subtotal/tax/total derived, but captured at call time via closure

  /* ── Cart helpers ── */
  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.refId === product._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          kind: 'product',
          refId: product._id,
          nameSnapshot: product.name,
          priceSnapshot: product.price || 0,
          quantity: 1,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((refId, delta) => {
    setCart((prev) => {
      return prev.map((i) => (i.refId === refId ? { ...i, quantity: i.quantity + delta } : i)).filter((i) => i.quantity > 0);
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  /* ── Totals ── */
  const subtotal = cart.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0);
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  /* ── Submit order ── */
  const submitOrder = useCallback(
    async (paymentMethod) => {
      const body = {
        items: cart.map(({ kind, refId, nameSnapshot, quantity, priceSnapshot }) => ({
          kind,
          refId,
          nameSnapshot,
          quantity,
          priceSnapshot,
        })),
        subtotal,
        tax,
        total,
        paymentMethod,
      };
      const res = await api('/api/orders', {
        method: 'POST',
        headers: { 'x-csrf-token': csrfToken },
        body: JSON.stringify(body),
      });
      return res;
    },
    [cart, subtotal, tax, total, csrfToken],
  );

  const completeOrder = useCallback(
    async (orderId) => {
      return api(`/api/orders/${orderId}/complete`, {
        method: 'POST',
        headers: { 'x-csrf-token': csrfToken },
      });
    },
    [csrfToken],
  );

  /* ── Cash flow ── */
  const handleCashConfirm = useCallback(
    async (cashReceived) => {
      const res = await submitOrder('cash');
      if (!res.ok) return { error: res.error };
      const comp = await completeOrder(res.order._id);
      if (!comp.ok) return { error: comp.error };
      setLastOrder({ ...comp.order, paymentMethod: 'cash', cashReceived, change: cashReceived - total });
      setCart([]);
      setModal('receipt');
      return { ok: true };
    },
    [submitOrder, completeOrder, total],
  );

  /* ── Price override ── */
  const overridePrice = useCallback((refId, newPrice) => {
    setCart((prev) => prev.map((i) => (i.refId === refId ? { ...i, priceSnapshot: Math.max(0, newPrice) } : i)));
  }, []);

  /* ── Donate flow ── */
  const handleDonate = useCallback(async () => {
    const res = await submitOrder('donation');
    if (!res.ok) return;
    const comp = await completeOrder(res.order._id);
    if (!comp.ok) return;
    setLastOrder({ ...comp.order, paymentMethod: 'donation' });
    setCart([]);
    setModal('receipt');
  }, [submitOrder, completeOrder]);

  /* ── Card flow — Stripe Checkout Session ── */
  const handleCardPayment = useCallback(async () => {
    setCardError('');
    const res = await api('/api/stripe/checkout-session', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify({
        items: cart.map(({ kind, refId, nameSnapshot, quantity, priceSnapshot }) => ({
          kind,
          refId,
          nameSnapshot,
          quantity,
          priceSnapshot,
        })),
        subtotal,
        tax,
        total,
        displayId,
      }),
    });

    if (!res.ok) {
      setCardError(res.error || 'Failed to start card payment');
      return;
    }

    setAwaitingOrder({ orderId: res.orderId, total });
    setModal('awaiting');

    // Poll for payment completion every 2 seconds (max 10 minutes)
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 2000;
      if (elapsed >= 600000) {
        clearInterval(pollRef.current);
        return;
      }
      try {
        const status = await api(`/api/orders/${res.orderId}/status`);
        if (status.paymentStatus === 'paid') {
          clearInterval(pollRef.current);
          setLastOrder({ ...status, paymentMethod: 'card' });
          setAwaitingOrder(null);
          setCart([]);
          setModal('receipt');
        }
      } catch {
        /* ignore transient errors */
      }
    }, 2000);
  }, [cart, subtotal, tax, total, csrfToken, displayId]);

  /* ── Cancel a pending card checkout ── */
  const cancelCardPayment = useCallback(async () => {
    clearInterval(pollRef.current);

    if (awaitingOrder?.orderId) {
      try {
        await api(`/api/orders/${awaitingOrder.orderId}/cancel`, {
          method: 'POST',
          headers: { 'x-csrf-token': csrfToken },
          body: JSON.stringify({ reason: 'Clerk cancelled' }),
        });
      } catch {
        /* best-effort */
      }
    }

    // Return display to idle — order is cancelled, nothing to show
    api(`/api/display/${displayId}/cart`, {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify({ cart: [], subtotal: 0, tax: 0, total: 0, status: 'idle' }),
    }).catch(() => {});

    setCart([]); // clear the local cart too — the order was abandoned
    setAwaitingOrder(null);
    setModal(null);
  }, [awaitingOrder, csrfToken, displayId, cart, subtotal, tax, total]);

  /* ── Cleanup poll on unmount ── */
  useEffect(() => () => clearInterval(pollRef.current), []);

  /* ── New Sale — reset display to idle then clear modal ── */
  const handleNewSale = useCallback(() => {
    setModal(null);
    api(`/api/display/${displayId}/cart`, {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify({ cart: [], subtotal: 0, tax: 0, total: 0, status: 'idle' }),
    }).catch(() => {});
  }, [displayId, csrfToken]);

  if (loading) return <div className="loading">Loading POS…</div>;

  return (
    <div className="pos-app">
      {/* ── Top Bar ── */}
      <header className="pos-topbar">
        <h1>🍩 Outta Town Donuts — POS</h1>
        <span className="pos-clock">{clock}</span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <OrderQueue orders={pendingOrders} prevCount={prevPendingCount} csrfToken={csrfToken} onRefresh={fetchQueue} />
          <a href="/pos/display" target="_blank" rel="noopener noreferrer" className="btn-exit" style={{ background: '#4dabf7', fontSize: '0.85rem' }} title="Open customer display — bookmark this URL on the customer tablet">
            🖥️ Customer Display
          </a>
          <a href="/" className="btn-exit">
            Exit POS
          </a>
        </div>
      </header>

      {/* ── Product Grid ── */}
      <section className="pos-grid-area">
        <ProductGrid products={products} onSelect={addToCart} />
      </section>

      {/* ── Cart ── */}
      <Cart items={cart} subtotal={subtotal} tax={tax} total={total} taxRate={taxRate} onUpdateQty={updateQty} onClear={clearCart} onPayCash={() => setModal('cash')} onPayCard={handleCardPayment} onPayDonate={handleDonate} onOverridePrice={overridePrice} />

      {/* ── Modals ── */}
      {modal === 'cash' && <CashModal total={total} onConfirm={handleCashConfirm} onCancel={() => setModal(null)} />}

      {modal === 'awaiting' && <AwaitingModal total={awaitingOrder?.total || total} onCancel={cancelCardPayment} />}

      {modal === 'receipt' && <ReceiptModal order={lastOrder} onNewSale={handleNewSale} />}

      {cardError && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#c92a2a',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '10px',
            zIndex: 200,
            fontWeight: 600,
          }}
          onClick={() => setCardError('')}
        >
          ❌ {cardError}
        </div>
      )}
    </div>
  );
}

/* ── Awaiting Payment Modal ─────────────────────────────────── */
function AwaitingModal({ total, onCancel }) {
  const fmt = (n) => {
    const s = n.toFixed(3);
    return '$' + (s.endsWith('0') ? n.toFixed(2) : s);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📱</div>
        <h2 style={{ marginBottom: '12px' }}>Awaiting Payment</h2>
        <p style={{ color: '#aaa', marginBottom: '8px', fontSize: '1rem' }}>
          Total: <strong style={{ color: '#fff', fontSize: '1.4rem' }}>{fmt(total)}</strong>
        </p>
        <p style={{ color: '#69db7c', marginBottom: '28px', fontSize: '0.95rem' }}>Customer is scanning the QR code on the display screen.</p>
        <button
          onClick={onCancel}
          style={{
            width: '100%',
            padding: '14px',
            background: '#495057',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 700,
          }}
        >
          Cancel Payment
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('pos-root')).render(<App />);
