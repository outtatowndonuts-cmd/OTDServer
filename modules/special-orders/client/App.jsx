import { createRoot } from 'react-dom/client';
import Layout from './components/Layout.jsx';
import SpecialOrderPage from './pages/SpecialOrderPage.jsx';
import ConfirmationPage from './pages/ConfirmationPage.jsx';
import OrderLookupPage from './pages/OrderLookupPage.jsx';

function getPage(pathname) {
  const p = pathname.replace(/\/$/, '');
  if (p === '/special-orders/confirmation') return ConfirmationPage;
  if (p === '/special-orders/order-lookup') return OrderLookupPage;
  return SpecialOrderPage;
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const cancelled = params.get('cancelled') === 'true';
  const Page = getPage(window.location.pathname);
  return (
    <Layout>
      <Page cancelled={cancelled} />
    </Layout>
  );
}

const root = createRoot(document.getElementById('special-orders-root'));
root.render(<App />);
