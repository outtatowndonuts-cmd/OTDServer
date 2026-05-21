export default function StepQuantity({ totalQuantity, onChange }) {
  function adjust(delta) {
    const next = Math.max(1, (totalQuantity || 1) + delta);
    onChange('totalQuantity', next);
  }

  return (
    <div className="so-step">
      <h2 className="so-step-title">Step 2: Total Quantity</h2>
      <p className="so-step-hint">How many donuts are in this order? You will break them into variations in the next step.</p>

      <div className="so-qty-control">
        <button type="button" className="so-qty-btn" onClick={() => adjust(-1)} disabled={totalQuantity <= 1} aria-label="Decrease quantity">
          −
        </button>
        <input type="number" className="so-qty-input form-control" min={1} value={totalQuantity} onChange={(e) => onChange('totalQuantity', Math.max(1, parseInt(e.target.value) || 1))} aria-label="Total quantity" />
        <button type="button" className="so-qty-btn" onClick={() => adjust(1)} aria-label="Increase quantity">
          +
        </button>
      </div>

      <div className="so-qty-label">
        {totalQuantity} donut{totalQuantity !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
