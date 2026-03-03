import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';

const ScannerPage = () => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('camera');
  const html5QrRef = useRef(null);
  const isUnmounting = useRef(false);

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try {
        if (html5QrRef.current.isScanning) {
          await html5QrRef.current.stop();
        }
        await html5QrRef.current.clear();
      } catch (err) {
        // Ignore cleanup errors
      }
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  const processToken = async (token) => {
    if (loading) return;
    setLoading(true);
    setScanResult(null);
    try {
      let qrToken = token;
      try {
        const parsed = JSON.parse(token);
        if (parsed.token) qrToken = parsed.token;
      } catch { }

      const res = await api.post('/attendance/scan', { token: qrToken });
      setScanResult({ ...res.data, type: 'success' });
      toast.success(res.data.message);
    } catch (err) {
      const errData = err.response?.data;
      setScanResult({ ...errData, type: 'error' });
      
      const statusMessages = {
        'DUPLICATE': '⚠️ Already checked in today',
        'EXPIRED': '❌ Subscription expired',
        'INVALID': '❌ Invalid QR code',
        'INACTIVE': '❌ QR code deactivated',
        'MEMBER_INACTIVE': '❌ Member account inactive'
      };
      toast.error(statusMessages[errData?.status] || errData?.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setScanResult(null);
    
    if (html5QrRef.current) {
      await stopScanner();
    }
    
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        toast.error('No camera found. Please use manual token entry.');
        return;
      }

      html5QrRef.current = new Html5Qrcode('qr-reader');

      const config = {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
      };

      await html5QrRef.current.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          if (!isUnmounting.current) {
            await stopScanner();
            await processToken(decodedText);
          }
        },
        () => {}
      );
      
      setScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Could not access camera. Try granting camera permissions or use manual entry.');
      html5QrRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      isUnmounting.current = true;
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (tab === 'manual' && scanning) {
      stopScanner();
    }
  }, [tab]);

  const handleManualScan = async (e) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      toast.error('Please enter a token');
      return;
    }
    await processToken(manualToken.trim());
  };

  const resetScan = () => {
    setScanResult(null);
    setManualToken('');
  };

  const ResultCard = ({ result }) => {
    if (!result) return null;
    const isSuccess = result.status === 'SUCCESS';
    const isWarning = result.status === 'DUPLICATE';
    
    return (
      <div className={`scan-result ${isSuccess ? 'success' : isWarning ? 'warning' : 'error'}`}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>
          {isSuccess ? '✅' : isWarning ? '⚠️' : '❌'}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>
          {isSuccess ? 'CHECK-IN SUCCESSFUL' : isWarning ? 'ALREADY CHECKED IN' : 'ACCESS DENIED'}
        </div>
        <div style={{ fontSize: '14px', marginBottom: '12px' }}>{result.message}</div>
        
        {result.member && (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)', padding: '12px', fontSize: '13px' }}>
            <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>{result.member.name}</div>
            {result.member.plan_name && <div>{result.member.plan_name}</div>}
            {result.member.end_date && (
              <div style={{ opacity: 0.8 }}>Expires: {formatDate(result.member.end_date)}</div>
            )}
            {result.member.days_remaining !== undefined && result.member.days_remaining > 0 && (
              <div style={{ marginTop: '4px' }}>
                <strong>{result.member.days_remaining}</strong> days remaining
              </div>
            )}
          </div>
        )}
        
        <button
          className="btn btn-secondary"
          style={{ marginTop: '12px' }}
          onClick={() => { resetScan(); if (tab === 'camera') startScanner(); }}
        >
          📷 Scan Next
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">QR Scanner</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className={`badge ${scanning ? 'badge-active' : 'badge-expired'}`}>
            {scanning ? '🟢 Camera Active' : '⭕ Camera Off'}
          </span>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <button
            className={`btn ${tab === 'camera' ? 'btn-primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center', padding: '8px', background: tab !== 'camera' ? 'transparent' : undefined, color: tab !== 'camera' ? 'var(--text-muted)' : undefined }}
            onClick={() => { setTab('camera'); resetScan(); }}
          >📷 Camera Scan</button>
          <button
            className={`btn ${tab === 'manual' ? 'btn-primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center', padding: '8px', background: tab !== 'manual' ? 'transparent' : undefined, color: tab !== 'manual' ? 'var(--text-muted)' : undefined }}
            onClick={() => { setTab('manual'); resetScan(); }}
          >⌨️ Manual Entry</button>
        </div>

        {tab === 'camera' && (
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <p className="text-secondary text-sm">Point camera at member's QR code for instant check-in</p>
            </div>

            <div className="scanner-box" style={{ marginBottom: '16px', minHeight: '300px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div id="qr-reader" style={{ width: '100%' }}>
                {!scanning && !scanResult && (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
                    <p>Camera not started</p>
                  </div>
                )}
              </div>
            </div>

            {scanResult ? (
              <ResultCard result={scanResult} />
            ) : (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {!scanning ? (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={startScanner}
                    disabled={loading}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    📷 Start Camera Scanner
                  </button>
                ) : (
                  <button
                    className="btn btn-danger btn-lg"
                    onClick={stopScanner}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    ⏹ Stop Scanner
                  </button>
                )}
              </div>
            )}

            {loading && (
              <div className="flex-center mt-16" style={{ gap: '8px', color: 'var(--text-muted)' }}>
                <span className="loading-spinner" /> Validating QR code...
              </div>
            )}
          </div>
        )}

        {tab === 'manual' && (
          <div className="card">
            <div className="section-title mb-16">Manual Token Entry</div>
            <p className="text-muted text-sm mb-16">Enter QR token manually if camera is unavailable</p>
            
            <form onSubmit={handleManualScan}>
              <div className="form-group">
                <label className="form-label">QR Token</label>
                <input
                  type="text"
                  className="form-input"
                  value={manualToken}
                  onChange={e => setManualToken(e.target.value)}
                  placeholder="Paste QR token here..."
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
                style={{ justifyContent: 'center' }}
              >
                {loading ? <><span className="loading-spinner" style={{ width: '14px', height: '14px' }} /> Validating...</> : '✓ Validate & Check-in'}
              </button>
            </form>

            {scanResult && <div style={{ marginTop: '16px' }}><ResultCard result={scanResult} /></div>}
          </div>
        )}

        <div className="card mt-16">
          <div className="section-title mb-12">How it Works</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div>1. Click "Start Camera Scanner" to activate webcam</div>
            <div>2. Ask member to show their QR code from the member app</div>
            <div>3. Point camera at the QR code — auto-detects instantly</div>
            <div>4. System validates subscription status & prevents duplicate check-ins</div>
            <div>5. Green = ✅ Check-in logged | Red = ❌ Access denied</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScannerPage;
