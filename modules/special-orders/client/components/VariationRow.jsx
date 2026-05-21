import { useState } from 'react';
import { fmtCurrency } from '../utils.js';

export default function VariationRow({ variation, index, config, onUpdate, onRemove, canRemove }) {
  const { availableBaseRecipes, availableFrostings, availableToppings, availableFillings } = config;

  function set(field, value) {
    onUpdate(index, { ...variation, [field]: value });
  }

  function toggleTopping(toppingId) {
    const ids = variation.toppingOptionIds || [];
    const next = ids.includes(toppingId) ? ids.filter((id) => id !== toppingId) : [...ids, toppingId];
    set('toppingOptionIds', next);
  }

  function toggleAssorted(e) {
    // When switching to assorted, clear specific selections
    if (e.target.checked) {
      onUpdate(index, {
        ...variation,
        isAssorted: true,
        baseRecipeOptionId: '',
        frostingOptionId: '',
        fillingOptionId: '',
        toppingOptionIds: [],
      });
    } else {
      set('isAssorted', false);
    }
  }

  const isAssorted = Boolean(variation.isAssorted);

  // Live price preview (only when not assorted)
  const baseOption = !isAssorted ? (availableBaseRecipes || []).find((o) => o._id === variation.baseRecipeOptionId) : null;
  const frostingOption = !isAssorted ? (availableFrostings || []).find((o) => o._id === variation.frostingOptionId) : null;
  const fillingOption = !isAssorted ? (availableFillings || []).find((o) => o._id === variation.fillingOptionId) : null;
  const selectedToppings = !isAssorted ? (variation.toppingOptionIds || []).map((id) => (availableToppings || []).find((o) => o._id === id)).filter(Boolean) : [];

  const isFilled = Boolean(baseOption?.isFilled);
  const fillingsList = availableFillings || [];

  const unitPrice = isAssorted ? 0 : (baseOption?.price || 0) + (frostingOption?.price || 0) + (fillingOption?.price || 0) + selectedToppings.reduce((s, t) => s + (t.price || 0), 0);
  const lineTotal = unitPrice * (variation.quantity || 1);

  return (
    <div className="so-variation-row">
      <div className="so-variation-header">
        <span className="so-variation-num">Variation {index + 1}</span>
        {canRemove && (
          <button type="button" className="so-remove-btn" onClick={() => onRemove(index)} aria-label="Remove variation">
            ✕
          </button>
        )}
      </div>

      {/* Assorted toggle */}
      <label className="so-assorted-toggle">
        <input type="checkbox" checked={isAssorted} onChange={toggleAssorted} className="so-assorted-check" />
        <span>Let us choose (assorted)</span>
      </label>

      {isAssorted ? (
        /* Assorted mode — only show quantity */
        <div className="so-variation-fields">
          <div className="so-field so-field-qty">
            <label className="so-label">Quantity</label>
            <div className="so-qty-control so-qty-control-sm">
              <button type="button" className="so-qty-btn" onClick={() => set('quantity', Math.max(1, (variation.quantity || 1) - 1))} disabled={(variation.quantity || 1) <= 1}>
                −
              </button>
              <input type="number" className="so-qty-input form-control" min={1} value={variation.quantity || 1} onChange={(e) => set('quantity', Math.max(1, parseInt(e.target.value) || 1))} />
              <button type="button" className="so-qty-btn" onClick={() => set('quantity', (variation.quantity || 1) + 1)}>
                +
              </button>
            </div>
          </div>
          <p className="so-assorted-note">We'll select a delicious variety for you. Pricing will be confirmed at checkout.</p>
        </div>
      ) : (
        /* Specific variation mode */
        <>
          <div className="so-variation-fields">
            {/* Base Recipe */}
            <div className="so-field">
              <label className="so-label">
                Base Recipe <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={variation.baseRecipeOptionId || ''}
                onChange={(e) => {
                  // When changing base, clear filling selection
                  onUpdate(index, { ...variation, baseRecipeOptionId: e.target.value, fillingOptionId: '' });
                }}
              >
                <option value="">-- Select base --</option>
                {(availableBaseRecipes || []).map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name}
                    {o.isFilled ? ' (filled)' : ''} ({fmtCurrency(o.price)})
                  </option>
                ))}
              </select>
            </div>

            {/* Filling (only for filled base recipes) */}
            {isFilled && fillingsList.length > 0 && (
              <div className="so-field">
                <label className="so-label">
                  Filling <span className="text-danger">*</span>
                </label>
                <select className="form-select" value={variation.fillingOptionId || ''} onChange={(e) => set('fillingOptionId', e.target.value)}>
                  <option value="">-- Select filling --</option>
                  {fillingsList.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} (+{fmtCurrency(f.price)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Frosting */}
            <div className="so-field">
              <label className="so-label">
                Frosting <span className="text-danger">*</span>
              </label>
              <select className="form-select" value={variation.frostingOptionId || ''} onChange={(e) => set('frostingOptionId', e.target.value)}>
                <option value="">-- Select frosting --</option>
                {(availableFrostings || []).map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name} ({fmtCurrency(o.price)})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="so-field so-field-qty">
              <label className="so-label">Quantity</label>
              <div className="so-qty-control so-qty-control-sm">
                <button type="button" className="so-qty-btn" onClick={() => set('quantity', Math.max(1, (variation.quantity || 1) - 1))} disabled={(variation.quantity || 1) <= 1}>
                  −
                </button>
                <input type="number" className="so-qty-input form-control" min={1} value={variation.quantity || 1} onChange={(e) => set('quantity', Math.max(1, parseInt(e.target.value) || 1))} />
                <button type="button" className="so-qty-btn" onClick={() => set('quantity', (variation.quantity || 1) + 1)}>
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Toppings */}
          {(availableToppings || []).length > 0 && (
            <div className="so-field">
              <label className="so-label">Toppings (optional)</label>
              <div className="so-toppings-grid">
                {(availableToppings || []).map((t) => {
                  const checked = (variation.toppingOptionIds || []).includes(t._id);
                  return (
                    <label key={t._id} className={`so-topping-chip${checked ? ' selected' : ''}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleTopping(t._id)} />
                      {t.name} (+{fmtCurrency(t.price)})
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="so-variation-total">
            Line total: <strong>{fmtCurrency(lineTotal)}</strong>
            {variation.quantity > 1 && (
              <span className="so-unit-price">
                {' '}
                ({fmtCurrency(unitPrice)} × {variation.quantity})
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
