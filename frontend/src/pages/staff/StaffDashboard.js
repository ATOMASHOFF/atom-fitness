import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/members/dashboard-stats');
      setStats(res.data.stats);
    } catch (err) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Staff Dashboard</h1>
        <div className="header-actions">
          {hasPermission('can_scan_attendance') && (
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/staff/scan')}
            >
              📷 Scan Member QR
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-label">Total Members</div>
              <div className="stat-value">{stats?.totalMembers || 0}</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-label">Active Subscriptions</div>
              <div className="stat-value">{stats?.activeMembers || 0}</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <div className="stat-label">Expired Members</div>
              <div className="stat-value">{stats?.expiredMembers || 0}</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-label">Today's Check-ins</div>
              <div className="stat-value">{stats?.todayAttendance || 0}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mt-24">
          <div className="section-title mb-16">Quick Actions</div>
          <div className="quick-actions">
            {hasPermission('can_view_members') && (
              <button 
                className="action-btn"
                onClick={() => navigate('/staff/members')}
              >
                <span className="action-icon">👥</span>
                <span className="action-label">View Members</span>
              </button>
            )}
            
            {hasPermission('can_scan_attendance') && (
              <button 
                className="action-btn"
                onClick={() => navigate('/staff/scan')}
              >
                <span className="action-icon">📷</span>
                <span className="action-label">Scan QR</span>
              </button>
            )}
            
            {hasPermission('can_view_attendance') && (
              <button 
                className="action-btn"
                onClick={() => navigate('/staff/attendance')}
              >
                <span className="action-icon">📅</span>
                <span className="action-label">Attendance Logs</span>
              </button>
            )}
            
            {hasPermission('can_add_members') && (
              <button 
                className="action-btn"
                onClick={() => navigate('/staff/members/add')}
              >
                <span className="action-icon">➕</span>
                <span className="action-label">Add Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Permission Notice */}
        <div className="card mt-24" style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)' }}>
          <div className="section-title mb-12">📋 Your Permissions</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            <div>✅ View Members: {hasPermission('can_view_members') ? 'Allowed' : 'Not Allowed'}</div>
            <div>✅ Add Members: {hasPermission('can_add_members') ? 'Allowed' : 'Not Allowed'}</div>
            <div>✅ Scan Attendance: {hasPermission('can_scan_attendance') ? 'Allowed' : 'Not Allowed'}</div>
            <div>✅ View Reports: {hasPermission('can_view_reports') ? 'Allowed' : 'Not Allowed'}</div>
            <div className="mt-12 text-muted">
              💡 Contact your gym admin to request additional permissions.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffDashboard;