import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';

const PendingRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await api.get('/members/pending');
      setRegistrations(res.data.registrations);
    } catch (err) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this registration?')) return;

    try {
      await api.post(`/members/${id}/approve`);
      toast.success('Registration approved!');
      fetchRegistrations();
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this registration? This cannot be undone.')) return;

    try {
      await api.post(`/members/${id}/reject`);
      toast.success('Registration rejected');
      fetchRegistrations();
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Pending Registrations</h1>
      </div>

      <div className="page-content">
        <div className="card">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
          ) : registrations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
              No pending registrations
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(reg => (
                    <tr key={reg.id}>
                      <td>{reg.name}</td>
                      <td>{reg.email}</td>
                      <td>{reg.phone}</td>
                      <td>{formatDate(reg.created_at)}</td>
                      <td>
                        <div className="btn-group">
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => handleApprove(reg.id)}
                          >
                            ✓ Approve
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleReject(reg.id)}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PendingRegistrationsPage;