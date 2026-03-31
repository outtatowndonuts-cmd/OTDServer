import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Employees from './pages/Employees';

/* ── Simple hash-based router ─────────────────────────────────────── */
const RouterContext = createContext('/');

function useRoute() {
  return useContext(RouterContext);
}

function navigate(path) {
  window.location.hash = path;
}

/* ── CSRF + fetch helper ──────────────────────────────────────────── */
function getCsrf() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.content : '';
}

async function api(url, opts = {}) {
  const { headers: extraHeaders, ...rest } = opts;
  const headers = { 'x-csrf-token': getCsrf(), ...extraHeaders };
  if (rest.body && typeof rest.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { headers, ...rest });
  return res.json();
}

/* ── Navigation config ────────────────────────────────────────────── */
const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/orders', label: 'Orders', icon: '📦' },
  { path: '/inventory', label: 'Inventory', icon: '🏷️' },
  { path: '/employees', label: 'Employees', icon: '👥' },
];

/* ── App ──────────────────────────────────────────────────────────── */
export default function App() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.replace('#', '') || '/';
    return hash;
  });

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace('#', '') || '/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const renderPage = useCallback(() => {
    switch (route) {
      case '/orders':
        return <Orders api={api} />;
      case '/inventory':
        return <Inventory api={api} />;
      case '/employees':
        return <Employees api={api} />;
      default:
        return <Dashboard api={api} />;
    }
  }, [route]);

  return (
    <RouterContext.Provider value={route}>
      <div className="admin-shell">
        <header className="admin-topbar">
          <h1>OTD Admin</h1>
          <a href="/" className="exit-btn">
            Exit Admin
          </a>
        </header>
        <nav className="admin-sidebar">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.path}
              href={`#${item.path}`}
              className={route === item.path ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
            >
              {item.icon} {item.label}
            </a>
          ))}
        </nav>
        <main className="admin-content">{renderPage()}</main>
      </div>
    </RouterContext.Provider>
  );
}
