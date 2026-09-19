import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auditAPI } from '../utils/api';

const AuditLogsPage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !user.roles || !user.roles.includes('admin')) return;
    (async () => {
      try {
        const { data } = await auditAPI.getLogs(200);
        setLogs(data.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load logs');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user || !user.roles || !user.roles.includes('admin')) {
    return <div className="container">Access denied. Admins only.</div>;
  }

  return (
    <div className="container">
      <h2>Audit Logs</h2>
      {loading ? <div>Loading...</div> : null}
      {error ? <div className="error">{error}</div> : null}
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Path</th>
              <th>Status</th>
              <th>Hash</th>
              <th>PrevHash</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l._id}>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td>{l.user ? `${l.user.name} <${l.user.email}>` : 'system'}</td>
                <td>{l.action}</td>
                <td>{l.path}</td>
                <td>{l.statusCode}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{l.hash?.slice(0, 16)}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{l.prevHash?.slice(0, 16)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogsPage;
