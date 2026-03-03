import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

const adminNav = [
  { label: 'Overview', section: null },
  { path: '/admin', icon: '⬡', label: 'Dashboard' },
  { label: 'Members', section: true },
  { path: '/admin/members', icon: '👥', label: 'All Members' },
  { path: '/admin/members/new', icon: '➕', label: 'Add Member' },
  { label: 'Subscriptions', section: true },
  { path: '/admin/plans', icon: '📋', label: 'Membership Plans' },
  { path: '/admin/activate', icon: '⚡', label: 'Activate Plan' },
  { label: 'Attendance', section: true },
  { path: '/admin/gym-qr', icon: '🎫', label: 'Gym QR Code' },
  { path: '/admin/attendance', icon: '📊', label: 'Attendance Logs' },
];

const memberNav = [
  { path: '/member', icon: '🏠', label: 'Dashboard' },
  { path: '/member/checkin', icon: '📷', label: 'Check In' },
  { path: '/member/profile', icon: '👤', label: 'My Profile' },
  { path: '/member/attendance', icon: '📊', label: 'My Attendance' },
];

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = isAdmin ? adminNav : memberNav;

  const isActive = (path) => {
    if (path === '/admin' || path === '/member') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">⚡ ATOM</div>
        <div className="logo-sub">FITNESS MANAGEMENT</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          if (item.section !== undefined && item.section !== null && item.label) {
            return (
              <div key={idx} className="nav-section-title">{item.label}</div>
            );
          }
          if (!item.path) return null;
          return (
            <div
              key={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <span>⎋</span> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
