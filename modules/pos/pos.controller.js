const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const posService = require('./pos.service');

// Cache HTML templates in memory
let htmlTemplate = null;
let customerHtmlTemplate = null;

function getHtml() {
  if (!htmlTemplate || process.env.NODE_ENV !== 'production') {
    htmlTemplate = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf-8');
  }
  return htmlTemplate;
}

function getCustomerHtml() {
  if (!customerHtmlTemplate || process.env.NODE_ENV !== 'production') {
    customerHtmlTemplate = fs.readFileSync(path.join(__dirname, 'public', 'customer.html'), 'utf-8');
  }
  return customerHtmlTemplate;
}

// ── Customer Display State ─────────────────────────────────────────────────
// Keyed by displayId — ephemeral, lives in process memory
// displayId -> { cart, subtotal, tax, total, status, checkoutUrl, qrDataUrl, orderId }
const displaySessions = new Map();

// displayId -> Set<ServerResponse> for SSE connections
const displayStreams = new Map();

function getDisplay(id) {
  if (!displaySessions.has(id)) {
    displaySessions.set(id, {
      cart: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      status: 'idle', // idle | cart | awaiting | paid
      checkoutUrl: null,
      qrDataUrl: null,
      orderId: null,
    });
  }
  return displaySessions.get(id);
}

function pushDisplayEvent(displayId, data) {
  const streams = displayStreams.get(displayId);
  if (!streams || streams.size === 0) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of streams) {
    try {
      res.write(payload);
      // compression middleware buffers writes — flush immediately so the
      // event reaches the client without waiting for the buffer to fill
      if (typeof res.flush === 'function') res.flush();
    } catch {
      streams.delete(res); // clean up dead connections
    }
  }
}

/**
 * GET /pos
 * Serve the React SPA shell with Stripe key + CSRF injected.
 */
exports.index = (req, res) => {
  let html = getHtml();
  const stripePkey = process.env.STRIPE_PKEY || '';
  const csrf = res.locals._csrf || '';
  // Inject meta tags before </head>
  const meta = `<meta name="stripe-pkey" content="${stripePkey}"><meta name="csrf-token" content="${csrf}">`;
  html = html.replace('</head>', `${meta}\n</head>`);
  res.type('html').send(html);
};

/**
 * GET /pos/api/csrf
 * Return the CSRF token so the React app can include it in POST requests.
 */
exports.getCsrf = (req, res) => {
  res.json({ csrfToken: res.locals._csrf });
};

/**
 * GET /pos/api/catalog
 * Return products for the POS grid.
 */
