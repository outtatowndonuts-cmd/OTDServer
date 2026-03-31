export default function ReceiptModal({ order, onNewSale }) {
  if (!order) return null;

  const isCash = order.paymentMethod === 'cash';

  return (
    <div className="modal-backdrop">
      <div className="modal-box receipt">
        <div className="checkmark">✅</div>
        <h2>Payment Complete</h2>
        <div className="receipt-method">{isCash ? 'Cash' : 'Card'} Payment</div>
        <div className="receipt-total">${(order.total || 0).toFixed(2)}</div>
        {isCash && order.change != null && (
          <div className="receipt-change">
            Received: ${(order.cashReceived || 0).toFixed(2)} &nbsp;|&nbsp; Change: ${order.change.toFixed(2)}
          </div>
        )}
        <button className="btn-new-sale" onClick={onNewSale}>
          New Sale
        </button>
      </div>
    </div>
  );
}
