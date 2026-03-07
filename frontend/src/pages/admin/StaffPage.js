import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const StaffPage = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [permissions, setPermissions] = useState({
    can_scan_attendance: true,
    can_view_members: true,
    can_add_members: false,
    can_edit_members: false,
    can_delete_members: false,
    can_view_subscriptions: true,
    can_add_subscriptions: false,
    can_view_attendance: true,
    can_view_reports: false,
    can_view_financial: false
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff');
      setStaff(res.data.staff);
    } catch (err) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff', {
        ...formData,
        permissions
      });
      toast.success('Staff member added successfully');
      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '', password: '' });
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    }
  };

  const handleUpdatePermissions = async () => {
    try {
      await api.put(`/staff/${selectedStaff.id}/permissions`, permissions);
      toast.success('Permissions updated');
      setShowPermissionsModal(false);
      fetchStaff();
    } catch (err) {
      toast.error('Failed to update permissions');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Deactivate this staff member?')) return;
    
    try {
      await api.delete(`/staff/${id}`);
      toast.success('Staff member deactivated');
      fetchStaff();
    } catch (err) {
      toast.error('Failed to deactivate staff');
    }
  };

  const openPermissionsModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setPermissions({
      can_scan_attendance: staffMember.can_scan_attendance,
      can_view_members: staffMember.can_view_members,
      can_add_members: staffMember.can_add_members,
      can_edit_members: staffMember.can_edit_members,
      can_delete_members: staffMember.can_delete_members,
      can_view_subscriptions: staffMember.can_view_subscriptions,
      can_add_subscriptions: staffMember.can_add_subscriptions,
      can_view_attendance: staffMember.can_view_attendance,
      can_view_reports: staffMember.can_view_reports,
      can_view_financial: staffMember.can_view_financial
    });
    setShowPermissionsModal(true);
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Staff Management</h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            ➕ Add Staff
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                      No staff members yet
                    </td>
                  </tr>
                ) : (
                  staff.map(s => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                      <td>{s.phone || '-'}</td>
                      <td>
                        <span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => openPermissionsModal(s)}
                          >
                            🔐 Permissions
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteStaff(s.id)}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Staff Member</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddStaff}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Password (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Auto-generated if empty"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div className="section-title mt-24 mb-12">Default Permissions</div>
              
              <div className="permission-grid">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={permissions.can_scan_attendance}
                    onChange={e => setPermissions({...permissions, can_scan_attendance: e.target.checked})}
                  />
                  <span>Scan Attendance</span>
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={permissions.can_view_members}
                    onChange={e => setPermissions({...permissions, can_view_members: e.target.checked})}
                  />
                  <span>View Members</span>
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={permissions.can_add_members}
                    onChange={e => setPermissions({...permissions, can_add_members: e.target.checked})}
                  />
                  <span>Add Members</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedStaff && (
        <div className="modal-overlay" onClick={() => setShowPermissionsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Permissions: {selectedStaff.name}</h2>
              <button className="modal-close" onClick={() => setShowPermissionsModal(false)}>✕</button>
            </div>
            
            <div className="permission-grid">
              {Object.entries({
                can_scan_attendance: 'Scan Attendance',
                can_view_members: 'View Members',
                can_add_members: 'Add Members',
                can_edit_members: 'Edit Members',
                can_delete_members: 'Delete Members',
                can_view_subscriptions: 'View Subscriptions',
                can_add_subscriptions: 'Add Subscriptions',
                can_view_attendance: 'View Attendance',
                can_view_reports: 'View Reports',
                can_view_financial: 'View Financial Data'
              }).map(([key, label]) => (
                <label key={key} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={permissions[key]}
                    onChange={e => setPermissions({...permissions, [key]: e.target.checked})}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPermissionsModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdatePermissions}>
                Update Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffPage;