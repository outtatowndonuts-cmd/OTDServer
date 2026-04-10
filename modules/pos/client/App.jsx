import { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import ProductGrid from './components/ProductGrid.jsx';
import Cart from './components/Cart.jsx';
import CashModal from './components/CashModal.jsx';
import CardModal from './components/CardModal.jsx';
import ReceiptModal from './components/ReceiptModal.jsx';

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
  const [modal, setModal] = useState(null); // null | 'cash' | 'card' | 'receipt'
  const [lastOrder, setLastOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const clock = useClock();

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

  /* ── Card flow ── */
  const handleCardPayment = useCallback(async () => {
    const res = await submitOrder('card');
    if (!res.ok) return { error: res.error };
    // Create Stripe payment intent
    const piRes = await api('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify({ amountCents: Math.round(total * 100), orderId: res.order._id }),
    });
    if (!piRes.ok) return { error: piRes.error };
    return { ok: true, clientSecret: piRes.clientSecret, orderId: res.order._id };
  }, [submitOrder, csrfToken, total]);

  const handleCardSuccess = useCallback(
    async (orderId, paymentIntentId) => {
      const confRes = await api('/api/stripe/confirm', {
        method: 'POST',
        headers: { 'x-csrf-token': csrfToken },
        body: JSON.stringify({ orderId, paymentIntentId }),
      });
      if (!confRes.ok) return;
      setLastOrder({ ...confRes.order, paymentMethod: 'card' });
      setCart([]);
      setModal('receipt');
    },
    [csrfToken],
  );

  if (loading) return <div className="loading">Loading POS…</div>;

  return (
    <div className="pos-app">
      {/* ── Top Bar ── */}
      <header className="pos-topbar">
        <h1>🍩 Outta Town Donuts — POS</h1>
        <span className="pos-clock">{clock}</span>
        <a href="/" className="btn-exit">
          Exit POS
        </a>
      </header>

      {/* ── Product Grid ── */}
      <section className="pos-grid-area">
        <ProductGrid products={products} onSelect={addToCart} />
      </section>

      {/* ── Cart ── */}
      <Cart items={cart} subtotal={subtotal} tax={tax} total={total} taxRate={taxRate} onUpdateQty={updateQty} onClear={clearCart} onPayCash={() => setModal('cash')} onPayCard={() => setModal('card')} onPayDonate={handleDonate} onOverridePrice={overridePrice} />

      {/* ── Modals ── */}
      {modal === 'cash' && <CashModal total={total} onConfirm={handleCashConfirm} onCancel={() => setModal(null)} />}
      {modal === 'card' && <CardModal total={total} onCreateIntent={handleCardPayment} onSuccess={handleCardSuccess} onCancel={() => setModal(null)} />}
      {modal === 'receipt' && <ReceiptModal order={lastOrder} onNewSale={() => setModal(null)} />}
    </div>
  );
}

createRoot(document.getElementById('pos-root')).render(<App />);
