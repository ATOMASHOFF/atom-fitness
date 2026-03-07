import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';

const StaffSubscriptionsPage = () => {
  const { hasPermission } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get('/subscriptions');
      setSubscriptions(res.data.subscriptions);
    } catch (err) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('can_view_subscriptions')) {
    return (
      <div className="page-content">
        <div className="alert alert-warning">
          ⚠️ You don't have permission to view subscriptions
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Subscriptions</h1>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  {hasPermission('can_view_financial') && <th>Amount</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No subscriptions found</td>
                  </tr>
                ) : (
                  subscriptions.map(sub => (
                    <tr key={sub.id}>
                      <td>
                        <div>{sub.member_name}</div>
                        <div className="text-muted text-sm">{sub.member_email}</div>
                      </td>
                      <td>{sub.plan_name}</td>
                      <td>{formatDate(sub.start_date)}</td>
                      <td>{formatDate(sub.end_date)}</td>
                      <td>
                        <span className={`badge ${
                          sub.status === 'active' ? 'badge-success' : 'badge-danger'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      {hasPermission('can_view_financial') && (
                        <td>₹{sub.amount_paid}</td>
                      )}
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

export default StaffSubscriptionsPage;