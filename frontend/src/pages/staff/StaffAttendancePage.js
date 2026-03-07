import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';

const StaffAttendancePage = () => {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchLogs();
  }, [dateFilter]);

  const fetchLogs = async () => {
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;

      const res = await api.get('/attendance/logs', { params });
      setLogs(res.data.logs);
    } catch (err) {
      toast.error('Failed to load attendance logs');
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('can_view_attendance')) {
    return (
      <div className="page-content">
        <div className="alert alert-warning">
          ⚠️ You don't have permission to view attendance logs
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Attendance Logs</h1>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Filter by Date</label>
              <input
                type="date"
                className="form-input"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>No check-ins found</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div>{log.member_name}</div>
                        <div className="text-muted text-sm">{log.member_email}</div>
                      </td>
                      <td>{formatDate(log.check_in_date)}</td>
                      <td>{new Date(log.check_in_time).toLocaleTimeString()}</td>
                      <td>
                        <span className={`badge ${
                          log.scan_method === 'qr' ? 'badge-success' : 'badge-info'
                        }`}>
                          {log.scan_method === 'qr' ? '📱 QR Scan' : '👤 Manual'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffAttendancePage;