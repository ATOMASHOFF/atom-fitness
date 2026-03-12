import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Sidebar = () => {
  const { user, logout, hasPermission, isAdmin, isStaff, isMember } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Admin navigation
  const adminNav = [
    { path: '/admin', label: '📊 Dashboard', end: true },
    { path: '/admin/pending', label: '📋 Pending Approvals' },
    { path: '/admin/members', label: '👥 Members' },
    { path: '/admin/staff', label: '👔 Staff' },
    { path: '/admin/subscriptions', label: '💳 Subscriptions' },
    { path: '/admin/plans', label: '📋 Plans' },
    { path: '/admin/attendance', label: '📅 Attendance' },
    { path: '/admin/gym-qr', label: '🎯 Gym QR Code' },
  ];

  // Staff navigation
  const staffNav = [
    { path: '/staff', label: '📊 Dashboard', end: true },
    { 
      path: '/staff/members', 
      label: '👥 Members',
      show: hasPermission('can_view_members')
    },
    { 
      path: '/staff/subscriptions', 
      label: '💳 Subscriptions',
      show: hasPermission('can_view_subscriptions')
    },
    { 
      path: '/staff/attendance', 
      label: '📅 Attendance',
      show: hasPermission('can_view_attendance')
    },
    { 
      path: '/staff/scan', 
      label: '📷 Scan QR',
      show: hasPermission('can_scan_attendance')
    },
  ];

  // Member navigation
  const memberNav = [
    { path: '/member', label: '📊 Dashboard', end: true },
    { path: '/member/checkin', label: '📷 Check In' },
    { path: '/member/attendance', label: '📅 My Attendance' },
    { path: '/member/profile', label: '👤 Profile' },
  ];

  // Select nav items based on role
  let navItems = [];
  if (isAdmin) {
    navItems = adminNav;
  } else if (isStaff) {
    navItems = staffNav.filter(item => item.show !== false);
  } else if (isMember) {
    navItems = memberNav;
  }

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={closeMobileMenu}
        />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">⚡ ATOM</div>
          <div className="sidebar-subtitle">FITNESS</div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">
              {isAdmin && '👑 Admin'}
              {isStaff && '👔 Staff'}
              {isMember && '👤 Member'}
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;