import { useState, useEffect } from 'react';

const statusBadge = (status) => {
  const cls = status === 'replied' ? 'badge-green' : status === 'read' ? 'badge-blue' : 'badge-yellow';
  return <span className={`badge ${cls}`}>{status}</span>;
};

export default function ContactMessages({ api }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const load = (status = '') => {
    setLoading(true);
    setError('');
    const qs = status ? `?status=${status}` : '';
    api(`/admin/api/contacts${qs}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.error || 'Failed to load');
        setMessages(res.messages);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(filterStatus);
  }, [filterStatus]);

  const openMessage = async (msg) => {
    if (expanded && expanded._id === msg._id) {
      setExpanded(null);
      setReply('');
      return;
    }
    setExpanded(msg);
    setReply('');

    if (msg.status === 'new') {
      try {
        const res = await api(`/admin/api/contacts/${msg._id}/read`, { method: 'POST', body: '{}' });
        if (res.ok) {
          setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, status: 'read' } : m)));
          setExpanded((prev) => (prev && prev._id === msg._id ? { ...prev, status: 'read' } : prev));
        }
      } catch (_) {
        // non-critical
      }
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !expanded) return;
    setSending(true);
    setError('');
    try {
      const res = await api(`/admin/api/contacts/${expanded._id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: reply.trim() }),
      });
      if (!res.ok) throw new Error(res.error || 'Failed to send reply');
      const updated = res.message;
      setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      setExpanded(updated);
      setReply('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const newCount = messages.filter((m) => m.status === 'new').length;

  return (
    <>
      <h2 className="section-title">
        Contact Messages
        {newCount > 0 && (
          <span className="badge badge-yellow" style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>
            {newCount} new
          </span>
        )}
      </h2>

      <div className="filter-bar">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
        <button onClick={() => load(filterStatus)}>Refresh</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <div className="loading">Loading messages…</div>
      ) : messages.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>No messages found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>From</th>
              <th>Email</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {messages.map((msg) => (
              <>
                <tr key={msg._id} style={{ cursor: 'pointer', fontWeight: msg.status === 'new' ? 700 : 400 }} onClick={() => openMessage(msg)}>
                  <td>{statusBadge(msg.status)}</td>
                  <td>{msg.name}</td>
                  <td>{msg.email}</td>
                  <td>{new Date(msg.createdAt).toLocaleString()}</td>
                  <td style={{ color: '#60a5fa' }}>{expanded && expanded._id === msg._id ? '▲ Close' : '▼ Open'}</td>
                </tr>
                {expanded && expanded._id === msg._id && (
                  <tr key={`${msg._id}-detail`}>
                    <td colSpan={5}>
                      <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '6px', marginBottom: '0.5rem' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Message:</p>
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: '#e2e8f0' }}>{expanded.message}</pre>

                        {expanded.reply && (
                          <div style={{ marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                            <p style={{ fontWeight: 600, color: '#86efac', marginBottom: '0.25rem' }}>
                              Your reply <span style={{ fontWeight: 400, color: '#9ca3af' }}>({new Date(expanded.repliedAt).toLocaleString()})</span>:
                            </p>
                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: '#e2e8f0' }}>{expanded.reply}</pre>
                          </div>
                        )}

                        {expanded.status !== 'replied' && (
                          <div style={{ marginTop: '1rem' }}>
                            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Reply via email:</p>
                            <textarea
                              rows={5}
                              style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '4px', padding: '0.5rem', resize: 'vertical' }}
                              value={reply}
                              onChange={(e) => setReply(e.target.value)}
                              placeholder={`Reply to ${expanded.name}…`}
                            />
                            <button style={{ marginTop: '0.5rem' }} onClick={sendReply} disabled={sending || !reply.trim()}>
                              {sending ? 'Sending…' : `Send from support@outtatowndonuts.lol`}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
