import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const GymQRPage = () => {
  const [gymQR, setGymQR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const loadGymQR = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gym-qr');
      setGymQR(res.data.gymQR);
    } catch (err) {
      toast.error('Failed to load gym QR code');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGymQR();
  }, []);

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerate gym QR code? This will invalidate the current QR code displayed at the gym entrance.')) {
      return;
    }
    
    setRegenerating(true);
    try {
      await api.post('/gym-qr/regenerate');
      toast.success('Gym QR code regenerated successfully!');
      await loadGymQR();
    } catch (err) {
      toast.error('Failed to regenerate QR code');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownload = () => {
    if (!gymQR) return;
    const link = document.createElement('a');
    link.download = 'ATOM_FITNESS_GYM_QR.png';
    link.href = gymQR.qr_image_data;
    link.click();
  };

  const handlePrint = () => {
    if (!gymQR) return;
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>ATOM FITNESS - Gym QR Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 40px;
            }
            h1 { color: #ff3d00; margin-bottom: 10px; }
            .subtitle { color: #666; margin-bottom: 30px; }
            img { border: 4px solid #ff3d00; border-radius: 12px; }
            .instructions {
              margin-top: 30px;
              font-size: 16px;
              color: #333;
              max-width: 600px;
              margin-left: auto;
              margin-right: auto;
            }
            @media print {
              @page { size: portrait; margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h1>⚡ ATOM FITNESS</h1>
          <div class="subtitle">SCAN TO CHECK IN</div>
          <img src="${gymQR.qr_image_data}" width="400" height="400" />
          <div class="instructions">
            <p><strong>How to Check In:</strong></p>
            <p>1. Open ATOM FITNESS member app<br/>
            2. Tap "Check In"<br/>
            3. Scan this QR code<br/>
            4. Attendance recorded instantly!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <div className="loading-full">
        <div className="loading-spinner" style={{ width: '32px', height: '32px' }} />
      </div>
    );
  }

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Gym Check-In QR Code</h1>
      </div>

      <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="alert alert-info mb-16">
          📱 <strong>How it works:</strong> Display this QR code at your gym entrance. Members scan it with their phone to check in instantly.
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px' }}>
              ⚡ ATOM FITNESS
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Scan to Check In
            </div>
          </div>

          {/* Large QR Code */}
          <div style={{
            display: 'inline-block',
            padding: '24px',
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '4px solid var(--accent)',
            boxShadow: 'var(--shadow-accent)',
            marginBottom: '24px'
          }}>
            <img
              src={gymQR?.qr_image_data}
              alt="Gym Check-In QR Code"
              style={{ width: '400px', height: '400px', display: 'block' }}
            />
          </div>

          <div style={{ marginBottom: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <div>Location: {gymQR?.location}</div>
            <div>Created: {new Date(gymQR?.created_at).toLocaleDateString('en-IN')}</div>
            <div className="text-xs mt-4">QR ID: {gymQR?.id?.slice(0, 8)}...</div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleDownload}>
              ⬇ Download QR
            </button>
            <button className="btn btn-secondary" onClick={handlePrint}>
              🖨 Print QR
            </button>
            <button className="btn btn-danger" onClick={handleRegenerate} disabled={regenerating}>
              {regenerating ? 'Regenerating...' : '🔄 Regenerate QR'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="grid-2 mt-16">
          <div className="card">
            <div className="section-title mb-12">📋 Setup Instructions</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>1. Download or print this QR code</div>
              <div>2. Display it prominently at gym entrance</div>
              <div>3. Optionally: Print large poster for visibility</div>
              <div>4. Add instructions: "Open ATOM app → Scan QR"</div>
            </div>
          </div>

          <div className="card">
            <div className="section-title mb-12">🔒 Security</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>✓ QR checks member's active subscription</div>
              <div>✓ Prevents expired memberships</div>
              <div>✓ Blocks duplicate same-day check-ins</div>
              <div>✓ Regenerate QR anytime if compromised</div>
            </div>
          </div>
        </div>

        {/* Member Instructions Card */}
        <div className="card mt-16" style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)' }}>
          <div className="section-title mb-12" style={{ color: 'var(--accent)' }}>📱 For Members</div>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)', textAlign: 'left' }}>
            <strong>How to check in:</strong>
            <ol style={{ marginTop: '8px', marginLeft: '20px' }}>
              <li>Login to ATOM FITNESS member app</li>
              <li>Go to Dashboard → Click "Check In"</li>
              <li>Scan this QR code at gym entrance</li>
              <li>Instant attendance confirmation!</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
};

export default GymQRPage;
