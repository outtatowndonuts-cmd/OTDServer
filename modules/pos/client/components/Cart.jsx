const fmt = (n) => {
  const s = n.toFixed(3);
  return '$' + (s.endsWith('0') ? n.toFixed(2) : s);
};

export default function Cart({ items, products, subtotal, tax, total, taxRate, onUpdateQty, onClear, onPayCash, onPayCard, onPayDonate, onOverridePrice }) {
  const hasItems = items.length > 0;

  const stockFor = (refId) => {
    const p = products && products.find((x) => x._id === refId);
    return p ? (p.inventoryQty ?? Infinity) : Infinity;
  };

  return (
    <aside className="pos-cart">
      <div className="cart-header">
        Current Sale
        {hasItems && (
          <button className="clear-cart-btn" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      {hasItems ? (
        <div className="cart-items">
          {items.map((item) => {
            const max = stockFor(item.refId);
            const atMax = item.quantity >= max;
            return (
              <div key={`${item.refId}|${item.nameSnapshot}`} className="cart-item">
                <span className="cart-item-name">{item.nameSnapshot}</span>
                <div className="cart-item-qty">
                  <button onClick={() => onUpdateQty(item.refId, -1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => onUpdateQty(item.refId, 1)} disabled={atMax} title={atMax ? `Only ${max} in stock` : undefined}>
                    +
                  </button>
                </div>
                {atMax && <span className="cart-item-max-label">max</span>}
                <div className="cart-item-price-wrap">
                  <input className="cart-item-price-input" type="number" min="0" step="0.01" value={item.priceSnapshot} onChange={(e) => onOverridePrice(item.refId, parseFloat(e.target.value) || 0)} aria-label={`Price for ${item.nameSnapshot}`} />
                  <span className="cart-item-line-total">{fmt(item.priceSnapshot * item.quantity)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="cart-empty">Tap a product to start a sale</div>
      )}

      <div className="cart-totals">
        <div className="row">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="row">
          <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
          <span>{fmt(tax)}</span>
        </div>
        <div className="row total">
          <span>Total</span>
          <span>{fmt(total)}</span>
        </div>
      </div>

      <div className="cart-actions">
        <button className="btn-pay cash" disabled={!hasItems} onClick={onPayCash}>
          💵 Cash
        </button>
        <button className="btn-pay card" disabled={!hasItems} onClick={onPayCard}>
          💳 Card
        </button>
        <button className="btn-pay donate" disabled={!hasItems} onClick={onPayDonate}>
          🎁 Donate
        </button>
      </div>
    </aside>
  );
}
