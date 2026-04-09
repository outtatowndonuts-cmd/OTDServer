import { useState, useRef, useEffect } from 'react';

const fmt = (n) => {
  const s = n.toFixed(3);
  return '$' + (s.endsWith('0') ? n.toFixed(2) : s);
};

const QUICK_AMOUNTS = [1, 5, 10, 20, 50, 100];

export default function CashModal({ total, onConfirm, onCancel }) {
  const [cashReceived, setCashReceived] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const parsed = parseFloat(cashReceived) || 0;
  const change = parsed - total;

  const handleConfirm = async () => {
    if (parsed < total) {
      setError('Insufficient cash received');
      return;
    }
    setProcessing(true);
    setError('');
    const res = await onConfirm(parsed);
    if (res.error) {
      setError(res.error);
      setProcessing(false);
    }
  };

  const handleQuickAmount = (amount) => {
    setCashReceived(String(amount));
  };

  const handleExact = () => {
    setCashReceived(total.toFixed(2));
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>💵 Cash Payment</h2>

        <div className="card-total-display">Total: {fmt(total)}</div>

        <div className="cash-input-group">
          <label>Cash Received</label>
          <input ref={inputRef} type="number" min="0" step="0.01" placeholder="0.00" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleConfirm()} />
        </div>

        <div className="cash-quick-amounts">
          {QUICK_AMOUNTS.map((amt) => (
            <button key={amt} onClick={() => handleQuickAmount(amt)}>
              ${amt}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <button
            onClick={handleExact}
            style={{
              padding: '10px 24px',
              fontSize: '.95rem',
              fontWeight: 600,
              border: '1px solid #3a3d4a',
              borderRadius: 8,
              background: '#252838',
              color: '#69db7c',
              cursor: 'pointer',
            }}
          >
            Exact
          </button>
        </div>

        <div className={`change-display ${change > 0 ? 'positive' : change < 0 ? 'negative' : 'zero'}`}>{parsed === 0 ? 'Enter cash amount' : change >= 0 ? `Change: ${fmt(change)}` : `Short: ${fmt(Math.abs(change))}`}</div>

        {error && <div className="stripe-error">{error}</div>}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel} disabled={processing}>
            Cancel
          </button>
          <button className="btn-confirm" onClick={handleConfirm} disabled={parsed < total || processing}>
            {processing ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
