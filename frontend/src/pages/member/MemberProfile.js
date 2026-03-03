import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { formatDate, getInitials } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const MemberProfile = () => {
  const { user, refreshUser } = useAuth();
  const [changePass, setChangePass] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [showPassForm, setShowPassForm] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (changePass.newPassword !== changePass.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (changePass.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: changePass.currentPassword,
        newPassword: changePass.newPassword
      });
      toast.success('Password changed successfully');
      setChangePass({ currentPassword: '', newPassword: '', confirm: '' });
      setShowPassForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">My Profile</h1>
      </div>

      <div className="page-content" style={{ maxWidth: '640px' }}>
        {/* Profile Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div className="user-avatar" style={{ width: '72px', height: '72px', fontSize: '26px' }}>
              {getInitials(user?.name)}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700' }}>{user?.name}</div>
              <div className="text-muted">{user?.email}</div>
              <span className="badge badge-active mt-4" style={{ display: 'inline-flex' }}>
                ATOM FITNESS MEMBER
              </span>
            </div>
          </div>

          <div className="divider" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Full Name', value: user?.name },
              { label: 'Email', value: user?.email },
              { label: 'Phone', value: user?.phone || '-' },
              { label: 'Gender', value: user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '-' },
              { label: 'Date of Birth', value: formatDate(user?.date_of_birth) },
              { label: 'Member Since', value: formatDate(user?.created_at) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                <div className="fw-600 text-sm" style={{ color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>

          {user?.address && (
            <>
              <div className="divider" />
              <div>
                <div className="text-xs text-muted mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Address</div>
                <div className="text-sm text-secondary">{user.address}</div>
              </div>
            </>
          )}

          {(user?.emergency_contact || user?.emergency_phone) && (
            <>
              <div className="divider" />
              <div className="form-row">
                <div>
                  <div className="text-xs text-muted mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Emergency Contact</div>
                  <div className="text-sm text-secondary">{user?.emergency_contact || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Emergency Phone</div>
                  <div className="text-sm text-secondary">{user?.emergency_phone || '-'}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Change Password */}
        <div className="card mt-16">
          <div className="flex-between mb-16">
            <div className="section-title">🔒 Security</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowPassForm(!showPassForm)}>
              {showPassForm ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPassForm ? (
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" value={changePass.currentPassword}
                  onChange={e => setChangePass(p => ({ ...p, currentPassword: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={changePass.newPassword}
                  onChange={e => setChangePass(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Min 6 characters" minLength={6} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" value={changePass.confirm}
                  onChange={e => setChangePass(p => ({ ...p, confirm: e.target.value }))} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Changing...' : '✓ Change Password'}
              </button>
            </form>
          ) : (
            <p className="text-muted text-sm">Your password is securely encrypted. Click "Change Password" to update it.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default MemberProfile;
