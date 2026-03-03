import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const CheckInPage = () => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const html5QrRef = useRef(null);

  const processGymQR = async (token) => {
    if (loading) return;
    setLoading(true);
    setScanResult(null);
    try {
      let qrToken = token;
      try {
        const parsed = JSON.parse(token);
        if (parsed.token) qrToken = parsed.token;
      } catch { }

      const res = await api.post('/attendance/checkin', { token: qrToken });
      setScanResult({ ...res.data, type: 'success' });
      toast.success(res.data.message);
    } catch (err) {
      const errData = err.response?.data;
      setScanResult({ ...errData, type: 'error' });
      
      const statusMessages = {
        'DUPLICATE': '⚠️ You already checked in today',
        'EXPIRED': '❌ Your membership has expired',
        'INVALID': '❌ Invalid gym QR code',
        'NO_SUBSCRIPTION': '❌ No active membership',
        'MEMBER_INACTIVE': '❌ Your account is inactive'
      };
      toast.error(statusMessages[errData?.status] || errData?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const stopScanner = () => {
    if (html5QrRef.current) {
      try {
        html5QrRef.current.stop().then(() => {
          html5QrRef.current = null;
          setScanning(false);
        }).catch(() => {
          html5QrRef.current = null;
          setScanning(false);
        });
      } catch (err) {
        html5QrRef.current = null;
        setScanning(false);
      }
    } else {
      setScanning(false);
    }
  };

  const startScanner = async () => {
    setScanResult(null);
    
    // Clean up any existing scanner
    if (html5QrRef.current) {
      stopScanner();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        toast.error('No camera found. Please check camera permissions.');
        return;
      }

      const scanner = new Html5Qrcode('qr-reader');
      html5QrRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      };

      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          stopScanner();
          processGymQR(decodedText);
        },
        () => {}
      );
      
      setScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Could not access camera. Please grant camera permissions.');
      html5QrRef.current = null;
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleManualScan = async (e) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      toast.error('Please enter a token');
      return;
    }
    await processGymQR(manualToken.trim());
  };

  const resetScan = () => {
    setScanResult(null);
    setManualToken('');
  };

  const ResultCard = ({ result }) => {
    if (!result) return null;
    const isSuccess = result.status === 'SUCCESS';
    
    return (
      <div className={`scan-result ${isSuccess ? 'success' : 'error'}`}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>
          {isSuccess ? '✅' : '❌'}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
          {isSuccess ? 'CHECK-IN SUCCESSFUL!' : 'CHECK-IN FAILED'}
        </div>
        <div style={{ fontSize: '15px', marginBottom: '16px' }}>{result.message}</div>
        
        {isSuccess && result.member && (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)', padding: '16px', fontSize: '14px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Plan:</strong> {result.member.plan_name}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Expires:</strong> {formatDate(result.member.end_date)}
            </div>
            {result.member.days_remaining !== undefined && (
              <div>
                <strong>{result.member.days_remaining}</strong> days remaining
              </div>
            )}
          </div>
        )}
        
        {result.subscription && (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)', padding: '16px', fontSize: '14px', marginTop: '12px' }}>
            <div>Your membership expired on:</div>
            <div><strong>{formatDate(result.subscription.end_date)}</strong></div>
            <div className="text-muted text-sm mt-4">Please contact the gym to renew.</div>
          </div>
        )}
        
        <button
          className="btn btn-secondary btn-lg"
          style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}
          onClick={() => { resetScan(); }}
        >
          ✓ Done
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Check In</h1>
      </div>

      <div className="page-content" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="alert alert-info mb-16">
          📷 Scan the gym's QR code or enter token manually
        </div>

        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
              Welcome, {user?.name?.split(' ')[0]}!
            </div>
          </div>

          {/* Tab Selection */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button 
              className={`btn ${!scanning ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { if (scanning) stopScanner(); }}
            >
              📷 Camera
            </button>
            <button 
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { if (scanning) stopScanner(); }}
            >
              ⌨️ Manual
            </button>
          </div>

          {/* Camera Scanner */}
          {!scanResult && (
            <>
              <div id="qr-reader" style={{ marginBottom: '16px', minHeight: scanning ? '300px' : '0px' }}></div>

              {!scanning ? (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={startScanner}
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', fontSize: '16px', padding: '14px' }}
                >
                  📷 Start Camera
                </button>
              ) : (
                <button
                  className="btn btn-danger btn-lg"
                  onClick={stopScanner}
                  style={{ width: '100%', justifyContent: 'center', fontSize: '16px', padding: '14px' }}
                >
                  ⏹ Stop Camera
                </button>
              )}
            </>
          )}

          {/* Manual Entry */}
          {!scanning && !scanResult && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <div className="section-title mb-12" style={{ fontSize: '14px' }}>Or Enter Token Manually</div>
              <form onSubmit={handleManualScan}>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    value={manualToken}
                    onChange={e => setManualToken(e.target.value)}
                    placeholder="Paste gym QR token here..."
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-secondary w-full"
                  disabled={loading}
                  style={{ justifyContent: 'center' }}
                >
                  {loading ? 'Validating...' : '✓ Check In'}
                </button>
              </form>
            </div>
          )}

          {/* Results */}
          {scanResult && <ResultCard result={scanResult} />}

          {loading && (
            <div className="flex-center mt-16" style={{ gap: '8px', color: 'var(--text-muted)' }}>
              <span className="loading-spinner" /> Processing check-in...
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="card mt-16">
          <div className="section-title mb-12">📋 Instructions</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div><strong>Camera Method:</strong></div>
            <div>1. Click "Start Camera"</div>
            <div>2. Point at gym's QR code</div>
            <div>3. Wait for automatic scan</div>
            <div style={{ marginTop: '8px' }}><strong>Manual Method:</strong></div>
            <div>1. Get QR token from gym staff</div>
            <div>2. Paste in text box above</div>
            <div>3. Click "Check In"</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckInPage;