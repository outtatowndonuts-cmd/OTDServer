const fmt = (n) => {
  const s = n.toFixed(3);
  return '$' + (s.endsWith('0') ? n.toFixed(2) : s);
};

export default function ReceiptModal({ order, onNewSale }) {
  if (!order) return null;

  const isCash = order.paymentMethod === 'cash';
  const isDonation = order.paymentMethod === 'donation';

  return (
    <div className="modal-backdrop">
      <div className="modal-box receipt">
        <div className="checkmark">✅</div>
        <h2>{isDonation ? 'Donated' : 'Payment Complete'}</h2>
        <div className="receipt-method">{isCash ? 'Cash' : isDonation ? 'Donation' : 'Card'} Payment</div>
        <div className="receipt-total">{fmt(order.total || 0)}</div>
        {isCash && order.change != null && (
          <div className="receipt-change">
            Received: {fmt(order.cashReceived || 0)} &nbsp;|&nbsp; Change: {fmt(order.change)}
          </div>
        )}
        <button className="btn-new-sale" onClick={onNewSale}>
          New Sale
        </button>
      </div>
    </div>
  );
}
