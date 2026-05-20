import { useState, useEffect } from 'react';

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '$0.00';
  const s = n.toFixed(3);
  return `$${s.endsWith('0') ? n.toFixed(2) : s}`;
}

function StorefrontPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Outta Town Donuts';
    fetch('/shop/api/storefront')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const available = products.filter((p) => p.available > 0);

  return (
    <>
      {/* Hero Section */}
      <div className="otd-hero">
        <img className="otd-hero-logo" src="/commerce/otd-logo.png" alt="Outta Town Donuts" />
        <h1>Outta Town Donuts</h1>
        <p className="otd-tagline">Made by hand. Sold by hand.</p>
        <p className="otd-subtitle">Hand-shaped donuts, made fresh every morning in Woodbury, Tennessee. No cutters. No factories. Just real food, done right.</p>
        <a className="otd-btn otd-btn-primary otd-btn-large" href="/shop/pickup">
          Order for Pickup
        </a>
      </div>

      {/* Available Today */}
      <div className="otd-section">
        <div className="container">
          <div className="otd-section-header">
            <h2>Available Today</h2>
            <hr className="otd-divider" />
          </div>

          {loading ? (
            <div className="otd-text-center otd-py-5">
              <div className="otd-spinner" />
            </div>
          ) : available.length ? (
            <>
              <div className="otd-products">
                {available.map((product) => (
                  <div className="otd-product-card" key={product._id}>
                    <div className="otd-product-name">{product.name}</div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="otd-product-price">{fmtCurrency(product.price)}</span>
                      <div className="otd-product-stock">{product.available > 0 ? <span className="otd-badge otd-badge-available">{product.available} left</span> : <span className="otd-badge otd-badge-soldout">Sold out</span>}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="otd-text-center otd-mt-4">
                <a className="otd-btn otd-btn-primary" href="/shop/pickup">
                  Place an Order
                </a>
              </div>
            </>
          ) : (
            <div className="otd-text-center otd-py-5">
              <h3 className="otd-text-muted">Nothing available right now.</h3>
              <p className="otd-text-muted">Check back tomorrow morning &mdash; we make everything fresh.</p>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="otd-section otd-section-alt">
        <div className="container">
          <div className="otd-section-header">
            <h2>How It Works</h2>
            <hr className="otd-divider" />
          </div>
          <div className="otd-values">
            <div className="otd-value-item">
              <h3>Pick Your Donuts</h3>
              <p>Browse what&rsquo;s available today. Inventory is real &mdash; when it&rsquo;s gone, it&rsquo;s gone.</p>
            </div>
            <div className="otd-value-item">
              <h3>Place Your Order</h3>
              <p>Select your quantities and pay securely online. No account required.</p>
            </div>
            <div className="otd-value-item">
              <h3>Pick Up in Woodbury</h3>
              <p>Orders are available at our flea market booth. Made fresh, handed to you directly.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default StorefrontPage;
