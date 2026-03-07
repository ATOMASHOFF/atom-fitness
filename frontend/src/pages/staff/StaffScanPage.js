import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const StaffMembersPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchMembers();
  }, [search, statusFilter]);

  const fetchMembers = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/members', { params });
      setMembers(res.data.members);
    } catch (err) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('can_view_members')) {
    return (
      <div className="page-content">
        <div className="alert alert-warning">
          ⚠️ You don't have permission to view members
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Members</h1>
        <div className="header-actions">
          {hasPermission('can_add_members') && (
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/staff/members/add')}
            >
              ➕ Add Member
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div className="search-bar">
              <input
                type="text"
                className="form-input"
                placeholder="Search members..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Plan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>Loading...</td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>No members found</td>
                  </tr>
                ) : (
                  members.map(member => (
                    <tr key={member.id}>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>{member.phone || '-'}</td>
                      <td>{member.plan_name || 'No Plan'}</td>
                      <td>
                        <span className={`badge ${
                          member.subscription_status === 'active' ? 'badge-success' : 'badge-danger'
                        }`}>
                          {member.subscription_status || 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffMembersPage;