export default function Cart({ items, subtotal, tax, total, taxRate, onUpdateQty, onClear, onPayCash, onPayCard }) {
  const hasItems = items.length > 0;

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
          {items.map((item) => (
            <div key={item.refId} className="cart-item">
              <span className="cart-item-name">{item.nameSnapshot}</span>
              <div className="cart-item-qty">
                <button onClick={() => onUpdateQty(item.refId, -1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => onUpdateQty(item.refId, 1)}>+</button>
              </div>
              <span className="cart-item-price">${(item.priceSnapshot * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="cart-empty">Tap a product to start a sale</div>
      )}

      <div className="cart-totals">
        <div className="row">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="row">
          <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="row total">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="cart-actions">
        <button className="btn-pay cash" disabled={!hasItems} onClick={onPayCash}>
          💵 Cash
        </button>
        <button className="btn-pay card" disabled={!hasItems} onClick={onPayCard}>
          💳 Card
        </button>
      </div>
    </aside>
  );
}
