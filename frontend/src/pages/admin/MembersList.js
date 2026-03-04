import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { formatDate, getSubscriptionStatus, getDaysRemaining } from '../../utils/helpers';

const MembersList = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const navigate = useNavigate();

  const loadMembers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/members', {
        params: { search, status: statusFilter, page, limit: 20 }
      });
      setMembers(res.data.members);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => loadMembers(1), 300);
    return () => clearTimeout(timer);
  }, [loadMembers]);

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate member: ${name}?`)) return;
    try {
      await api.delete(`/members/${id}`);
      toast.success('Member deactivated');
      loadMembers();
    } catch {
      toast.error('Failed to deactivate member');
    }
  };

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Members</h1>
        <button className="btn btn-primary" onClick={() => navigate('/admin/members/new')}>
          ➕ Add Member
        </button>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="search-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: '160px' }}
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
                <th>Member</th>
                <th>Phone</th>
                <th>Plan</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loading-spinner" />
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <div className="empty-state-title">No members found</div>
                    </div>
                  </td>
                </tr>
              ) : members.map(m => {
                const status = getSubscriptionStatus(
                  m.subscription_id ? { status: m.subscription_status, end_date: m.end_date } : null
                );
                const days = getDaysRemaining(m.end_date);
                return (
                  <tr key={m.id}>
                    <td>
                      <div className="name-cell">{m.name}</div>
                      <div className="text-xs text-muted">{m.email}</div>
                    </td>
                    <td>{m.phone || '-'}</td>
                    <td>{m.plan_name || <span className="text-muted">No Plan</span>}</td>
                    <td>{formatDate(m.start_date)}</td>
                    <td>{formatDate(m.end_date)}</td>
                    <td>
                      {m.end_date ? (
                        <span className={`days-pill ${days < 0 ? 'expired' : days <= 7 ? 'warn' : 'ok'}`}>
                          {days < 0 ? 'Expired' : `${days}d`}
                        </span>
                      ) : '-'}
                    </td>
                    <td><span className={`badge ${status.class}`}>{status.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/admin/members/${m.id}`)}
                        >View</button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate('/admin/activate', { state: { memberId: m.id } })}
                          title="Activate Plan"
                        >⚡</button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeactivate(m.id, m.name)}
                        >✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => loadMembers(p)}
              >{p}</button>
            ))}
          </div>
        )}

        <div className="text-muted text-sm mt-8">
          Showing {members.length} of {pagination.total} members
        </div>
      </div>
    </>
  );
};

export default MembersList;
