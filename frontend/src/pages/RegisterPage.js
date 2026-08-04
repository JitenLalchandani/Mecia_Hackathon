import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PROFILE_TYPES = [
  { value: 'senior', label: '👴 Senior', desc: 'Larger text, simpler guidance' },
  { value: 'student', label: '🎓 Student', desc: 'Casual, quick alerts' },
  { value: 'professional', label: '💼 Professional', desc: 'Technical, compact' },
  { value: 'teen', label: '🧑 Teen', desc: 'Bold, direct warnings' }
];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', profileType: 'professional' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: '#0f172a', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Create your account</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Your personal scam protection starts here</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28 }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: '0.88rem' }}>{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Full name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 characters"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
            </div>

            {/* Profile type */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                Who are you? <span style={{ fontWeight: 400, color: '#94a3b8' }}>— sets your UI experience</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PROFILE_TYPES.map(({ value, label, desc }) => (
                  <button key={value} type="button" onClick={() => setForm({ ...form, profileType: value })}
                    style={{
                      padding: '10px 12px', borderRadius: 10, textAlign: 'left',
                      border: form.profileType === value ? '2px solid #0f172a' : '1.5px solid #e2e8f0',
                      background: form.profileType === value ? '#0f172a08' : '#fff',
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                    }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>{label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: loading ? '#94a3b8' : '#0f172a', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.88rem', color: '#64748b' }}>
            Already have an account? <Link to="/login" style={{ color: '#0f172a', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
