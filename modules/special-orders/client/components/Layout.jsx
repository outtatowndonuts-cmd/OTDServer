import { useState, useEffect } from 'react';

const currentPath = window.location.pathname;
const isActive = (href) => currentPath === href || currentPath.startsWith(href + '/');

export default function Layout({ children }) {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const gaId = document.querySelector('meta[name="ga-id"]')?.getAttribute('content');
    if (gaId && !window.gtag) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', gaId);
    }
  }, []);

  return (
    <>
      <nav className={`otd-nav${navOpen ? ' open' : ''}`}>
        <div className="container">
          <div className="otd-nav-inner">
            <a className="otd-brand" href="/shop">
              <img className="otd-logo" src="/commerce/otd-logo.png" alt="Outta Town Donuts" />
              <span className="otd-brand-text">Outta Town Donuts</span>
            </a>
            <button className="otd-nav-toggle" type="button" onClick={() => setNavOpen((o) => !o)} aria-label="Toggle navigation">
              <span className="otd-nav-toggle-bar" />
              <span className="otd-nav-toggle-bar" />
              <span className="otd-nav-toggle-bar" />
            </button>
            <div className="otd-nav-links">
              <a className="otd-nav-link" href="/shop">
                Home
              </a>
              <a className="otd-nav-link" href="/shop/pickup">
                Pickup Orders
              </a>
              <a className="otd-nav-link" href="/shop/bundles">
                Bundles
              </a>
              <a className={`otd-nav-link${isActive('/special-orders') ? ' active' : ''}`} href="/special-orders">
                Special Orders
              </a>
              <a className={`otd-nav-link${isActive('/special-orders/order-lookup') ? ' active' : ''}`} href="/special-orders/order-lookup">
                Order Lookup
              </a>
              <a className="otd-nav-link" href="/shop/about">
                About Us
              </a>
              <a className="otd-nav-link" href="/shop/contact">
                Contact
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="otd-main flex-shrink-0 flex-grow-1">{children}</main>

      <footer className="otd-footer">
        <div className="container">
          <div className="otd-footer-inner">
            <div className="otd-footer-brand">
              <img className="otd-footer-logo" src="/commerce/otd-logo.png" alt="Outta Town Donuts" />
              <p className="otd-footer-tagline">Made by hand. Sold by hand.</p>
            </div>
            <div className="otd-footer-links">
              <div className="otd-footer-col">
                <h4>Shop</h4>
                <ul>
                  <li>
                    <a href="/shop">Home</a>
                  </li>
                  <li>
                    <a href="/shop/pickup">Pickup Orders</a>
                  </li>
                  <li>
                    <a href="/shop/bundles">Bundles</a>
                  </li>
                  <li>
                    <a href="/special-orders">Special Orders</a>
                  </li>
                </ul>
              </div>
              <div className="otd-footer-col">
                <h4>Company</h4>
                <ul>
                  <li>
                    <a href="/shop/about">About Us</a>
                  </li>
                  <li>
                    <a href="/shop/contact">Contact</a>
                  </li>
                </ul>
              </div>
              <div className="otd-footer-col">
                <h4>Legal</h4>
                <ul>
                  <li>
                    <a href="/privacy-policy.html">Privacy Policy</a>
                  </li>
                  <li>
                    <a href="/terms-of-use.html">Terms of Use</a>
                  </li>
                </ul>
              </div>
              <div className="otd-footer-col">
                <h4>Location</h4>
                <ul>
                  <li>Woodbury, Tennessee</li>
                  <li>Available at the local flea market</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
