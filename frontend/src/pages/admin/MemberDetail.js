import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { formatDate, formatDateTime, formatCurrency, getDaysRemaining, getInitials } from '../../utils/helpers';

const MemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [memberRes, qrRes] = await Promise.allSettled([
          api.get(`/members/${id}`),
          api.get(`/subscriptions/qr/${id}`)
        ]);
        if (memberRes.status === 'fulfilled') setData(memberRes.value.data);
        if (qrRes.status === 'fulfilled') setQrCode(qrRes.value.data.qrCode);
      } catch (err) {
        toast.error('Failed to load member data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="loading-full"><div className="loading-spinner" style={{ width: '32px', height: '32px' }} /></div>;
  if (!data) return <div className="page-content"><div className="alert alert-danger">Member not found</div></div>;

  const { member, subscriptions, attendanceCount } = data;
  const activeSub = subscriptions?.find(s => s.status === 'active');
  const days = getDaysRemaining(activeSub?.end_date);

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Member Profile</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/activate', { state: { memberId: id } })}>
            ⚡ Activate Plan
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/admin/members/${id}/edit`)}>
            ✏️ Edit
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/members')}>← Back</button>
        </div>
      </div>

      <div className="page-content">
        <div className="grid-2">
          {/* Profile Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div className="user-avatar" style={{ width: '56px', height: '56px', fontSize: '22px' }}>
                {getInitials(member.name)}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700' }}>{member.name}</div>
                <div className="text-muted text-sm">{member.email}</div>
                <div className="text-muted text-sm">{member.phone || 'No phone'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {[
                { label: 'Gender', value: member.gender },
                { label: 'Date of Birth', value: formatDate(member.date_of_birth) },
                { label: 'Member Since', value: formatDate(member.created_at) },
                { label: 'Address', value: member.address },
                { label: 'Emergency Contact', value: member.emergency_contact },
                { label: 'Emergency Phone', value: member.emergency_phone },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: '12px' }}>
                  <span className="text-muted text-sm" style={{ width: '120px', flexShrink: 0 }}>{label}</span>
                  <span className="text-secondary text-sm">{value || '-'}</span>
                </div>
              ))}
            </div>

            {member.profile_notes && (
              <div style={{ marginTop: '16px', padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--accent)' }}>
                <div className="text-xs text-muted" style={{ marginBottom: '4px' }}>NOTES</div>
                <div className="text-sm text-secondary">{member.profile_notes}</div>
              </div>
            )}
          </div>

          {/* Subscription + Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <div className="section-title mb-16">Current Subscription</div>
              {activeSub ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="text-secondary">Plan</span>
                    <span className="fw-600">{activeSub.plan_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="text-secondary">Start Date</span>
                    <span>{formatDate(activeSub.start_date)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="text-secondary">Expiry Date</span>
                    <span>{formatDate(activeSub.end_date)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="text-secondary">Amount Paid</span>
                    <span className="text-green fw-600">{formatCurrency(activeSub.amount_paid)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Days Remaining</span>
                    <span className={`days-pill ${days < 0 ? 'expired' : days <= 7 ? 'warn' : 'ok'}`}>
                      {days < 0 ? 'Expired' : `${days} days`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning">
                  ⚠️ No active subscription
                  <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}
                    onClick={() => navigate('/admin/activate', { state: { memberId: id } })}>
                    Activate
                  </button>
                </div>
              )}
            </div>

            <div className="card" style={{ display: 'flex', gap: '20px', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700', color: 'var(--blue)' }}>
                  {attendanceCount}
                </div>
                <div className="text-xs text-muted">Total Check-ins</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700', color: 'var(--green)' }}>
                  {subscriptions?.length || 0}
                </div>
                <div className="text-xs text-muted">Total Plans</div>
              </div>
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div className="section-title mb-16">Member QR Code</div>
                <button className="btn btn-secondary" onClick={() => setShowQr(!showQr)}>
                  {showQr ? '🙈 Hide QR' : '📱 Show QR Code'}
                </button>
                {showQr && (
                  <div style={{ marginTop: '16px' }}>
                    <img src={qrCode.qr_image_data} alt="Member QR Code" className="qr-image" />
                    <div className="text-xs text-muted mt-8">Valid for: {qrCode.plan_name}</div>
                    <div className="text-xs text-muted">Expires: {formatDate(qrCode.end_date)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subscription History */}
        <div className="card mt-16">
          <div className="section-title mb-16">Subscription History</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions?.map(sub => (
                  <tr key={sub.id}>
                    <td className="name-cell">{sub.plan_name}</td>
                    <td>{formatDate(sub.start_date)}</td>
                    <td>{formatDate(sub.end_date)}</td>
                    <td className="text-green">{formatCurrency(sub.amount_paid)}</td>
                    <td className="text-secondary">{sub.payment_method}</td>
                    <td><span className={`badge ${sub.status === 'active' ? 'badge-active' : 'badge-expired'}`}>{sub.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberDetail;
