import { useState, useEffect, useRef } from 'react';
import { getMeta } from '../utils.js';

const DELIVERY_TYPES = new Set(['in-city', 'outside-city', 'outside-county']);

function useAddressAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 4) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const csrf = getMeta('csrf-token');
        const res = await fetch(`/special-orders/api/address-autocomplete?q=${encodeURIComponent(query)}`, { headers: { 'x-csrf-token': csrf } });
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 380);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return { query, setQuery, results, setResults, loading };
}

export default function StepCustomerInfo({ form, onChange, fulfillmentType }) {
  const isDelivery = DELIVERY_TYPES.has(fulfillmentType);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { query, setQuery, results, setResults, loading } = useAddressAutocomplete();
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function set(field, value) {
    onChange({ ...form, [field]: value });
  }

  function setAddress(field, value) {
    onChange({ ...form, deliveryAddress: { ...(form.deliveryAddress || {}), [field]: value } });
  }

  function selectSuggestion(s) {
    onChange({
      ...form,
      deliveryAddress: {
        ...(form.deliveryAddress || {}),
        street: s.street,
        city: s.city,
        state: s.state || 'TN',
        zip: s.zip,
      },
    });
    setQuery('');
    setResults([]);
    setDropdownOpen(false);
  }

  return (
    <div className="so-step">
      <h2 className="so-step-title">Step 4: Your Information</h2>

      <div className="so-field">
        <label className="so-label" htmlFor="customerName">
          Name <span className="text-danger">*</span>
        </label>
        <input id="customerName" type="text" className="form-control" maxLength={100} value={form.customerName || ''} onChange={(e) => set('customerName', e.target.value)} placeholder="Full name" />
      </div>

      <div className="so-field">
        <label className="so-label" htmlFor="customerEmail">
          Email
        </label>
        <input id="customerEmail" type="email" className="form-control" maxLength={254} value={form.customerEmail || ''} onChange={(e) => set('customerEmail', e.target.value)} placeholder="For your order confirmation" />
      </div>

      <div className="so-field">
        <label className="so-label" htmlFor="customerPhone">
          Phone
        </label>
        <input id="customerPhone" type="tel" className="form-control" maxLength={30} value={form.customerPhone || ''} onChange={(e) => set('customerPhone', e.target.value)} placeholder="Best number to reach you" />
      </div>

      {isDelivery && (
        <div className="so-address-section">
          <h3 className="so-address-title">Delivery Address</h3>

          {/* Address search / autocomplete */}
          <div className="so-field so-addr-search-wrap" ref={wrapperRef}>
            <label className="so-label" htmlFor="addrSearch">
              Search for your address
            </label>
            <div className="so-addr-search-input-wrap">
              <input
                id="addrSearch"
                type="text"
                className="form-control"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => {
                  if (results.length > 0) setDropdownOpen(true);
                }}
                placeholder="Start typing your street address…"
                autoComplete="off"
              />
              {loading && <span className="so-addr-search-spinner" />}
            </div>
            {dropdownOpen && results.length > 0 && (
              <ul className="so-addr-dropdown" role="listbox">
                {results.map((s, i) => (
                  <li key={i} role="option" className="so-addr-dropdown-item" onMouseDown={() => selectSuggestion(s)}>
                    <span className="so-addr-dropdown-street">{s.street}</span>
                    <span className="so-addr-dropdown-meta">{[s.city, s.state, s.zip].filter(Boolean).join(', ')}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="so-field-hint">Select a result to auto-fill the fields below, or enter manually.</div>
          </div>

          <div className="so-field">
            <label className="so-label" htmlFor="addrStreet">
              Street Address <span className="text-danger">*</span>
            </label>
            <input id="addrStreet" type="text" className="form-control" value={form.deliveryAddress?.street || ''} onChange={(e) => setAddress('street', e.target.value)} placeholder="123 Main St" />
          </div>
          <div className="row g-2">
            <div className="col-6 so-field">
              <label className="so-label" htmlFor="addrCity">
                City <span className="text-danger">*</span>
              </label>
              <input id="addrCity" type="text" className="form-control" value={form.deliveryAddress?.city || ''} onChange={(e) => setAddress('city', e.target.value)} placeholder="City" />
            </div>
            <div className="col-3 so-field">
              <label className="so-label" htmlFor="addrState">
                State
              </label>
              <input id="addrState" type="text" className="form-control" maxLength={2} value={form.deliveryAddress?.state || 'TN'} onChange={(e) => setAddress('state', e.target.value)} placeholder="TN" />
            </div>
            <div className="col-3 so-field">
              <label className="so-label" htmlFor="addrZip">
                Zip
              </label>
              <input id="addrZip" type="text" className="form-control" maxLength={10} value={form.deliveryAddress?.zip || ''} onChange={(e) => setAddress('zip', e.target.value)} placeholder="37030" />
            </div>
          </div>
          {fulfillmentType === 'outside-county' && (
            <div className="alert alert-info mt-2" role="alert">
              A mileage-based delivery fee will be calculated based on your address.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
