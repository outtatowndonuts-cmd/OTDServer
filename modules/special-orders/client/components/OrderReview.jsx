import { useState, useEffect } from 'react';
import { fmtCurrency, FULFILLMENT_LABELS, api } from '../utils.js';

export default function OrderReview({ form, variations, config, onSubmit, submitting, error }) {
  const { fulfillmentType, scheduledDate, customerName, customerEmail, deliveryAddress } = form;

  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(null);

  // Build line items for display
  const lineItems = variations.map((v) => {
    if (v.isAssorted) {
      const unitPrice = config.assortedDonutBasePrice > 0 ? config.assortedDonutBasePrice : null;
      const lineTotal = unitPrice ? unitPrice * (v.quantity || 1) : null;
      return { label: "Assorted \u2014 baker's choice", quantity: v.quantity || 1, unitPrice, lineTotal };
    }
    const baseOpt = (config.availableBaseRecipes || []).find((o) => o._id === v.baseRecipeOptionId);
    const frostingOpt = (config.availableFrostings || []).find((o) => o._id === v.frostingOptionId);
    const fillingOpt = v.fillingOptionId ? (config.availableFillings || []).find((o) => o._id === v.fillingOptionId) : null;
    const toppingOpts = (v.toppingOptionIds || []).map((id) => (config.availableToppings || []).find((o) => o._id === id)).filter(Boolean);
    const unitPrice = (baseOpt?.price || 0) + (frostingOpt?.price || 0) + (fillingOpt?.price || 0) + toppingOpts.reduce((s, t) => s + (t.price || 0), 0);
    const lineTotal = unitPrice * (v.quantity || 1);

    const label = [baseOpt?.name, fillingOpt ? `${fillingOpt.name} filling` : null, frostingOpt?.name, ...toppingOpts.map((t) => t.name)].filter(Boolean).join(' + ');

    return { label, quantity: v.quantity || 1, unitPrice, lineTotal };
  });

  useEffect(() => {
    setQuoteLoading(true);
    setQuoteError(null);
    api('/special-orders/api/estimate-price', { fulfillmentType, deliveryAddress, variations })
      .then((data) => setQuote(data.estimate))
      .catch((err) => setQuoteError(err.message || 'Unable to calculate price'))
      .finally(() => setQuoteLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dateStr = scheduledDate
    ? new Date(scheduledDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const hasAssorted = variations.some((v) => v.isAssorted);

  return (
    <div className="so-step">
      <h2 className="so-step-title">Step 5: Review &amp; Checkout</h2>

      <div className="so-review-section">
        <h3 className="so-review-heading">Order Details</h3>
        <table className="so-review-table">
          <tbody>
            <tr>
              <td>Fulfillment</td>
              <td>{FULFILLMENT_LABELS[fulfillmentType] || fulfillmentType}</td>
            </tr>
            <tr>
              <td>Date</td>
              <td>{dateStr}</td>
            </tr>
            <tr>
              <td>Name</td>
              <td>{customerName}</td>
            </tr>
            {customerEmail && (
              <tr>
                <td>Email</td>
                <td>{customerEmail}</td>
              </tr>
            )}
            {deliveryAddress?.street && (
              <tr>
                <td>Address</td>
                <td>
                  {deliveryAddress.street}, {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zip}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="so-review-section">
        <h3 className="so-review-heading">Items</h3>
        <table className="so-review-table so-items-table">
          <thead>
            <tr>
              <th>Composition</th>
              <th className="text-center">Qty</th>
              <th className="text-end">Each</th>
              <th className="text-end">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => (
              <tr key={i}>
                <td>{item.label}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-end">{item.unitPrice != null ? fmtCurrency(item.unitPrice) : '—'}</td>
                <td className="text-end">{item.lineTotal != null ? fmtCurrency(item.lineTotal) : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {quoteLoading ? (
              <tr>
                <td colSpan={4} className="text-center text-muted so-quote-loading">
                  Calculating totals…
                </td>
              </tr>
            ) : quoteError ? (
              <>
                <tr>
                  <td colSpan={3}>Subtotal</td>
                  <td className="text-end text-muted">—</td>
                </tr>
                <tr>
                  <td colSpan={4} className="text-danger so-quote-error">
                    {quoteError}
                  </td>
                </tr>
              </>
            ) : (
              <>
                <tr>
                  <td colSpan={3}>Subtotal</td>
                  <td className="text-end">{fmtCurrency(quote.subtotal)}</td>
                </tr>
                {quote.bundleDiscountAmount > 0 && (
                  <tr className="text-success">
                    <td colSpan={3}>Bundle Discount</td>
                    <td className="text-end">&minus;{fmtCurrency(quote.bundleDiscountAmount)}</td>
                  </tr>
                )}
                {quote.deliveryFee > 0 && (
                  <tr>
                    <td colSpan={3}>
                      Delivery Fee
                      {quote.distanceMiles != null && (
                        <span className="so-distance-note">
                          {' '}
                          ({quote.distanceMiles} mi @ {fmtCurrency(quote.perMileRate)}/mi)
                        </span>
                      )}
                    </td>
                    <td className="text-end">{fmtCurrency(quote.deliveryFee)}</td>
                  </tr>
                )}
                {quote.tax > 0 && (
                  <tr>
                    <td colSpan={3}>Tax</td>
                    <td className="text-end">{fmtCurrency(quote.tax)}</td>
                  </tr>
                )}
                <tr className="so-total-row">
                  <td colSpan={3}>
                    <strong>Estimated Total</strong>
                  </td>
                  <td className="text-end">
                    <strong>{fmtCurrency(quote.total)}</strong>
                  </td>
                </tr>
              </>
            )}
          </tfoot>
        </table>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {hasAssorted && !config.assortedDonutBasePrice && <div className="so-checkout-note">Assorted variations are priced at our discretion. Final total may differ.</div>}

      <div className="so-checkout-note">Final totals will be confirmed at checkout. You will be redirected to a secure payment page.</div>

      <button type="button" className="btn btn-primary so-checkout-btn" onClick={onSubmit} disabled={submitting || quoteLoading}>
        {submitting ? 'Processing…' : 'Proceed to Checkout'}
      </button>
    </div>
  );
}
