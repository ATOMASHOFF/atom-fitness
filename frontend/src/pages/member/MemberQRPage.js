import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate, getDaysRemaining } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const MemberQRPage = () => {
  const { user } = useAuth();
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/subscriptions/my/qr');
        setQr(res.data.qrCode);
      } catch (err) {
        setError(err.response?.data?.message || 'No QR code found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownload = () => {
    if (!qr) return;
    const link = document.createElement('a');
    link.download = `ATOM_QR_${user?.name?.replace(/\s/g, '_')}.png`;
    link.href = qr.qr_image_data;
    link.click();
  };

  const days = getDaysRemaining(qr?.end_date);
  const isActive = qr?.subscription_status === 'active' && days >= 0;

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">My QR Code</h1>
      </div>

      <div className="page-content" style={{ maxWidth: '480px', margin: '0 auto' }}>
        {loading ? (
          <div className="loading-full"><div className="loading-spinner" style={{ width: '32px', height: '32px' }} /></div>
        ) : error ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📱</div>
            <div className="alert alert-warning">{error}</div>
            <p className="text-muted text-sm mt-8">Contact the gym to activate your membership and receive a QR code.</p>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '20px' }}>
              <span className={`badge ${isActive ? 'badge-active' : 'badge-expired'}`} style={{ fontSize: '13px', padding: '6px 16px' }}>
                {isActive ? '✅ ACTIVE MEMBERSHIP' : '❌ MEMBERSHIP INACTIVE'}
              </span>
            </div>

            {/* Large QR Code */}
            <div style={{
              display: 'inline-block',
              padding: '16px',
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: `4px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
              boxShadow: isActive ? 'var(--shadow-accent)' : 'none',
              marginBottom: '20px'
            }}>
              <img
                src={qr.qr_image_data}
                alt="My QR Code"
                style={{ width: '260px', height: '260px', display: 'block' }}
              />
            </div>

            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
              {user?.name}
            </div>
            <div className="text-muted text-sm mb-16">{user?.email}</div>

            {/* Info */}
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted text-sm">Plan</span>
                <span className="fw-600 text-sm">{qr.plan_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted text-sm">Start Date</span>
                <span className="text-sm">{formatDate(qr.start_date)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted text-sm">Expiry Date</span>
                <span className={`text-sm ${days <= 7 && days >= 0 ? 'text-yellow' : days < 0 ? 'text-red' : 'text-green'}`}>
                  {formatDate(qr.end_date)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted text-sm">Days Remaining</span>
                <span className={`days-pill ${days < 0 ? 'expired' : days <= 7 ? 'warn' : 'ok'}`}>
                  {days < 0 ? 'Expired' : `${days} days`}
                </span>
              </div>
            </div>

            {!isActive && (
              <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                ⚠️ Your membership has expired. This QR code will be rejected at the scanner.
              </div>
            )}

            {isActive && days <= 7 && (
              <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
                ⚠️ Your membership expires in {days} day{days !== 1 ? 's' : ''}. Please renew soon!
              </div>
            )}

            <div className="alert alert-info" style={{ marginBottom: '16px', textAlign: 'left' }}>
              📌 Show this QR code at the gym entrance scanner to check in. A new QR is generated each time your membership is renewed.
            </div>

            <button className="btn btn-secondary w-full" style={{ justifyContent: 'center' }} onClick={handleDownload}>
              ⬇ Download QR Code
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default MemberQRPage;
