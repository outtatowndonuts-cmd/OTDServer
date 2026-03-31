import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Stripe publishable key is injected from the server via a data attribute or env.
// We read it from a meta tag or fall back to the STRIPE_PKEY env placeholder.
function getStripeKey() {
  const meta = document.querySelector('meta[name="stripe-pkey"]');
  if (meta) return meta.content;
  // Fallback: fetch from server
  return null;
}

let stripePromise = null;

function getStripe(key) {
  if (!stripePromise && key) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

/* ── Inner form rendered inside <Elements> ── */
function CardForm({ orderId, onSuccess, onCancel, total }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
      return;
    }

    // Payment succeeded — tell server with the Payment Intent ID for verification
    await onSuccess(orderId, paymentIntent?.id);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card-total-display">Charge: ${total.toFixed(2)}</div>
      <div className="stripe-element-wrapper">
        <PaymentElement />
      </div>
      {error && <div className="stripe-error">{error}</div>}
      <div className="modal-actions">
        <button type="button" className="btn-cancel" onClick={onCancel} disabled={processing}>
          Cancel
        </button>
        <button type="submit" className="btn-confirm" disabled={!stripe || processing}>
          {processing ? 'Processing…' : 'Pay'}
        </button>
      </div>
    </form>
  );
}

/* ── Outer modal manages intent creation ── */
export default function CardModal({ total, onCreateIntent, onSuccess, onCancel }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [stripeKey, setStripeKey] = useState(getStripeKey);
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      // If we don't have the key yet, fetch it from settings
      if (!stripeKey) {
        try {
          const res = await fetch('/pos/api/settings');
          const data = await res.json();
          if (data.ok && data.settings && data.settings.stripePublishableKey) {
            setStripeKey(data.settings.stripePublishableKey);
          }
        } catch {
          // Key will be checked below
        }
      }

      const res = await onCreateIntent();
      if (res.error) {
        setError(res.error);
        setInitializing(false);
        return;
      }
      setClientSecret(res.clientSecret);
      setOrderId(res.orderId);
      setInitializing(false);
    })();
  }, []);

  const effectiveKey = stripeKey;

  if (initializing) {
    return (
      <div className="modal-backdrop">
        <div className="modal-box">
          <div className="processing-spinner">Preparing card payment…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-backdrop" onClick={onCancel}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <h2>💳 Card Payment</h2>
          <div className="stripe-error">{error}</div>
          <div className="modal-actions" style={{ marginTop: 16 }}>
            <button className="btn-cancel" onClick={onCancel}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!effectiveKey) {
    return (
      <div className="modal-backdrop" onClick={onCancel}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <h2>💳 Card Payment</h2>
          <div className="stripe-error">Stripe is not configured. Set STRIPE_PKEY and STRIPE_SKEY in your environment.</div>
          <div className="modal-actions" style={{ marginTop: 16 }}>
            <button className="btn-cancel" onClick={onCancel}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stripeInstance = getStripe(effectiveKey);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>💳 Card Payment</h2>
        <Elements
          stripe={stripeInstance}
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: { colorPrimary: '#4dabf7', borderRadius: '8px' },
            },
          }}
        >
          <CardForm orderId={orderId} onSuccess={onSuccess} onCancel={onCancel} total={total} />
        </Elements>
      </div>
    </div>
  );
}
