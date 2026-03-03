import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { formatDateTime } from '../../utils/helpers';

const MemberAttendance = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0 });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/logs', {
        params: { date_from: dateFrom, date_to: dateTo, limit: 100 }
      });
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Load attendance error:', err);
    } finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  // Group by month
  const grouped = logs.reduce((acc, log) => {
    const date = new Date(log.check_in_date);
    const key = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  // Streak calculation
  const streakDays = () => {
    if (logs.length === 0) return 0;
    const dates = [...new Set(logs.map(l => l.check_in_date))].sort().reverse();
    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);
    
    for (const dateStr of dates) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      const diff = Math.round((current - date) / (1000 * 60 * 60 * 24));
      if (diff === 0 || diff === 1) {
        streak++;
        current = date;
      } else break;
    }
    return streak;
  };

  const streak = streakDays();
  const thisMonthCount = logs.filter(l => {
    const d = new Date(l.check_in_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">My Attendance</h1>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
          <div className="stat-card blue">
            <div className="stat-icon">📊</div>
            <div className="stat-value" style={{ color: 'var(--blue)' }}>{pagination.total}</div>
            <div className="stat-label">Total Check-ins</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">📅</div>
            <div className="stat-value text-green">{thisMonthCount}</div>
            <div className="stat-label">This Month</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-value text-accent">{streak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-16">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label className="form-label">From Date</label>
              <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="form-label">To Date</label>
              <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <button className="btn btn-secondary" onClick={() => { setDateFrom(''); setDateTo(''); }}>
              Clear
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-full"><div className="loading-spinner" style={{ width: '32px', height: '32px' }} /></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No attendance records found</div>
            <p className="text-muted text-sm mt-8">Your check-in history will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(grouped).map(([month, monthLogs]) => (
              <div key={month} className="card">
                <div className="flex-between mb-12">
                  <div className="section-title">{month}</div>
                  <span className="badge badge-active">{monthLogs.length} visits</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {monthLogs.map((log, idx) => (
                    <div key={log.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: idx % 2 === 0 ? 'var(--bg-primary)' : 'transparent',
                      borderRadius: 'var(--radius)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>✅</span>
                        <div>
                          <div className="fw-600 text-sm" style={{ color: 'var(--text-primary)' }}>
                            {new Date(log.check_in_date).toLocaleDateString('en-IN', {
                              weekday: 'long', day: '2-digit', month: 'long'
                            })}
                          </div>
                          <div className="text-xs text-muted">Check-in: {new Date(log.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                        </div>
                      </div>
                      <span className={`badge ${log.scan_method === 'qr' ? 'badge-active' : 'badge-pending'}`}>
                        {log.scan_method === 'qr' ? '📱 QR' : '✋ Manual'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MemberAttendance;