exports.getCatalog = async (req, res) => {
  try {
    const products = await posService.getCatalog();
    res.json({ ok: true, products });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /pos/api/settings
 * Return tax rate and defaults.
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = await posService.getSettings();
    res.json({ ok: true, settings });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * POST /pos/api/orders
 * Create a sale order from POS.
 */
exports.createOrder = async (req, res) => {
  try {
    const { items, subtotal, tax, total, paymentMethod } = req.body;
    const order = await posService.createSaleOrder({ items, subtotal, tax, total, paymentMethod });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

/**
 * POST /pos/api/orders/:id/complete
 * Complete (finalize) an order.
 */
exports.completeOrder = async (req, res) => {
  try {
    const order = await posService.completeOrder(req.params.id);
    res.json({ ok: true, order });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

/**
 * POST /pos/api/stripe/payment-intent
 * Create a Stripe Payment Intent for card payments.
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amountCents, orderId } = req.body;
    if (!amountCents || amountCents < 50) {
      return res.status(400).json({ ok: false, error: 'Amount must be at least $0.50' });
    }
    const paymentIntent = await posService.createPaymentIntent(amountCents, orderId);
    res.json({ ok: true, clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * POST /pos/api/stripe/confirm
 * Verify payment with Stripe, then mark order as paid.
 */
exports.confirmStripePayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ ok: false, error: 'Missing paymentIntentId' });
    }
    // Verify with Stripe that the payment actually succeeded
    const verified = await posService.verifyPaymentIntent(paymentIntentId);
    if (!verified) {
      return res.status(400).json({ ok: false, error: 'Payment not confirmed by Stripe' });
    }
    // Atomically mark paid + complete to avoid partial state
    const completed = await posService.markPaidAndComplete(orderId, { stripePaymentIntentId: paymentIntentId });
    res.json({ ok: true, order: completed });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

/**
 * POST /pos/api/orders/:id/cancel
 * Cancel a pending POS order.
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await posService.cancelOrder(req.params.id, { reason, user: req.user });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

/**
 * POST /pos/api/orders/:id/refund
 * Refund a completed POS order (processes Stripe refund for card payments).
 */
exports.refundOrder = async (req, res) => {
  try {
    const order = await posService.refundOrder(req.params.id, { user: req.user });
    res.json({ ok: true, order });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

// ── Order status (for clerk polling during Checkout Session) ────────────────

/**
 * GET /pos/api/orders/:id/status
 * Lightweight poll target — returns paymentStatus & status for a given order.
 */
exports.getOrderStatus = async (req, res) => {
  try {
    const order = await posService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: 'Order not found' });
    res.json({
      ok: true,
      paymentStatus: order.paymentStatus,
      status: order.status,
      total: order.total,
      orderId: order._id,
      items: order.items,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// ── Customer Display ────────────────────────────────────────────────────────

/**
 * GET /pos/display
 * Serve the customer-facing display page. No authentication required —
 * it is a physical display screen visible to customers at the counter.
 */
exports.getCustomerDisplay = (req, res) => {
  res.type('html').send(getCustomerHtml());
};

/**
 * GET /pos/api/display/:id/stream
 * SSE stream delivering real-time display state to the customer screen.
 * No authentication — the displayId acts as a non-guessable session token.
 */
exports.streamDisplay = (req, res) => {
  const { id } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering

  // Flush headers immediately — without this, the browser's EventSource won't
  // see the Content-Type and will close the connection before any data arrives
  res.flushHeaders();

  // Send current state immediately so the screen doesn't show stale data
  const state = getDisplay(id);
  res.write(`data: ${JSON.stringify(state)}\n\n`);
  if (typeof res.flush === 'function') res.flush();

  // Register stream
  if (!displayStreams.has(id)) displayStreams.set(id, new Set());
  displayStreams.get(id).add(res);

  // Keep-alive heartbeat every 25 s (prevents proxy timeouts)
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
      if (typeof res.flush === 'function') res.flush();
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const set = displayStreams.get(id);
    if (set) {
      set.delete(res);
      if (set.size === 0) displayStreams.delete(id);
    }
  });
};

/**
 * GET /pos/api/display/:id
 * REST fallback — returns current display state as JSON.
 */
exports.getDisplayState = (req, res) => {
  res.json(getDisplay(req.params.id));
};

/**
 * POST /pos/api/display/:id/cart
 * Clerk pushes the current cart to the customer display.
 */
exports.updateDisplayCart = (req, res) => {
  const { id } = req.params;
  const { cart, subtotal, tax, total, status: forcedStatus } = req.body;

  const state = getDisplay(id);
  const computedStatus = forcedStatus || (cart && cart.length > 0 ? 'cart' : 'idle');

  // Auto-syncs (debounced cart updates) must never downgrade payment states.
  // Explicit status values (e.g. 'idle' on cancel or new sale) always win.
  const isAutoSync = !forcedStatus;
  const shouldProtect = isAutoSync && (state.status === 'awaiting' || state.status === 'paid');

  Object.assign(state, {
    cart: cart || [],
    subtotal: subtotal || 0,
    tax: tax || 0,
    total: total || 0,
    status: shouldProtect ? state.status : computedStatus,
  });

  pushDisplayEvent(id, state);
  res.json({ ok: true });
};

/**
 * POST /pos/api/stripe/checkout-session
 * Creates a sale order + Stripe Checkout Session, generates a QR code,
 * and pushes the awaiting state to the customer display.
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const { items, subtotal, tax, total, displayId } = req.body;

    // 1. Create the sale order (paymentStatus: 'pending' for card)
    const order = await posService.createSaleOrder({ items, subtotal, tax, total, paymentMethod: 'card' });

    // 2. Build Stripe line_items — server recalculates to prevent tampering
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.nameSnapshot },
        unit_amount: Math.round((item.priceSnapshot || 0) * 100),
      },
      quantity: item.quantity,
    }));

    // Include tax as a separate line item so the Stripe receipt is accurate
    if (order.tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Tax' },
          unit_amount: Math.round(order.tax * 100),
        },
        quantity: 1,
      });
    }

    // 3. Create Stripe Checkout Session
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const session = await posService.createCheckoutSession({
      lineItems,
      metadata: {
        orderId: order._id.toString(),
        displayId: displayId || '',
      },
      successUrl: `${baseUrl}/pos/checkout/success?session_id={CHECKOUT_SESSION_ID}&display=${encodeURIComponent(displayId || '')}`,
      cancelUrl: `${baseUrl}/pos/checkout/cancel?display=${encodeURIComponent(displayId || '')}`,
    });

    // 4. Generate QR as a PNG data URL (white on dark background for visibility)
    const qrDataUrl = await QRCode.toDataURL(session.url, {
      width: 380,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });

    // 5. Update display state → customer screen shows QR
    if (displayId) {
      const displayState = getDisplay(displayId);
      Object.assign(displayState, {
        status: 'awaiting',
        checkoutUrl: session.url,
        qrDataUrl,
        orderId: order._id.toString(),
      });
      pushDisplayEvent(displayId, displayState);
    }

    res.json({ ok: true, orderId: order._id, sessionId: session.id });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET /pos/checkout/success
 * Stripe redirects the customer's browser here after a successful payment.
 * Verifies the session, marks the order paid+complete, updates the display,
 * then shows the customer a simple thank-you page.
 */
exports.checkoutSuccess = async (req, res) => {
  try {
    const { session_id, display } = req.query;
    if (!session_id) return res.status(400).send('Missing session_id');

    const session = await posService.getCheckoutSession(session_id);

    if (session.payment_status !== 'paid') {
      return res.send(thanksPage('⏳', 'Processing…', 'Your payment is processing. Please check with the cashier.'));
    }

    const orderId = session.metadata?.orderId;
    const displayId = session.metadata?.displayId || display;

    if (orderId) {
      try {
        await posService.markPaidAndComplete(orderId, {
          stripePaymentIntentId: session.payment_intent,
        });
      } catch (err) {
        // Idempotent — already completed is acceptable
        if (!err.message?.includes('already')) throw err;
      }
    }

    // Push 'paid' to display
    if (displayId) {
      const displayState = getDisplay(displayId);
      displayState.status = 'paid';
      pushDisplayEvent(displayId, displayState);
    }

    res.send(thanksPage('✅', 'Payment Complete!', 'Thank you for your order.'));
  } catch {
    res.status(500).send(thanksPage('❌', 'Something went wrong', 'Please check with the cashier.'));
  }
};

/**
 * GET /pos/checkout/cancel
 * Stripe redirects here when the customer cancels on the hosted checkout page.
 * Reverts the display back to the cart state.
 */
exports.checkoutCancel = (req, res) => {
  const { display } = req.query;

  if (display) {
    const displayState = getDisplay(display);
    if (displayState.status === 'awaiting') {
      displayState.status = displayState.cart.length > 0 ? 'cart' : 'idle';
      displayState.checkoutUrl = null;
      displayState.qrDataUrl = null;
      pushDisplayEvent(display, displayState);
    }
  }

  res.send(thanksPage('❌', 'Payment Cancelled', 'Please return to the counter.'));
};

/**
 * GET /pos/api/orders/pending
 * Returns paid-but-not-fulfilled orders so the cashier can see what needs to be filled.
 */
exports.getPendingQueue = async (req, res) => {
  try {
    const orders = await posService.getPendingQueue();
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
/**
 * POST /pos/api/orders/:id/fill
 * Mark a completed order as filled (bagged, ready for pickup).
 */
exports.fillOrder = async (req, res) => {
  try {
    const order = await posService.fillOrder(req.params.id);
    res.json({ ok: true, order });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

/**
 * POST /pos/api/orders/:id/deliver
 * Mark a filled order as delivered (handed to customer, out of queue).
 */
exports.deliverOrder = async (req, res) => {
  try {
    const order = await posService.deliverOrder(req.params.id);
    res.json({ ok: true, order });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

/**
 * GET /pos/api/custom-boxes
 * Return active custom box configurations for the POS box builder.
 */
exports.getCustomBoxConfigs = async (req, res) => {
  try {
    const configs = await posService.getCustomBoxConfigs();
    res.json({ ok: true, configs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
// ── Helpers ─────────────────────────────────────────────────────────────────

function thanksPage(icon, heading, body) {
  return `<!doctype html><html lang="en"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
  <style>
    body{background:#0f1117;color:#e8e8e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}
    .icon{font-size:5rem;margin-bottom:20px;}
    h1{font-size:2.2rem;margin-bottom:10px;}
    p{color:#888;font-size:1.1rem;}
  </style>
</head><body>
  <div><div class="icon">${icon}</div><h1>${heading}</h1><p>${body}</p></div>
</body></html>`;
}
