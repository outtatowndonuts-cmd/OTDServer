import { useState, useEffect } from 'react';

export default function Settings({ api }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    api('/admin/api/settings')
      .then((res) => {
        if (!res.ok) throw new Error(res.error || 'Failed to load');
        setSettings(res.settings);
      })
      .catch((e) => setError(e.message));
  }, []);

  const handleToggle = async (field, value) => {
    setSaving(true);
    setSavedMsg('');
    setError('');
    try {
      const res = await api('/admin/api/settings', {
        method: 'POST',
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error(res.error || 'Failed to save');
      setSettings(res.settings);
      setSavedMsg('Saved.');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (error && !settings) return <div className="error-msg">{error}</div>;
  if (!settings) return <div className="loading">Loading settings…</div>;

  return (
    <>
      <h2 className="section-title">Settings</h2>
      {error && <div className="error-msg">{error}</div>}
      {savedMsg && <div style={{ color: '#6ee7b7', background: '#064e3b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>{savedMsg}</div>}

      <div style={{ background: '#1e2130', border: '1px solid #2a2d3a', borderRadius: 12, padding: '20px 24px', maxWidth: 560 }}>
        <h3 style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>Online Shop</h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Preorders (Pickup Orders)</div>
            <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Allow customers to place pickup orders through the shop. When off, visitors see a message directing them to the flea market.</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: saving ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
            <span style={{ fontSize: '0.85rem', color: settings.preordersEnabled !== false ? '#6ee7b7' : '#9ca3af' }}>{settings.preordersEnabled !== false ? 'On' : 'Off'}</span>
            <div
              onClick={() => !saving && handleToggle('preordersEnabled', settings.preordersEnabled === false ? true : false)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: settings.preordersEnabled !== false ? '#166534' : '#374151',
                position: 'relative',
                transition: 'background 0.2s',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
              role="switch"
              aria-checked={settings.preordersEnabled !== false}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && !saving && handleToggle('preordersEnabled', settings.preordersEnabled === false ? true : false)}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: settings.preordersEnabled !== false ? 23 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </div>
          </label>
        </div>
      </div>
    </>
  );
}
