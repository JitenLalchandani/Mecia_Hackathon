import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: '#0f172a', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Welcome back</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Sign in to CyberTwin AI</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28 }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: '0.88rem' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: loading ? '#94a3b8' : '#0f172a', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.88rem', color: '#64748b' }}>
            Don't have an account? <Link to="/register" style={{ color: '#0f172a', fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
