/* global driver */

(function () {
  const STATUS_LABELS = {
    confirmed: 'Confirmed',
    filling: 'Being Prepared',
    'out-for-delivery': 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  const FULFILLMENT_LABELS = {
    'in-city': 'In-City',
    'outside-city': 'Outside City',
    'outside-county': 'Outside County',
  };

  function fmtCurrency(n) {
    if (n == null || isNaN(n)) return '$0.00';
    return `$${Number(n).toFixed(2)}`;
  }

  function getCSRF() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }

  async function apiPost(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCSRF(),
      },
      body: JSON.stringify(body || {}),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return res.json();
  }

  function buildVariationList(variations) {
    if (!variations || !variations.length) return '<li>No variations</li>';
    return variations
      .map((v) => {
        const parts = [];
        if (v.baseRecipe && v.baseRecipe.name) parts.push(v.baseRecipe.name);
        if (v.frosting && v.frosting.name) parts.push(v.frosting.name);
        if (v.toppings && v.toppings.length) parts.push(v.toppings.map((t) => t.name).join(', '));
        return `<li><span class="qty-badge">${v.quantity}</span>${parts.join(' + ')}</li>`;
      })
      .join('');
  }

  function buildMapsUrl(addr) {
    if (!addr) return '#';
    const q = encodeURIComponent([addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', '));
    return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  }

  function buildActionButtons(order) {
    const id = order._id;
    const buttons = [];
    if (order.status === 'confirmed') {
      buttons.push(`<button class="btn btn-warning btn-sm" onclick="driver.markFilling('${id}')">Mark Filling</button>`);
    }
    if (order.status === 'filling') {
      buttons.push(`<button class="btn btn-info btn-sm" onclick="driver.markOutForDelivery('${id}')">Mark Out for Delivery</button>`);
    }
    if (order.status === 'out-for-delivery') {
      buttons.push(`<button class="btn btn-success btn-sm" onclick="driver.markDelivered('${id}')">Mark Delivered</button>`);
    }
    return buttons.join('');
  }

  function renderCard(order) {
    const statusClass = `status-${order.status}`;
    const label = STATUS_LABELS[order.status] || order.status;
    const fulfillLabel = FULFILLMENT_LABELS[order.fulfillmentType] || order.fulfillmentType;
    const addr = order.deliveryAddress;
    const mapsUrl = buildMapsUrl(addr);
    const addrLine = addr ? `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}` : '';

    const distLine = order.distanceMiles ? `<small style="color:#6b4f3a">${order.distanceMiles} mi</small>` : '';

    return `
      <div class="delivery-card" data-order-id="${order._id}">
        <div class="delivery-card-header">
          <div>
            <strong style="color:#f4e9d8">${order.customerName}</strong>
            <span style="color:#6b4f3a;font-size:0.8rem;margin-left:0.5rem">${order.confirmationNumber || ''}</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem">
            <span style="color:#a89a88;font-size:0.8rem">${fulfillLabel}</span>
            <span class="status-badge ${statusClass}">${label}</span>
          </div>
        </div>
        <div class="delivery-card-body">
          ${
            addrLine
              ? `
            <div style="margin-bottom:0.5rem">
              <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
                 style="color:#c24a1a;text-decoration:none;font-size:0.9rem">
                📍 ${addrLine}
              </a>
              ${distLine}
            </div>
          `
              : ''
          }
          <div style="font-size:0.8rem;color:#6b4f3a;margin-bottom:0.25rem">
            ${order.totalQuantity} donuts &bull; ${fmtCurrency(order.total)}
          </div>
          <ul class="variation-list">
            ${buildVariationList(order.variations)}
          </ul>
        </div>
        <div class="delivery-card-footer">
          ${buildActionButtons(order)}
        </div>
      </div>
    `;
  }

  async function loadDeliveries() {
    const container = document.getElementById('driver-cards');
    container.innerHTML = '<div class="loading-msg">Loading…</div>';
    try {
      const res = await fetch('/special-orders/driver/api/deliveries');
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const orders = data.orders || [];
      if (!orders.length) {
        container.innerHTML = '<div class="no-deliveries">No deliveries scheduled for today.</div>';
        return;
      }
      container.innerHTML = orders.map(renderCard).join('');
    } catch (err) {
      container.innerHTML = `<div class="no-deliveries" style="color:#c24a1a">Error: ${err.message}</div>`;
    }
  }

  async function markFilling(id) {
    try {
      await apiPost(`/special-orders/driver/orders/${id}/filling`);
      loadDeliveries();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function markOutForDelivery(id) {
    try {
      await apiPost(`/special-orders/driver/orders/${id}/out-for-delivery`);
      loadDeliveries();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function markDelivered(id) {
    try {
      await apiPost(`/special-orders/driver/orders/${id}/delivered`);
      loadDeliveries();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  // Expose globally so inline onclick handlers in the pug template work
  window.driver = { loadDeliveries, markFilling, markOutForDelivery, markDelivered };

  // Initial load
  loadDeliveries();
})();
