import { useState, useEffect } from 'react';

const roleBadge = (role) => {
  const cls = role === 'admin' ? 'badge-red' : role === 'manager' ? 'badge-blue' : 'badge-gray';
  return <span className={`badge ${cls}`}>{role}</span>;
};

const statusBadge = (status) => {
  const cls = status === 'active' ? 'badge-green' : status === 'denied' ? 'badge-red' : status === 'suspended' ? 'badge-orange' : 'badge-yellow';
  return <span className={`badge ${cls}`}>{status ?? 'active'}</span>;
};

export default function Employees({ api }) {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    api('/admin/api/employees')
      .then((res) => {
        if (!res.ok) throw new Error(res.error || 'Failed to load');
        setEmployees(res.employees);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (id, newRole) => {
    setSaving(id + '-role');
    setError('');
    try {
      const res = await api(`/admin/api/employees/${id}/role`, {
        method: 'POST',
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error(res.error || 'Failed to update');
      // role change may also flip status to active
      setEmployees((prev) => prev.map((emp) => (emp._id === id ? { ...emp, role: res.employee.role, status: res.employee.status } : emp)));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setSaving(id + '-status');
    setError('');
    try {
      const res = await api(`/admin/api/employees/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(res.error || 'Failed to update');
      setEmployees((prev) => prev.map((emp) => (emp._id === id ? { ...emp, status: res.employee.status } : emp)));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <h2 className="section-title">Employees</h2>
      {error && <div className="error-msg">{error}</div>}
      {loading ? (
        <div className="loading">Loading employees…</div>
      ) : employees.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>No users found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Change Role</th>
              <th>Status</th>
              <th>Change Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id}>
                <td>{emp.profile?.name || '—'}</td>
                <td>{emp.email}</td>
                <td>{roleBadge(emp.role || 'staff')}</td>
                <td>
                  <select className="role-select" value={emp.role || 'staff'} disabled={saving === emp._id + '-role'} onChange={(e) => handleRoleChange(emp._id, e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                  {saving === emp._id + '-role' && <span style={{ marginLeft: 6, color: '#9ca3af' }}>…</span>}
                </td>
                <td>{statusBadge(emp.status)}</td>
                <td>
                  <select className="role-select" value={emp.status || 'active'} disabled={saving === emp._id + '-status'} onChange={(e) => handleStatusChange(emp._id, e.target.value)}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                    <option value="denied">Denied</option>
                  </select>
                  {saving === emp._id + '-status' && <span style={{ marginLeft: 6, color: '#9ca3af' }}>…</span>}
                </td>
                <td>{new Date(emp.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
