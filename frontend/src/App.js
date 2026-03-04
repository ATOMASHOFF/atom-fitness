import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/shared/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/admin/Dashboard';
import MembersList from './pages/admin/MembersList';
import MemberForm from './pages/admin/MemberForm';
import MemberDetail from './pages/admin/MemberDetail';
import PlansPage from './pages/admin/PlansPage';
import ActivatePage from './pages/admin/ActivatePage';
import GymQRPage from './pages/admin/GymQRPage';
import AttendanceLogs from './pages/admin/AttendanceLogs';
import MemberDashboard from './pages/member/MemberDashboard';
import CheckInPage from './pages/member/CheckInPage';
import MemberProfile from './pages/member/MemberProfile';
import MemberAttendance from './pages/member/MemberAttendance';

// Protected route wrappers
const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-full" style={{ minHeight: '100vh' }}>
      <div className="loading-spinner" style={{ width: '40px', height: '40px' }} />
      <span style={{ color: 'var(--text-muted)', marginTop: '12px' }}>Loading ATOM FITNESS...</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/member'} replace />;
  return children;
};

const AppLayout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <div className="main-content">{children}</div>
  </div>
);

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="loading-full" style={{ minHeight: '100vh' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--accent)', textAlign: 'center', marginBottom: '16px' }}>⚡ ATOM FITNESS</div>
        <div className="loading-spinner" style={{ width: '32px', height: '32px', margin: '0 auto' }} />
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/member'} /> : <LoginPage />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <PrivateRoute role="admin">
          <AppLayout><Dashboard /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/admin/members" element={
        <PrivateRoute role="admin">
          <AppLayout><MembersList /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/admin/members/new" element={
        <PrivateRoute role="admin">
          <AppLayout><MemberForm /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/admin/members/:id" element={
        <PrivateRoute role="admin">
          <AppLayout><MemberDetail /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/admin/members/:id/edit" element={
        <PrivateRoute role="admin">
          <AppLayout><MemberForm /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/admin/plans" element={
        <PrivateRoute role="admin">
          <AppLayout><PlansPage /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/admin/activate" element={
        <PrivateRoute role="admin">
          <AppLayout><ActivatePage /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/admin/gym-qr" element={
        <PrivateRoute role="admin">
          <AppLayout><GymQRPage /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/admin/attendance" element={
        <PrivateRoute role="admin">
          <AppLayout><AttendanceLogs /></AppLayout>
        </PrivateRoute>
      } />

      {/* Member Routes */}
      <Route path="/member" element={
        <PrivateRoute role="member">
          <AppLayout><MemberDashboard /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/member/checkin" element={
        <PrivateRoute role="member">
          <AppLayout><CheckInPage /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/member/profile" element={
        <PrivateRoute role="member">
          <AppLayout><MemberProfile /></AppLayout>
        </PrivateRoute>
      } />
      <Route path="/member/attendance" element={
        <PrivateRoute role="member">
          <AppLayout><MemberAttendance /></AppLayout>
        </PrivateRoute>
      } />

      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/member') : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
