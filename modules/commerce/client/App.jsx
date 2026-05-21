import { createRoot } from 'react-dom/client';
import Layout from './components/Layout.jsx';
import StorefrontPage from './pages/StorefrontPage.jsx';
import PickupPage from './pages/PickupPage.jsx';
import CustomBoxesPage from './pages/CustomBoxesPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import ConfirmationPage from './pages/ConfirmationPage.jsx';
import OrderLookupPage from './pages/OrderLookupPage.jsx';

function getPage(pathname) {
  const p = pathname.replace(/\/$/, '');
  if (p === '/shop' || p === '') return StorefrontPage;
  if (p === '/shop/pickup') return PickupPage;
  if (p === '/shop/bundles') return CustomBoxesPage;
  if (p === '/shop/about') return AboutPage;
  if (p === '/shop/contact') return ContactPage;
  if (p === '/shop/confirmation') return ConfirmationPage;
  if (p === '/shop/order-lookup') return OrderLookupPage;
  return StorefrontPage;
}

function App() {
  const Page = getPage(window.location.pathname);
  return (
    <Layout>
      <Page />
    </Layout>
  );
}

const root = createRoot(document.getElementById('commerce-root'));
root.render(<App />);
