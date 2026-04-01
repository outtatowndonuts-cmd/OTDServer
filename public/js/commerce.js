/**
 * Commerce ordering page — client-side logic.
 * Reads CSRF token from meta tag, computes subtotal, submits order, redirects to Stripe.
 */
(function () {
  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

  const qtyInputs = document.querySelectorAll('.qty-input');
  const subtotalEl = document.getElementById('order-subtotal');
  const checkoutBtn = document.getElementById('checkout-btn');
  const errorEl = document.getElementById('order-error');
  const loadingEl = document.getElementById('order-loading');

  if (!checkoutBtn) return;

  function getItems() {
    const items = [];
    qtyInputs.forEach((input) => {
      const qty = parseInt(input.value, 10) || 0;
      if (qty > 0) {
        items.push({
          refId: input.dataset.refId,
          quantity: qty,
        });
      }
    });
    return items;
  }

  function updateSubtotal() {
    let total = 0;
    qtyInputs.forEach((input) => {
      const qty = parseInt(input.value, 10) || 0;
      const row = input.closest('tr');
      const price = parseFloat(row.dataset.price) || 0;
      total += price * qty;
    });
    if (subtotalEl) {
      subtotalEl.textContent = `$${total.toFixed(2)}`;
    }
    checkoutBtn.disabled = total === 0;
  }

  // Enforce max quantity (available stock)
  qtyInputs.forEach((input) => {
    input.addEventListener('input', () => {
      const max = parseInt(input.getAttribute('max'), 10) || 0;
      let val = parseInt(input.value, 10) || 0;
      if (val > max) {
        input.value = max;
        val = max;
      }
      if (val < 0) {
        input.value = 0;
      }
      updateSubtotal();
    });
  });

  checkoutBtn.addEventListener('click', async () => {
    const items = getItems();
    if (items.length === 0) return;

    errorEl.style.display = 'none';
    checkoutBtn.disabled = true;
    loadingEl.style.display = 'block';

    try {
      const res = await fetch('/shop/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
      checkoutBtn.disabled = false;
      loadingEl.style.display = 'none';
    }
  });
})();
