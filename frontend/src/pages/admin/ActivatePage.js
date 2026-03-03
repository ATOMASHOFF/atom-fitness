import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/helpers';

const ActivatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({
    member_id: location.state?.memberId || '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [membersRes, plansRes] = await Promise.all([
          api.get('/members', { params: { limit: 200 } }),
          api.get('/subscriptions/plans')
        ]);
        setMembers(membersRes.data.members);
        setPlans(plansRes.data.plans);
      } catch { toast.error('Failed to load data'); }
    };
    load();
  }, []);

  const handlePlanChange = (planId) => {
    setForm(f => ({ ...f, plan_id: planId }));
    const plan = plans.find(p => p.id === planId);
    setSelectedPlan(plan || null);
  };

  const getEndDate = () => {
    if (!form.start_date || !selectedPlan) return '';
    const start = new Date(form.start_date);
    const end = new Date(start);
    end.setDate(end.getDate() + selectedPlan.duration_days);
    return end.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.member_id || !form.plan_id || !form.start_date) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/subscriptions/activate', form);
      setResult(res.data);
      toast.success('Subscription activated successfully! QR generated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate subscription');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m =>
    !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const selectedMember = members.find(m => m.id === form.member_id);

  if (result) {
    return (
      <>
        <div className="top-header">
          <h1 className="page-title">Subscription Activated ✓</h1>
        </div>
        <div className="page-content" style={{ maxWidth: '600px' }}>
          <div className="alert alert-success" style={{ marginBottom: '20px', padding: '16px' }}>
            ✅ Subscription activated for <strong>{result.member.name}</strong>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div className="section-title mb-16">Member QR Code</div>
            <img src={result.qrCode.qrImageData} alt="Member QR" className="qr-image" />
            <div className="qr-member-name">{result.member.name}</div>
            <div className="qr-sub-info">{result.subscription.plan_name}</div>
            <div className="qr-sub-info" style={{ marginTop: '4px' }}>
              Valid: {formatDate(result.subscription.start_date)} → {formatDate(result.subscription.end_date)}
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => {
                const link = document.createElement('a');
                link.download = `${result.member.name.replace(/\s/g, '_')}_QR.png`;
                link.href = result.qrCode.qrImageData;
                link.click();
              }}>⬇ Download QR</button>
              <button className="btn btn-primary" onClick={() => setResult(null)}>+ Activate Another</button>
              <button className="btn btn-secondary" onClick={() => navigate('/admin/members')}>← Members</button>
            </div>
          </div>

          <div className="card mt-16">
            <div className="section-title mb-12">Subscription Details</div>
            {[
              { label: 'Plan', value: result.subscription.plan_name },
              { label: 'Start Date', value: formatDate(result.subscription.start_date) },
              { label: 'End Date', value: formatDate(result.subscription.end_date) },
              { label: 'Amount', value: formatCurrency(result.subscription.amount_paid) },
              { label: 'Payment', value: result.subscription.payment_method },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">{label}</span>
                <span className="fw-600 text-primary" style={{ color: label === 'Amount' ? 'var(--green)' : undefined }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Activate Subscription</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/members')}>← Back</button>
      </div>

      <div className="page-content" style={{ maxWidth: '640px' }}>
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="section-title mb-16">1. Select Member</div>
            <div className="form-group">
              <label className="form-label">Search Member</label>
              <input
                type="text"
                className="form-input"
                placeholder="Type name or email..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Select Member *</label>
              <select className="form-input" value={form.member_id}
                onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))} required>
                <option value="">-- Select Member --</option>
                {filteredMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name} — {m.email}</option>
                ))}
              </select>
            </div>
            {selectedMember && (
              <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius)', fontSize: '13px' }}>
                <span className="text-muted">Selected: </span>
                <strong>{selectedMember.name}</strong>
                <span className="text-muted"> · {selectedMember.email}</span>
                {selectedMember.end_date && (
                  <span className="text-muted"> · Current expiry: {formatDate(selectedMember.end_date)}</span>
                )}
              </div>
            )}
          </div>

          <div className="card mt-16">
            <div className="section-title mb-16">2. Select Plan</div>
            <div style={{ display: 'grid', grid: 'auto / 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              {plans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => handlePlanChange(plan.id)}
                  style={{
                    border: `2px solid ${form.plan_id === plan.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.plan_id === plan.id ? 'var(--accent-glow)' : 'var(--bg-primary)',
                    borderRadius: 'var(--radius)',
                    padding: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="fw-600" style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>{plan.name}</div>
                  <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700' }}>
                    {formatCurrency(plan.price)}
                  </div>
                  <div className="text-xs text-muted">{plan.duration_days} days</div>
                  {plan.description && <div className="text-xs text-muted mt-4">{plan.description}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="card mt-16">
            <div className="section-title mb-16">3. Set Dates & Payment</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input type="date" className="form-input" value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Calculated End Date</label>
                <input type="text" className="form-input" value={getEndDate() ? formatDate(getEndDate()) : '(select plan first)'}
                  readOnly style={{ cursor: 'default', color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-input" value={form.payment_method}
                  onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <input type="text" className="form-input" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes..." />
              </div>
            </div>
          </div>

          {/* Summary */}
          {selectedPlan && form.member_id && (
            <div className="card mt-16" style={{ border: '1px solid var(--accent)', background: 'var(--accent-glow)' }}>
              <div className="section-title mb-12" style={{ color: 'var(--accent)' }}>Activation Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div className="flex-between"><span className="text-muted">Member</span><strong>{selectedMember?.name}</strong></div>
                <div className="flex-between"><span className="text-muted">Plan</span><strong>{selectedPlan.name}</strong></div>
                <div className="flex-between"><span className="text-muted">Duration</span><strong>{selectedPlan.duration_days} days</strong></div>
                <div className="flex-between"><span className="text-muted">Period</span><strong>{formatDate(form.start_date)} → {formatDate(getEndDate())}</strong></div>
                <div className="flex-between"><span className="text-muted">Amount</span><strong className="text-green">{formatCurrency(selectedPlan.price)}</strong></div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <><span className="loading-spinner" style={{ width: '14px', height: '14px' }} /> Processing...</> : '⚡ Activate & Generate QR'}
            </button>
            <button type="button" className="btn btn-secondary btn-lg"
              onClick={() => navigate('/admin/members')}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ActivatePage;
