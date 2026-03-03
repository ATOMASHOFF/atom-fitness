import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { formatDate, formatDateTime, formatCurrency, getDaysRemaining } from '../../utils/helpers';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/members/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="loading-full">
      <div className="loading-spinner" style={{ width: '32px', height: '32px' }} />
      <span>Loading dashboard...</span>
    </div>
  );

  const { stats, recentAttendance, expiringSoon } = data || {};

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/gym-qr')}>
            🎫 Gym QR Code
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/members/new')}>
            ➕ Add Member
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats?.totalMembers || 0}</div>
            <div className="stat-label">Total Members</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">✅</div>
            <div className="stat-value text-green">{stats?.activeMembers || 0}</div>
            <div className="stat-label">Active Members</div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon">❌</div>
            <div className="stat-value text-red">{stats?.expiredMembers || 0}</div>
            <div className="stat-label">Expired / No Plan</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-icon">📍</div>
            <div className="stat-value text-accent" style={{ color: 'var(--blue)' }}>{stats?.todayAttendance || 0}</div>
            <div className="stat-label">Today's Check-ins</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-icon">💰</div>
            <div className="stat-value" style={{ fontSize: '20px', color: 'var(--yellow)' }}>{formatCurrency(stats?.monthRevenue)}</div>
            <div className="stat-label">This Month Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-value" style={{ fontSize: '20px' }}>{formatCurrency(stats?.totalRevenue)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Expiring Soon */}
          <div className="card">
            <div className="section-header">
              <span className="section-title" style={{ color: 'var(--yellow)' }}>⚠️ Expiring Soon</span>
              <span className="text-muted text-xs">Within 7 days</span>
            </div>
            {expiringSoon?.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>
                <p className="text-muted text-sm">No expiring memberships</p>
              </div>
            ) : (
              <div>
                {expiringSoon?.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: i < expiringSoon.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <div>
                      <div className="fw-600" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{m.name}</div>
                      <div className="text-xs text-muted">{m.plan_name} · Expires {formatDate(m.end_date)}</div>
                    </div>
                    <span className={`days-pill ${m.days_remaining <= 3 ? 'warn' : 'ok'}`}>
                      {m.days_remaining}d
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Attendance */}
          <div className="card">
            <div className="section-header">
              <span className="section-title">📊 Recent Check-ins</span>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/attendance')}>View All</button>
            </div>
            {recentAttendance?.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>
                <p className="text-muted text-sm">No attendance records yet</p>
              </div>
            ) : (
              <div>
                {recentAttendance?.map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: i < recentAttendance.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <div>
                      <div className="fw-600" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{a.name}</div>
                      <div className="text-xs text-muted">{a.email}</div>
                    </div>
                    <span className="text-xs text-muted">{formatDateTime(a.check_in_time)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mt-24">
          <div className="section-title mb-16">Quick Actions</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/admin/members/new')}>➕ Add Member</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/activate')}>⚡ Activate Subscription</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/gym-qr')}>🎫 View Gym QR Code</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/plans')}>📋 Manage Plans</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/attendance')}>📊 Attendance Logs</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
