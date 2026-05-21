// Lightweight fetch wrapper that reads CSRF from the meta tag
export function getMeta(name) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || '';
}

export async function api(path, body) {
  const csrf = getMeta('csrf-token');
  const opts = {
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
  };
  if (body !== undefined) {
    opts.method = 'POST';
    opts.body = JSON.stringify(body);
  } else {
    opts.method = 'GET';
  }
  const res = await fetch(path, opts);
  const data = await res.json();
  if (!data.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status });
  return data;
}

export function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '$0.00';
  return `$${Number(n).toFixed(2)}`;
}

export const FULFILLMENT_LABELS = {
  'store-early': 'Store Pickup — 5:30 to 7:30 AM',
  'store-mid': 'Store Pickup — 9:00 to 10:00 AM',
  'in-city': 'Home Delivery — Inside City Limits',
  'outside-city': 'Home Delivery — Outside City / Inside County',
  'outside-county': 'Home Delivery — Outside Cannon County',
};

export const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  filling: 'Being Prepared',
  'out-for-delivery': 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
