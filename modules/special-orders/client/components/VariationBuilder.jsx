import VariationRow from './VariationRow.jsx';

function newVariation() {
  return { baseRecipeOptionId: '', frostingOptionId: '', toppingOptionIds: [], quantity: 1 };
}

export default function VariationBuilder({ variations, totalQuantity, config, onChange }) {
  const assignedQty = variations.reduce((s, v) => s + (Number(v.quantity) || 1), 0);
  const remaining = totalQuantity - assignedQty;

  function updateVariation(index, updated) {
    const next = [...variations];
    next[index] = updated;
    onChange(next);
  }

  function removeVariation(index) {
    onChange(variations.filter((_, i) => i !== index));
  }

  function addVariation() {
    onChange([...variations, newVariation()]);
  }

  const isComplete = remaining === 0;
  const isOver = remaining < 0;

  return (
    <div className="so-step">
      <h2 className="so-step-title">Step 3: Build Your Order</h2>
      <p className="so-step-hint">
        Add variations until all <strong>{totalQuantity}</strong> donuts are accounted for. Each variation is a uniquely composed donut repeated by quantity.
      </p>

      <div className={`so-qty-tracker ${isOver ? 'over' : isComplete ? 'complete' : ''}`}>
        <div className="so-qty-tracker-bar" style={{ width: `${Math.min(100, (assignedQty / totalQuantity) * 100)}%` }} />
        <span className="so-qty-tracker-label">
          {assignedQty} / {totalQuantity} assigned
          {isOver && <span className="text-danger ms-2">⚠ {Math.abs(remaining)} over limit</span>}
          {isComplete && <span className="text-success ms-2">✓ Complete</span>}
        </span>
      </div>

      {variations.map((v, i) => (
        <VariationRow key={i} variation={v} index={i} config={config} onUpdate={updateVariation} onRemove={removeVariation} canRemove={variations.length > 1} />
      ))}

      <button type="button" className="btn btn-outline-secondary so-add-variation-btn" onClick={addVariation} disabled={remaining <= 0}>
        + Add Another Variation
      </button>

      {isOver && (
        <div className="alert alert-danger mt-3">
          Your variations total <strong>{assignedQty}</strong> donuts but your order is for <strong>{totalQuantity}</strong>. Please adjust quantities.
        </div>
      )}
    </div>
  );
}
