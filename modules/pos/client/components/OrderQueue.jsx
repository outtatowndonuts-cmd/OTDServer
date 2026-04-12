import { useState, useEffect, useRef } from 'react';

/**
 * OrderQueue — notification bell showing orders that need to be filled or delivered.
 *
 * Props:
 *   orders      {Array}    — combined list of 'completed' (to fill) and 'filled' (to deliver) orders
 *   prevCount   {number}   — count from the previous poll (to animate new arrivals)
 *   csrfToken   {string}   — for POST requests
 *   onRefresh   {Function} — callback to re-fetch the queue after an action
 */
export default function OrderQueue({ orders, prevCount, csrfToken, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [working, setWorking] = useState(null); // orderId currently being actioned
  const panelRef = useRef(null);

  const toFill = orders.filter((o) => o.status === 'completed');
  const toDeliver = orders.filter((o) => o.status === 'filled');
  const count = orders.length;

  /* Pulse the bell whenever a new order arrives */
  useEffect(() => {
    if (count > prevCount) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1800);
      return () => clearTimeout(t);
    }
  }, [count, prevCount]);

  /* Close panel on outside click */
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  async function doAction(orderId, action) {
    setWorking(orderId);
    try {
      await fetch(`/pos/api/orders/${orderId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      });
      onRefresh();
    } catch {
      /* silent — next poll will sync */
    }
    setWorking(null);
  }

  function fmt(n) {
    return '$' + Number(n ?? 0).toFixed(2);
  }

  function timeAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  // Bell color state: red = orders to fill, yellow = all filled/awaiting pickup, green = all clear
  const bellState = toFill.length > 0 ? 'urgent' : toDeliver.length > 0 ? 'waiting' : 'clear';

  return (
    <div className="order-queue-wrap" ref={panelRef}>
      {/* ── Bell Button ── */}
      <button className={`order-queue-btn bell-${bellState}${pulse ? ' pulse' : ''}`} onClick={() => setOpen((v) => !v)} aria-label={`${count} order${count !== 1 ? 's' : ''} need attention`} title="Order queue">
        🔔
        {count > 0 && <span className="order-queue-badge">{count > 99 ? '99+' : count}</span>}
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div className="order-queue-panel">
          <div className="order-queue-header">
            <span>Online Orders</span>
            <span className="order-queue-count">{count}</span>
          </div>

          {count === 0 ? (
            <div className="order-queue-empty">All caught up!</div>
          ) : (
            <>
              {toFill.length > 0 && <OrderSection label="🔧 To Fill" labelClass="label-fill" orders={toFill} actionLabel="Mark Filled" actionClass="btn-fill" action="fill" working={working} onAction={doAction} fmt={fmt} timeAgo={timeAgo} />}
              {toDeliver.length > 0 && <OrderSection label="📦 Ready for Pickup" labelClass="label-deliver" orders={toDeliver} actionLabel="Delivered" actionClass="btn-deliver" action="deliver" working={working} onAction={doAction} fmt={fmt} timeAgo={timeAgo} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function OrderSection({ label, labelClass, orders, actionLabel, actionClass, action, working, onAction, fmt, timeAgo }) {
  return (
    <div className="order-queue-section">
      <div className={`order-queue-section-label ${labelClass}`}>{label}</div>
      <ul className="order-queue-list">
        {orders.map((order) => (
          <li key={order._id} className="order-queue-item">
            <div className="order-queue-item-top">
              <div>
                <span className="order-queue-item-id">{order.pickupName || `#${order._id.toString().slice(-6).toUpperCase()}`}</span>
                {order.source === 'online' && <span className="order-queue-item-source">ONLINE</span>}
              </div>
              <span className="order-queue-item-total">{fmt(order.total)}</span>
            </div>
            <div className="order-queue-item-items">{order.items?.map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(', ')}</div>
            <div className="order-queue-item-footer">
              <span className="order-queue-item-age">{timeAgo(order.createdAt)}</span>
              <button className={`order-queue-action ${actionClass}`} disabled={working === order._id} onClick={() => onAction(order._id, action)}>
                {working === order._id ? '…' : actionLabel}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
