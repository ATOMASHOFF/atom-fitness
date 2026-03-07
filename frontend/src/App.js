import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import MembersPage from './pages/admin/MembersPage';
import MemberDetailPage from './pages/admin/MemberDetailPage';
import AddMemberPage from './pages/admin/AddMemberPage';
import EditMemberPage from './pages/admin/EditMemberPage';
import SubscriptionsPage from './pages/admin/SubscriptionsPage';
import PlansPage from './pages/admin/PlansPage';
import AttendancePage from './pages/admin/AttendancePage';
import GymQRPage from './pages/admin/GymQRPage';
import StaffPage from './pages/admin/StaffPage';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffMembersPage from './pages/staff/StaffMembersPage';
import StaffScanPage from './pages/staff/StaffScanPage';
import StaffAttendancePage from './pages/staff/StaffAttendancePage';
import StaffSubscriptionsPage from './pages/staff/StaffSubscriptionsPage';

// Member Pages
import MemberDashboard from './pages/member/MemberDashboard';
import CheckInPage from './pages/member/CheckInPage';
import MemberAttendancePage from './pages/member/MemberAttendancePage';
import ProfilePage from './pages/member/ProfilePage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0a0e1a',
        color: '#ff3d00',
        fontSize: '24px'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectMap = {
      admin: '/admin',
      staff: '/staff',
      member: '/member'
    };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0a0e1a',
        color: '#ff3d00',
        fontSize: '24px'
      }}>
        Loading...
      </div>
    );
  }

  if (user) {
    const redirectMap = {
      admin: '/admin',
      staff: '/staff',
      member: '/member'
    };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/members" element={<ProtectedRoute allowedRoles={['admin']}><MembersPage /></ProtectedRoute>} />
      <Route path="/admin/members/add" element={<ProtectedRoute allowedRoles={['admin']}><AddMemberPage /></ProtectedRoute>} />
      <Route path="/admin/members/:id" element={<ProtectedRoute allowedRoles={['admin']}><MemberDetailPage /></ProtectedRoute>} />
      <Route path="/admin/members/:id/edit" element={<ProtectedRoute allowedRoles={['admin']}><EditMemberPage /></ProtectedRoute>} />
      <Route path="/admin/subscriptions" element={<ProtectedRoute allowedRoles={['admin']}><SubscriptionsPage /></ProtectedRoute>} />
      <Route path="/admin/plans" element={<ProtectedRoute allowedRoles={['admin']}><PlansPage /></ProtectedRoute>} />
      <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['admin']}><AttendancePage /></ProtectedRoute>} />
      <Route path="/admin/gym-qr" element={<ProtectedRoute allowedRoles={['admin']}><GymQRPage /></ProtectedRoute>} />
      <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['admin']}><StaffPage /></ProtectedRoute>} />

      {/* Staff Routes */}
      <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />
      <Route path="/staff/members" element={<ProtectedRoute allowedRoles={['staff']}><StaffMembersPage /></ProtectedRoute>} />
      <Route path="/staff/scan" element={<ProtectedRoute allowedRoles={['staff']}><StaffScanPage /></ProtectedRoute>} />
      <Route path="/staff/attendance" element={<ProtectedRoute allowedRoles={['staff']}><StaffAttendancePage /></ProtectedRoute>} />
      <Route path="/staff/subscriptions" element={<ProtectedRoute allowedRoles={['staff']}><StaffSubscriptionsPage /></ProtectedRoute>} />

      {/* Member Routes */}
      <Route path="/member" element={<ProtectedRoute allowedRoles={['member']}><MemberDashboard /></ProtectedRoute>} />
      <Route path="/member/checkin" element={<ProtectedRoute allowedRoles={['member']}><CheckInPage /></ProtectedRoute>} />
      <Route path="/member/attendance" element={<ProtectedRoute allowedRoles={['member']}><MemberAttendancePage /></ProtectedRoute>} />
      <Route path="/member/profile" element={<ProtectedRoute allowedRoles={['member']}><ProfilePage /></ProtectedRoute>} />

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            theme="dark"
          />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;