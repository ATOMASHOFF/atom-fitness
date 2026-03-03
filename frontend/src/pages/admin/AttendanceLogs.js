import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { formatDateTime } from '../../utils/helpers';

const AttendanceLogs = () => {
  const [logs, setLogs] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ member_id: '', date_from: '', date_to: '' });
  const [pagination, setPagination] = useState({ total: 0, page: 1 });

  const loadLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/logs', {
        params: { ...filters, page, limit: 50 }
      });
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadLogs(1); }, [loadLogs]);

  useEffect(() => {
    api.get('/members', { params: { limit: 200 } })
      .then(res => setMembers(res.data.members))
      .catch(() => {});
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadLogs(1);
  };

  const todayCount = logs.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return l.check_in_date === today || (l.check_in_date && l.check_in_date.startsWith(today));
  }).length;

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Attendance Logs</h1>
        <span className="text-muted text-sm">Total: {pagination.total} records</span>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="card mb-16">
          <form onSubmit={handleFilter}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1', minWidth: '180px' }}>
                <label className="form-label">Member</label>
                <select className="form-input" value={filters.member_id}
                  onChange={e => setFilters(f => ({ ...f, member_id: e.target.value }))}>
                  <option value="">All Members</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">From Date</label>
                <input type="date" className="form-input" value={filters.date_from}
                  onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">To Date</label>
                <input type="date" className="form-input" value={filters.date_to}
                  onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary">Filter</button>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setFilters({ member_id: '', date_from: '', date_to: '' });
                }}>Clear</button>
              </div>
            </div>
          </form>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div className="card" style={{ flex: 1, textAlign: 'center', padding: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--blue)' }}>{pagination.total}</div>
            <div className="text-xs text-muted">Total Records</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: 'center', padding: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--green)' }}>{todayCount}</div>
            <div className="text-xs text-muted">Showing Today</div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Member</th>
                <th>Plan</th>
                <th>Check-in Time</th>
                <th>Date</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loading-spinner" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <div className="empty-state-icon">📊</div>
                      <div className="empty-state-title">No attendance records found</div>
                    </div>
                  </td>
                </tr>
              ) : logs.map((log, idx) => (
                <tr key={log.id}>
                  <td className="text-muted text-sm">{idx + 1}</td>
                  <td>
                    <div className="name-cell">{log.name}</div>
                    <div className="text-xs text-muted">{log.email}</div>
                  </td>
                  <td>{log.plan_name || <span className="text-muted">-</span>}</td>
                  <td>{formatDateTime(log.check_in_time)}</td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(log.check_in_date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${log.scan_method === 'qr' ? 'badge-active' : 'badge-pending'}`}>
                      {log.scan_method === 'qr' ? '📱 QR' : '✋ Manual'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AttendanceLogs;
