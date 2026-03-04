import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { formatDate, getDaysRemaining, getInitials, formatCurrency } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const MemberDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/auth/me');
        setData(res.data.user);
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
    </div>
  );

  const days = getDaysRemaining(data?.end_date);
  const isActive = data?.subscription_status === 'active' && days >= 0;
  const isExpiring = isActive && days <= 7;

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">My Dashboard</h1>
      </div>

      <div className="page-content">
        {/* Welcome */}
        <div className="card mb-16" style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'linear-gradient(135deg, var(--bg-card), var(--bg-hover))' }}>
          <div className="user-avatar" style={{ width: '64px', height: '64px', fontSize: '24px' }}>
            {getInitials(data?.name || user?.name)}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700' }}>
              Welcome back, {data?.name?.split(' ')[0] || 'Member'}!
            </div>
            <div className="text-muted text-sm">Member since {formatDate(data?.created_at)}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span className={`badge ${isActive ? 'badge-active' : 'badge-expired'}`} style={{ fontSize: '13px', padding: '6px 14px' }}>
              {isActive ? '✅ ACTIVE' : '❌ INACTIVE'}
            </span>
          </div>
        </div>

        {isExpiring && (
          <div className="alert alert-warning mb-16">
            ⚠️ Your membership expires in <strong>{days} day{days !== 1 ? 's' : ''}</strong> ({formatDate(data?.end_date)}). Please renew soon!
          </div>
        )}

        {!isActive && (
          <div className="alert alert-danger mb-16">
            ❌ Your membership has expired or is inactive. Please contact the gym to renew.
          </div>
        )}

        <div className="grid-2">
          {/* Membership Status */}
          <div className="card">
            <div className="section-title mb-16">📋 Membership Status</div>
            {data?.plan_name ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Plan</span>
                  <span className="fw-600">{data.plan_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Start Date</span>
                  <span>{formatDate(data.start_date)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Expiry Date</span>
                  <span className={days < 0 ? 'text-red' : days <= 7 ? 'text-yellow' : 'text-green'}>{formatDate(data.end_date)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted">Days Remaining</span>
                  <span className={`days-pill ${days < 0 ? 'expired' : days <= 7 ? 'warn' : 'ok'}`}>
                    {days < 0 ? 'Expired' : `${days} days`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Status</span>
                  <span className={`badge ${isActive ? 'badge-active' : 'badge-expired'}`}>
                    {isActive ? 'Active' : 'Expired'}
                  </span>
                </div>

                {/* Progress bar */}
                {data.start_date && data.end_date && days >= 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span className="text-xs text-muted">Time Elapsed</span>
                      <span className="text-xs text-muted">
                        {Math.max(0, data.duration_days - days)}/{data.duration_days} days
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, ((data.duration_days - days) / data.duration_days) * 100)}%`,
                        background: days <= 7 ? 'var(--yellow)' : 'var(--accent)',
                        borderRadius: '3px',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="alert alert-warning">
                No active membership plan. Contact the gym to activate.
              </div>
            )}
          </div>

          {/* Check-In Info */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="section-title mb-16">📷 Check In</div>
            {isActive ? (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <div className="text-sm text-muted mb-16">Membership is active</div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/member/checkin')}>
                  📷 Scan Gym QR to Check In
                </button>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '30px' }}>
                <div className="empty-state-icon">❌</div>
                <div className="text-muted text-sm">
                  {isActive ? 'Loading...' : 'Check-in available after plan activation'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="card mt-16">
          <div className="section-title mb-16">Quick Links</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/member/checkin')}>📷 Check In Now</button>
            <button className="btn btn-secondary" onClick={() => navigate('/member/attendance')}>📊 Attendance History</button>
            <button className="btn btn-secondary" onClick={() => navigate('/member/profile')}>👤 My Profile</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberDashboard;
