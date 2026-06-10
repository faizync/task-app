// src/pages/Register.js
// Register form — calls POST /api/auth/register

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Register</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label>Name</label>
            <input style={styles.input} type="text" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div style={styles.field}>
            <label>Email</label>
            <input style={styles.input} type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div style={styles.field}>
            <label>Password</label>
            <input style={styles.input} type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#fff', padding: 32, borderRadius: 8, width: 360, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  title: { textAlign: 'center', marginBottom: 24 },
  field: { marginBottom: 16 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 4, marginTop: 4, boxSizing: 'border-box', fontSize: 14 },
  btn: { width: '100%', padding: '10px', background: '#1677ff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 15 },
  error: { background: '#fff2f0', border: '1px solid #ffccc7', padding: 8, borderRadius: 4, marginBottom: 12, color: '#cf1322' },
};
