import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';

const AdminDashboard = () => {
  const navigate = useNavigate();
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
        <h1 className="page-title">Admin Dashboard</h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/admin/members/add')}
          >
            ➕ Add Member
          </button>
        </div>
      </div>

      <div className="page-content">
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

          {stats?.totalRevenue !== null && (
            <>
              <div className="stat-card revenue">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-label">Total Revenue</div>
                  <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
                </div>
              </div>

              <div className="stat-card revenue">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-label">This Month</div>
                  <div className="stat-value">{formatCurrency(stats.monthRevenue)}</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="card mt-24">
          <div className="section-title mb-16">Quick Actions</div>
          <div className="quick-actions">
            <button 
              className="action-btn"
              onClick={() => navigate('/admin/pending')}
            >
              <span className="action-icon">📋</span>
              <span className="action-label">Pending Registrations</span>
            </button>
            
            <button 
              className="action-btn"
              onClick={() => navigate('/admin/members')}
            >
              <span className="action-icon">👥</span>
              <span className="action-label">View All Members</span>
            </button>
            
            <button 
              className="action-btn"
              onClick={() => navigate('/admin/staff')}
            >
              <span className="action-icon">👔</span>
              <span className="action-label">Manage Staff</span>
            </button>
            
            <button 
              className="action-btn"
              onClick={() => navigate('/admin/gym-qr')}
            >
              <span className="action-icon">🎯</span>
              <span className="action-label">Gym QR Code</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;