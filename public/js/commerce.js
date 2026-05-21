/**
 * Commerce ordering page — client-side logic.
 * Reads CSRF token from meta tag, computes subtotal, submits order, redirects to Stripe.
 */
(function () {
  function fmtCurrency(n) {
    var s = n.toFixed(3);
    return `$${s.endsWith('0') ? n.toFixed(2) : s}`;
  }

  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

  // ─── Pickup order page ──────────────────────────────────────────────────────

  const qtyInputs = document.querySelectorAll('.qty-input');
  const subtotalEl = document.getElementById('order-subtotal');
  const checkoutBtn = document.getElementById('checkout-btn');
  const errorEl = document.getElementById('order-error');
  const loadingEl = document.getElementById('order-loading');

  if (checkoutBtn) {
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
        subtotalEl.textContent = fmtCurrency(total);
      }
      checkoutBtn.disabled = total === 0;
    }

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

    document.querySelectorAll('.qty-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = btn.closest('.qty-stepper').querySelector('.qty-input');
        const max = parseInt(input.getAttribute('max'), 10) || 0;
        let val = parseInt(input.value, 10) || 0;
        if (btn.classList.contains('qty-dec')) {
          val = Math.max(0, val - 1);
        } else {
          val = Math.min(max, val + 1);
        }
        input.value = val;
        updateSubtotal();
      });
    });

    checkoutBtn.addEventListener('click', async () => {
      const items = getItems();
      if (items.length === 0) return;

      const pickupNameInput = document.getElementById('pickup-name');
      const pickupName = pickupNameInput ? pickupNameInput.value.trim() : '';
      if (!pickupName) {
        errorEl.textContent = 'Please enter your name for pickup.';
        errorEl.style.display = 'block';
        if (pickupNameInput) pickupNameInput.focus();
        return;
      }

      errorEl.style.display = 'none';
      checkoutBtn.disabled = true;
      loadingEl.style.display = 'block';

      try {
        const res = await fetch('/shop/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
          body: JSON.stringify({ items, pickupName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create order');
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
  }

  // ─── Custom Box Builder page ────────────────────────────────────────────────

  const boxFlyout = document.getElementById('box-flyout');
  if (!boxFlyout) return; // not on custom-boxes page

  let activeBox = null; // { id, size, discountPct, name }

  const flyoutBoxName = document.getElementById('flyout-box-name');
  const flyoutCountEl = document.getElementById('flyout-count-label');
  const flyoutProgress = document.getElementById('flyout-progress-bar');
  const grossEl = document.getElementById('box-gross');
  const discountLabel = document.getElementById('box-discount-label');
  const discountAmtEl = document.getElementById('box-discount-amount');
  const totalEl = document.getElementById('box-total');
  const boxCheckoutBtn = document.getElementById('box-checkout-btn');
  const boxErrorEl = document.getElementById('box-order-error');
  const boxLoadingEl = document.getElementById('box-order-loading');
  const boxQtyInputs = document.querySelectorAll('.box-qty-input');

  function openFlyout() {
    boxFlyout.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeFlyout() {
    boxFlyout.classList.remove('open');
    document.body.style.overflow = '';
    activeBox = null;
  }

  function getTotalSelected() {
    var total = 0;
    boxQtyInputs.forEach(function (inp) {
      total += parseInt(inp.value, 10) || 0;
    });
    return total;
  }

  function updateBoxUI() {
    if (!activeBox) return;

    var selected = getTotalSelected();
    var remaining = activeBox.size - selected;
    var pct = Math.min(100, Math.round((selected / activeBox.size) * 100));

    flyoutProgress.style.width = `${pct}%`;

    if (remaining > 0) {
      flyoutCountEl.textContent = `${remaining} more item${remaining !== 1 ? 's' : ''} to fill your box`;
    } else if (selected === activeBox.size) {
      flyoutCountEl.textContent = 'Your box is full — ready to checkout!';
    } else {
      flyoutCountEl.textContent = `Too many — remove ${selected - activeBox.size}`;
    }

    var gross = 0;
    boxQtyInputs.forEach(function (inp) {
      var qty = parseInt(inp.value, 10) || 0;
      var row = inp.closest('tr');
      var price = parseFloat(row.dataset.price) || 0;
      gross += price * qty;
    });

    var discountAmt = Math.round(gross * (activeBox.discountPct / 100) * 100) / 100;
    var net = Math.max(0, Math.round((gross - discountAmt) * 100) / 100);

    grossEl.textContent = fmtCurrency(gross);
    discountLabel.textContent = `${activeBox.name} discount (${activeBox.discountPct}%):`;
    discountAmtEl.textContent = `-${fmtCurrency(discountAmt)}`;
    totalEl.textContent = fmtCurrency(net);

    var boxFull = selected === activeBox.size;
    if (boxFull) {
      boxCheckoutBtn.disabled = false;
      boxCheckoutBtn.textContent = 'Checkout';
    } else if (selected > activeBox.size) {
      boxCheckoutBtn.disabled = true;
      boxCheckoutBtn.textContent = `Too many items — remove ${selected - activeBox.size}`;
    } else {
      boxCheckoutBtn.disabled = true;
      boxCheckoutBtn.textContent = `Choose your items (${remaining} left)`;
    }
  }

  // Close on backdrop click
  document.getElementById('box-flyout-backdrop').addEventListener('click', closeFlyout);

  // Close on X button
  document.getElementById('flyout-close-btn').addEventListener('click', closeFlyout);

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && boxFlyout.classList.contains('open')) closeFlyout();
  });

  // Max-enforcement + live update
  boxQtyInputs.forEach(function (inp) {
    inp.addEventListener('input', function () {
      var max = parseInt(inp.getAttribute('max'), 10) || 0;
      var val = parseInt(inp.value, 10) || 0;
      if (val > max) {
        inp.value = max;
        val = max;
      }
      if (val < 0) {
        inp.value = 0;
        val = 0;
      }

      // Enforce box size cap
      if (activeBox) {
        var currentTotal = getTotalSelected();
        if (currentTotal > activeBox.size) {
          var over = currentTotal - activeBox.size;
          var curVal = parseInt(inp.value, 10) || 0;
          inp.value = Math.max(0, curVal - over);
        }
      }

      updateBoxUI();
    });
  });

  // Open flyout when a box card is clicked
  document.querySelectorAll('.otd-box-option').forEach(function (card) {
    card.addEventListener('click', function () {
      activeBox = {
        id: card.dataset.boxId,
        size: parseInt(card.dataset.boxSize, 10),
        discountPct: parseFloat(card.dataset.boxDiscount) || 0,
        name: card.dataset.boxName,
      };

      flyoutBoxName.textContent = `${activeBox.name} — ${activeBox.size} items`;

      // Reset inputs
      boxQtyInputs.forEach(function (inp) {
        inp.value = '0';
      });
      if (boxErrorEl) boxErrorEl.style.display = 'none';

      openFlyout();
      updateBoxUI();
    });
  });

  // Checkout
  boxCheckoutBtn.addEventListener('click', async function () {
    if (!activeBox) return;

    var pickupNameInput = document.getElementById('box-pickup-name');
    var pickupName = pickupNameInput ? pickupNameInput.value.trim() : '';
    if (!pickupName) {
      boxErrorEl.textContent = 'Please enter your name for pickup.';
      boxErrorEl.style.display = 'block';
      if (pickupNameInput) pickupNameInput.focus();
      return;
    }

    var selections = [];
    boxQtyInputs.forEach(function (inp) {
      var qty = parseInt(inp.value, 10) || 0;
      if (qty > 0) selections.push({ refId: inp.dataset.refId, quantity: qty });
    });

    if (boxErrorEl) boxErrorEl.style.display = 'none';
    boxCheckoutBtn.disabled = true;
    if (boxLoadingEl) boxLoadingEl.style.display = 'block';

    try {
      var res = await fetch('/shop/api/bundle-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ boxConfigId: activeBox.id, selections, pickupName }),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      if (boxErrorEl) {
        boxErrorEl.textContent = err.message;
        boxErrorEl.style.display = 'block';
      }
      boxCheckoutBtn.disabled = false;
      if (boxLoadingEl) boxLoadingEl.style.display = 'none';
      updateBoxUI();
    }
  });
})();
