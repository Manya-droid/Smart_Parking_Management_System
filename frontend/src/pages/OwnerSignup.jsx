import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { saveOwnerAuth } from '../utils/authStorage';
import {
  validateName, validateEmail, validatePassword,
  validatePhone, validateVehicleNumber, validateVehicleType,
} from '../utils/validators';

export default function OwnerSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    phoneNumber: '', vehicleNumber: '', vehicleType: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    const newErrors = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm: form.password !== form.confirm ? 'Passwords do not match' : '',
      phoneNumber: validatePhone(form.phoneNumber),
      vehicleNumber: validateVehicleNumber(form.vehicleNumber),
      vehicleType: validateVehicleType(form.vehicleType),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      await axiosClient.post('/auth/owner/register', {
        name: form.name.trim(),
        email,
        password: form.password,
        phoneNumber: form.phoneNumber.trim(),
        vehicleNumber: form.vehicleNumber.trim().toUpperCase().replace(/\s/g, ''),
        vehicleType: form.vehicleType,
      });
      const res = await axiosClient.post('/auth/owner/login', { email, password: form.password });
      saveOwnerAuth(res.data.token, res.data.owner);
      navigate('/owner/home');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Sign up failed. Please try again.');
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
    <div className="page-container">
      <h1 className="page-title">Create Account</h1>
      <p className="page-subtitle">Sign up with your email</p>

      <form onSubmit={handleSubmit} noValidate>
        {submitError && <div className="error-text" style={{ marginBottom: 16 }}>{submitError}</div>}
        {field('name', 'Full Name', 'text', 'e.g. Rahul Sharma')}
        {field('email', 'Email', 'email', 'you@example.com')}
        {field('password', 'Password', 'password', 'At least 8 characters')}
        {field('confirm', 'Confirm Password', 'password', 'Re-enter password')}
        {field('phoneNumber', 'Phone Number', 'text', 'e.g. 9876543210')}
        {field('vehicleNumber', 'Vehicle Number', 'text', 'e.g. DL1AB1234')}

        <div className="form-group">
          <label className="form-label">Vehicle Type</label>
          <select
            name="vehicleType"
            className={`form-input ${errors.vehicleType ? 'input-error' : ''}`}
            value={form.vehicleType}
            onChange={handleChange}
          >
            <option value="">Select type</option>
            <option value="car">Car</option>
            <option value="bike">Bike</option>
            <option value="ev">EV</option>
            <option value="disabled">Accessible / Disabled</option>
          </select>
          {errors.vehicleType && <div className="error-text">{errors.vehicleType}</div>}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <div className="link-row">
        Already have an account? <Link to="/owner/login">Login</Link>
      </div>
    </div>
  );
}