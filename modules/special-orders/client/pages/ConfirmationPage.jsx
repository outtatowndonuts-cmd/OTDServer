import { useState, useEffect, useRef } from 'react';
import { fmtCurrency, STATUS_LABELS, FULFILLMENT_LABELS } from '../utils.js';

export default function ConfirmationPage() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId');
  const sessionId = params.get('session_id');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  async function fetchStatus() {
    try {
      const qs = new URLSearchParams({ orderId });
      if (sessionId) qs.set('session_id', sessionId);
      const res = await fetch(`/special-orders/api/order-status?${qs}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setOrder(data.order);
      // Stop polling once paid
      if (data.order.paymentStatus === 'paid') {
        clearInterval(pollRef.current);
      }
    } catch (err) {
      setError(err.message);
      clearInterval(pollRef.current);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided.');
      setLoading(false);
      return;
    }
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  if (loading) {
    return (
      <div className="so-confirmation so-loading">
        <div className="spinner-border" role="status" />
        <p>Verifying your payment…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="so-confirmation so-error">
        <p>Could not load your order. {error}</p>
        <a href="/special-orders/order-lookup" className="btn btn-outline-secondary mt-3">
          Look Up Order
        </a>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="so-confirmation">
      <div className={`so-confirmation-badge ${isPaid ? 'success' : 'pending'}`}>{isPaid ? '✓' : '⏳'}</div>

      <h1 className="so-confirmation-title">{isPaid ? 'Order Confirmed!' : 'Processing Payment…'}</h1>

      {order.confirmationNumber && (
        <div className="so-confirmation-number">
          Confirmation #<strong>{order.confirmationNumber}</strong>
        </div>
      )}

      {!isPaid && <p className="so-confirmation-hint">We're waiting for payment confirmation. This page will update automatically.</p>}

      {isPaid && (
        <>
          <div className="so-confirmation-details">
            <div className="so-detail-row">
              <span>Fulfillment</span>
              <span>{FULFILLMENT_LABELS[order.fulfillmentType] || order.fulfillmentType}</span>
            </div>
            <div className="so-detail-row">
              <span>Date</span>
              <span>
                {new Date(order.scheduledDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="so-detail-row">
              <span>Status</span>
              <span>{STATUS_LABELS[order.status] || order.status}</span>
            </div>
            <div className="so-detail-row">
              <span>Total</span>
              <span>{fmtCurrency(order.total)}</span>
            </div>
          </div>

          {order.customerEmail && <p className="so-confirmation-email-note">A confirmation email has been sent to {order.customerEmail}.</p>}

          <div className="so-confirmation-actions">
            <a href="/special-orders/order-lookup" className="btn btn-outline-secondary">
              Check Order Status
            </a>
            <a href="/special-orders" className="btn btn-primary">
              Place Another Order
            </a>
          </div>
        </>
      )}
    </div>
  );
}
