import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';

const defaultForm = { name: '', duration_days: '', price: '', description: '' };

const PlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/subscriptions/plans');
      setPlans(res.data.plans);
    } catch { toast.error('Failed to load plans'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(defaultForm); setEditPlan(null); setShowModal(true); };
  const openEdit = (plan) => {
    setForm({ name: plan.name, duration_days: plan.duration_days, price: plan.price, description: plan.description || '' });
    setEditPlan(plan);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.duration_days || !form.price) {
      toast.error('Name, duration and price are required');
      return;
    }
    setSaving(true);
    try {
      if (editPlan) {
        await api.put(`/subscriptions/plans/${editPlan.id}`, form);
        toast.success('Plan updated');
      } else {
        await api.post('/subscriptions/plans', form);
        toast.success('Plan created');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate plan: ${name}?`)) return;
    try {
      await api.delete(`/subscriptions/plans/${id}`);
      toast.success('Plan deactivated');
      load();
    } catch { toast.error('Failed to deactivate plan'); }
  };

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">Membership Plans</h1>
        <button className="btn btn-primary" onClick={openAdd}>➕ Add Plan</button>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-full"><div className="loading-spinner" style={{ width: '32px', height: '32px' }} /></div>
        ) : (
          <div className="grid-2">
            {plans.map(plan => (
              <div className="card" key={plan.id} style={{ position: 'relative', borderTop: '3px solid var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {plan.name}
                    </div>
                    <div className="text-muted text-sm">{plan.description || 'No description'}</div>
                  </div>
                  <span className={`badge ${plan.is_active ? 'badge-active' : 'badge-expired'}`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700', color: 'var(--accent)' }}>
                      {formatCurrency(plan.price)}
                    </div>
                    <div className="text-xs text-muted">PRICE</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>
                      {plan.duration_days}
                    </div>
                    <div className="text-xs text-muted">DAYS</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>
                      {(plan.duration_days / 30).toFixed(1)}
                    </div>
                    <div className="text-xs text-muted">MONTHS</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(plan)}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(plan.id, plan.name)}>Deactivate</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && plans.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No plans yet</div>
            <button className="btn btn-primary mt-16" onClick={openAdd}>Create First Plan</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editPlan ? 'Edit Plan' : 'Create Plan'}</div>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Plan Name *</label>
                  <input type="text" className="form-input" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Monthly, Annual" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Duration (Days) *</label>
                    <input type="number" className="form-input" value={form.duration_days}
                      onChange={e => setForm({ ...form, duration_days: e.target.value })}
                      placeholder="30" min="1" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input type="number" className="form-input" value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      placeholder="2000" min="0" step="0.01" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={2} value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Plan description (optional)" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editPlan ? 'Update Plan' : 'Create Plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PlansPage;
