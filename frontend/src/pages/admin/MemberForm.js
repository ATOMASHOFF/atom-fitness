import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const MemberForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', gender: '',
    date_of_birth: '', address: '', emergency_contact: '', emergency_phone: '', profile_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      const load = async () => {
        try {
          const res = await api.get(`/members/${id}`);
          const m = res.data.member;
          setForm({
            name: m.name || '', email: m.email || '', phone: m.phone || '',
            password: '', gender: m.gender || '',
            date_of_birth: m.date_of_birth ? m.date_of_birth.split('T')[0] : '',
            address: m.address || '', emergency_contact: m.emergency_contact || '',
            emergency_phone: m.emergency_phone || '', profile_notes: m.profile_notes || ''
          });
        } catch {
          toast.error('Failed to load member');
        } finally {
          setFetching(false);
        }
      };
      load();
    }
  }, [id, isEdit]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!isEdit && !form.password) {
      toast.error('Password is required for new member');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if (isEdit) {
        await api.put(`/members/${id}`, payload);
        toast.success('Member updated successfully');
      } else {
        const res = await api.post('/members', payload);
        toast.success('Member created successfully');
        navigate(`/admin/members/${res.data.member.id}`);
        return;
      }
      navigate(`/admin/members/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save member');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="loading-full">
      <div className="loading-spinner" style={{ width: '32px', height: '32px' }} />
    </div>
  );

  return (
    <>
      <div className="top-header">
        <h1 className="page-title">{isEdit ? 'Edit Member' : 'Add New Member'}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/members')}>← Back</button>
      </div>

      <div className="page-content" style={{ maxWidth: '720px' }}>
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="section-title mb-16">Basic Information</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" value={form.name}
                  onChange={e => update('name', e.target.value)} placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" className="form-input" value={form.email}
                  onChange={e => update('email', e.target.value)} placeholder="john@example.com"
                  required disabled={isEdit} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" className="form-input" value={form.phone}
                  onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div className="form-group">
                <label className="form-label">{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" className="form-input" value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder={isEdit ? 'Leave blank to keep current' : 'Min 6 characters'}
                  required={!isEdit} minLength={form.password ? 6 : undefined} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-input" value={form.gender} onChange={e => update('gender', e.target.value)}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-input" value={form.date_of_birth}
                  onChange={e => update('date_of_birth', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-input" rows={2} value={form.address}
                onChange={e => update('address', e.target.value)} placeholder="Full address" />
            </div>
          </div>

          <div className="card mt-16">
            <div className="section-title mb-16">Emergency Contact</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input type="text" className="form-input" value={form.emergency_contact}
                  onChange={e => update('emergency_contact', e.target.value)} placeholder="Emergency contact name" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input type="tel" className="form-input" value={form.emergency_phone}
                  onChange={e => update('emergency_phone', e.target.value)} placeholder="Emergency phone" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Profile Notes</label>
              <textarea className="form-input" rows={2} value={form.profile_notes}
                onChange={e => update('profile_notes', e.target.value)} placeholder="Health conditions, goals, notes..." />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <><span className="loading-spinner" style={{ width: '14px', height: '14px' }} /> Saving...</> : `${isEdit ? '✓ Update' : '✓ Create'} Member`}
            </button>
            <button type="button" className="btn btn-secondary btn-lg"
              onClick={() => navigate('/admin/members')}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default MemberForm;
