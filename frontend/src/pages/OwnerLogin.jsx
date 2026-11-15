import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { saveOwnerAuth } from '../utils/authStorage';

export default function OwnerLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const res = await axiosClient.post('/auth/owner/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      saveOwnerAuth(res.data.token, res.data.owner);
      navigate('/owner/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Vehicle Owner Login</h1>
      <p className="page-subtitle">Login with your email</p>

      <form onSubmit={handleSubmit} noValidate>
        {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" name="email" className="form-input" value={form.email}
                 onChange={handleChange} placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input type="password" name="password" className="form-input" value={form.password}
                 onChange={handleChange} placeholder="••••••••" />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="link-row">
        New here? <Link to="/owner/signup">Create an account</Link>
      </div>
    </div>
  );
}