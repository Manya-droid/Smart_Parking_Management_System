// src/components/AddStaffForm.jsx
import { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { validateName, validateEmail, validatePassword } from '../utils/validators';

export default function AddStaffForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function openForm() {
    setSuccess('');
    setSubmitError('');
    setErrors({});
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSuccess('');

    const newErrors = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    try {
      const res = await axiosClient.post('/auth/staff/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setSuccess(`Staff account created for ${res.data.email}`);
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Could not create staff account.');
    } finally {
      setLoading(false);
    }
  }

  const field = (name, label, type, placeholder) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type={type}
        name={name}
        className={`form-input ${errors[name] ? 'input-error' : ''}`}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {errors[name] && <div className="error-text">{errors[name]}</div>}
    </div>
  );

  return (
    <>
      <button
        className="btn-primary"
        style={{ width: 'auto', padding: '6px 16px', fontSize: 13 }}
        onClick={openForm}
      >
        ＋ Add staff
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <form
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            noValidate
          >
            <h3 style={{ margin: '0 0 12px' }}>New staff account</h3>

            {submitError && <div className="error-text" style={{ marginBottom: 12 }}>{submitError}</div>}
            {success && <div className="success-banner" style={{ marginBottom: 12 }}>{success}</div>}

            {field('name', 'Full Name', 'text', 'e.g. Amit Verma')}
            {field('email', 'Email', 'email', 'staff@example.com')}
            {field('password', 'Temporary Password', 'password', 'At least 8 characters')}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create staff account'}
              </button>
              <button type="button" className="cancel-btn" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}