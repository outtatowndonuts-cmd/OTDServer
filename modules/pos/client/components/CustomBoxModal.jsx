import { useState, useCallback } from 'react';

const fmt = (n) => {
  const s = n.toFixed(3);
  return '$' + (s.endsWith('0') ? n.toFixed(2) : s);
};

/* ─── Phase 1: Choose a box type ──────────────────────────── */
function BoxTypePicker({ configs, onSelect, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" style={{ maxWidth: 600, width: '94vw', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 6 }}>📦 Custom Box</h2>
        <p style={{ color: '#a89a88', marginBottom: 20, fontSize: '0.9rem' }}>Choose a box type to build.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {configs.map((cfg) => (
            <button
              key={cfg._id}
              onClick={() => onSelect(cfg)}
              style={{
                background: '#1a1a1a',
                border: '1px solid #3a3228',
                borderRadius: 4,
                padding: '18px 14px',
                cursor: 'pointer',
                color: '#f4e9d8',
                textAlign: 'center',
                transition: 'border-color .15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#c24a1a')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#3a3228')}
            >
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{cfg.name}</div>
              <div style={{ color: '#a89a88', fontSize: '0.85rem', marginBottom: cfg.discountPct > 0 ? 8 : 0 }}>{cfg.size} items</div>
              {cfg.discountPct > 0 && (
                <div
                  style={{
                    display: 'inline-block',
                    background: '#064e3b',
                    color: '#6ee7b7',
                    borderRadius: 8,
                    padding: '2px 8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  {cfg.discountPct}% off
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="modal-actions" style={{ marginTop: 24 }}>
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Phase 2: Fill the box ────────────────────────────────── */
function BoxFiller({ box, products, cart, onConfirm, onBack }) {
  // qty map: productId -> qty
  const [qtys, setQtys] = useState({});

  // How many of each product is already committed in the cart
  const cartQty = useCallback(
    (pid) => {
      return cart.filter((i) => i.refId === pid).reduce((s, i) => s + i.quantity, 0);
    },
    [cart],
  );

  // Effective available stock for this product (accounting for what's already in the cart)
  const availableFor = useCallback(
    (p) => {
      const stock = p.inventoryQty ?? Infinity;
      return Math.max(0, stock - cartQty(p._id));
    },
    [cartQty],
  );

  const totalSelected = Object.values(qtys).reduce((s, q) => s + q, 0);
  const remaining = box.size - totalSelected;
  const pct = Math.min(100, Math.round((totalSelected / box.size) * 100));

  const discountFactor = 1 - box.discountPct / 100;

  let gross = 0;
  for (const [pid, qty] of Object.entries(qtys)) {
    const p = products.find((x) => x._id === pid);
    if (p) gross += (p.price || 0) * qty;
  }
  const discountAmt = Math.round(gross * (box.discountPct / 100) * 100) / 100;
  const net = Math.max(0, Math.round((gross - discountAmt) * 100) / 100);

  const setQty = useCallback(
    (pid, delta, maxStock) => {
      setQtys((prev) => {
        const cur = prev[pid] || 0;
        let next = cur + delta;
        if (next < 0) next = 0;
        if (next > maxStock) next = maxStock; // never exceed available stock

        // Cap at remaining box capacity when adding
        if (delta > 0) {
          const otherTotal = Object.entries(prev)
            .filter(([k]) => k !== pid)
            .reduce((s, [, v]) => s + v, 0);
          const cap = box.size - otherTotal;
          if (next > cap) next = cap;
        }

        return { ...prev, [pid]: next };
      });
    },
    [box.size],
  );

  const handleConfirm = () => {
    const items = [];
    for (const [pid, qty] of Object.entries(qtys)) {
      if (qty <= 0) continue;
      const p = products.find((x) => x._id === pid);
      if (!p) continue;
      const discountedPrice = Math.round((p.price || 0) * discountFactor * 100) / 100;
      items.push({
        kind: 'product',
        refId: p._id,
        nameSnapshot: `${p.name} (${box.name})`,
        priceSnapshot: discountedPrice,
        quantity: qty,
      });
    }
    onConfirm(items);
  };

  const boxFull = totalSelected === box.size;
  const tooMany = totalSelected > box.size;

  return (
    <div className="modal-backdrop">
      <div
        className="modal-box"
        style={{
          maxWidth: 700,
          width: '96vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #3a3228', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              📦 {box.name}
              <span style={{ fontWeight: 400, color: '#a89a88', fontSize: '0.9rem', marginLeft: 8 }}>{box.size} items</span>
            </h2>
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                border: '1px solid #3a3228',
                color: '#a89a88',
                borderRadius: 4,
                padding: '4px 12px',
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              ← Change box
            </button>
          </div>

          {/* Progress bar */}
          <div
            style={{
              background: '#1a1a1a',
              borderRadius: 4,
              height: 8,
              overflow: 'hidden',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                height: '100%',
                width: pct + '%',
                background: boxFull ? '#6ee7b7' : tooMany ? '#fca5a5' : '#c24a1a',
                borderRadius: 6,
                transition: 'width .2s',
              }}
            />
          </div>
          <div style={{ fontSize: '0.82rem', color: boxFull ? '#6ee7b7' : tooMany ? '#fca5a5' : '#a89a88' }}>{boxFull ? '✓ Box is full — ready to add!' : tooMany ? `Too many — remove ${totalSelected - box.size}` : `${remaining} more item${remaining !== 1 ? 's' : ''} to fill the box`}</div>
        </div>

        {/* Scrollable product list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginTop: 12 }}>
            <thead>
              <tr style={{ color: '#a89a88', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 500 }}>Product</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 500 }}>Price</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 500, width: 120 }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {products
                .filter((p) => p.productType !== 'bundle')
                .map((p) => {
                  const qty = qtys[p._id] || 0;
                  const maxStock = availableFor(p);
                  const hasStock = maxStock > 0;
                  const atMax = qty >= maxStock;
                  const boxFull = remaining <= 0;
                  return (
                    <tr key={p._id} style={{ borderTop: '1px solid #2a2318', opacity: hasStock ? 1 : 0.45 }}>
                      <td style={{ padding: '10px 8px', fontWeight: qty > 0 ? 600 : 400 }}>
                        {p.name}
                        {hasStock && maxStock < Infinity && <span style={{ marginLeft: 6, fontSize: '0.75rem', color: maxStock <= 3 ? '#fcd34d' : '#6b4f3a' }}>({maxStock} avail.)</span>}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#a89a88' }}>{fmt(p.price || 0)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        {hasStock ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <button
                              onClick={() => setQty(p._id, -1, maxStock)}
                              disabled={qty === 0}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 3,
                                border: 'none',
                                background: qty === 0 ? '#1a1a1a' : '#2a2318',
                                color: qty === 0 ? '#6b4f3a' : '#f4e9d8',
                                cursor: qty === 0 ? 'default' : 'pointer',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                              }}
                            >
                              −
                            </button>
                            <span
                              style={{
                                minWidth: 22,
                                textAlign: 'center',
                                fontWeight: 700,
                                color: qty > 0 ? '#c24a1a' : '#6b4f3a',
                              }}
                            >
                              {qty}
                            </span>
                            <button
                              onClick={() => setQty(p._id, 1, maxStock)}
                              disabled={(boxFull && qty === 0) || atMax}
                              title={atMax ? `Only ${maxStock} available` : undefined}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 3,
                                border: 'none',
                                background: (boxFull && qty === 0) || atMax ? '#1a1a1a' : '#c24a1a',
                                color: (boxFull && qty === 0) || atMax ? '#6b4f3a' : '#f4e9d8',
                                cursor: (boxFull && qty === 0) || atMax ? 'default' : 'pointer',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                              }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#6b4f3a', fontSize: '0.8rem' }}>Sold out</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer: summary + actions */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #3a3228', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#a89a88', marginBottom: 4 }}>
            <span>Price before discount:</span>
            <span>{fmt(gross)}</span>
          </div>
          {box.discountPct > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#c24a1a', marginBottom: 4 }}>
              <span>
                {box.name} discount ({box.discountPct}%):
              </span>
              <span>−{fmt(discountAmt)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>
            <span>Total added to cart:</span>
            <span style={{ color: '#6ee7b7' }}>{fmt(net)}</span>
          </div>

          <div className="modal-actions" style={{ marginTop: 0 }}>
            <button className="btn-cancel" onClick={onBack}>
              Cancel
            </button>
            <button className="btn-confirm" disabled={!boxFull} onClick={handleConfirm}>
              {boxFull ? 'Add to Cart' : `${remaining} left`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main export: orchestrates phases ─────────────────────── */
export default function CustomBoxModal({ configs, products, cart, onAddItems, onCancel }) {
  const [selectedBox, setSelectedBox] = useState(null);

  if (!selectedBox) {
    return <BoxTypePicker configs={configs} onSelect={(cfg) => setSelectedBox(cfg)} onCancel={onCancel} />;
  }

  return (
    <BoxFiller
      box={selectedBox}
      products={products}
      cart={cart}
      onConfirm={(items) => {
        onAddItems(items);
        onCancel(); // close modal after adding
      }}
      onBack={() => setSelectedBox(null)}
    />
  );
}
