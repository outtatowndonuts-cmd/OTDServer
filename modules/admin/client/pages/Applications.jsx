import { useState, useEffect } from 'react';

const ROLES = ['staff', 'manager', 'admin'];

const statusBadge = (status) => {
  const cls = status === 'active' ? 'badge-green' : status === 'denied' ? 'badge-red' : status === 'suspended' ? 'badge-orange' : 'badge-yellow';
  return <span className={`badge ${cls}`}>{status}</span>;
};

export default function Applications({ api }) {
  const [tab, setTab] = useState('pending');
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);

  const load = (status) => {
    setLoading(true);
    setError('');
    api(`/admin/api/applications?status=${status}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.error || 'Failed to load');
        setApps(res.applications);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(tab);
  }, [tab]);

  const approve = async (id, role) => {
    setWorking(id);
    setError('');
    try {
      const res = await api(`/admin/api/applications/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error(res.error || 'Failed');
      setApps((prev) => prev.filter((a) => a._id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking(null);
    }
  };

  const deny = async (id) => {
    if (!confirm('Deny this application?')) return;
    setWorking(id);
    setError('');
    try {
      const res = await api(`/admin/api/applications/${id}/deny`, { method: 'POST', body: '{}' });
      if (!res.ok) throw new Error(res.error || 'Failed');
      setApps((prev) => prev.filter((a) => a._id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking(null);
    }
  };

  return (
    <>
      <h2 className="section-title">Applications</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['pending', 'active', 'suspended', 'denied'].map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            style={{
              padding: '4px 14px',
              borderRadius: 4,
              border: '1px solid #c24a1a',
              background: tab === s ? '#c24a1a' : 'transparent',
              color: tab === s ? '#f4e9d8' : '#c24a1a',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <div className="loading">Loading…</div>
      ) : apps.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>No {tab} applications.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Note</th>
              <th>Applied</th>
              {tab === 'pending' && <th>Approve As</th>}
              {tab === 'pending' && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <ApplicantRow key={app._id} app={app} tab={tab} working={working} onApprove={approve} onDeny={deny} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function ApplicantRow({ app, tab, working, onApprove, onDeny }) {
  const [role, setRole] = useState('staff');
  const busy = working === app._id;

  return (
    <tr>
      <td>{app.profile?.name || '—'}</td>
      <td>{app.email}</td>
      <td>
        <span className={`badge ${app.status === 'active' ? 'badge-green' : app.status === 'denied' ? 'badge-red' : app.status === 'suspended' ? 'badge-orange' : 'badge-yellow'}`}>{app.status}</span>
      </td>
      <td style={{ maxWidth: 220, whiteSpace: 'pre-wrap', fontSize: '0.82rem', color: '#9ca3af' }}>{app.applicationNote || '—'}</td>
      <td>{new Date(app.createdAt).toLocaleDateString()}</td>
      {tab === 'pending' && (
        <td>
          <select className="role-select" value={role} disabled={busy} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </td>
      )}
      {tab === 'pending' && (
        <td style={{ display: 'flex', gap: 6 }}>
          <button className="btn-action btn-approve" disabled={busy} onClick={() => onApprove(app._id, role)}>
            {busy ? '…' : 'Approve'}
          </button>
          <button className="btn-action btn-deny" disabled={busy} onClick={() => onDeny(app._id)}>
            Deny
          </button>
        </td>
      )}
    </tr>
  );
}
