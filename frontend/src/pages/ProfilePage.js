import React, { useState, useEffect } from 'react';
import { User, Shield, CheckCircle, AlertTriangle, XCircle, Save } from 'lucide-react';
import { profileAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import useAdaptiveTheme from '../hooks/useAdaptiveTheme';
import Layout from '../components/ui/Layout';

const PROFILE_TYPES = [
  { value: 'senior',       emoji: '👴', label: 'Senior',       desc: 'Larger text, simpler guidance' },
  { value: 'student',      emoji: '🎓', label: 'Student',      desc: 'Casual tone, quick alerts' },
  { value: 'professional', emoji: '💼', label: 'Professional', desc: 'Technical, compact view' },
  { value: 'teen',         emoji: '🎮', label: 'Teen Gamer',   desc: 'Neon alerts, bold game-style warnings' },
];

const StatBox = ({ icon: Icon, label, value, color }) => (
  <div style={{
    background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12
  }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { theme } = useAdaptiveTheme();

  const [profileType, setProfileType] = useState(user?.profileType || 'professional');
  const [name, setName]               = useState(user?.name || '');
  const [stats, setStats]             = useState(null);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await profileAPI.getProfile();
        setStats(data.data.stats);
      } catch (err) {
        console.error('Could not load stats:', err);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await profileAPI.updateProfile({ name, profileType });
      updateUser(data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${theme.primaryColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={22} color={theme.primaryColor} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Your profile</h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Manage your account and UI experience</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Investigation stats
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <StatBox icon={Shield}        label="Total analyses"  value={stats.total}          color="#0f172a" />
              <StatBox icon={CheckCircle}   label="Safe"            value={stats.safe}            color="#16a34a" />
              <StatBox icon={AlertTriangle} label="Suspicious"      value={stats.suspicious}      color="#d97706" />
              <StatBox icon={XCircle}       label="Scams caught"    value={(stats.likely_scam || 0) + (stats.confirmed_scam || 0)} color="#dc2626" />
            </div>
          </div>
        )}

        {/* Edit form */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
            Account details
          </h2>

          {/* Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Full name
            </label>
            <input
              type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
            />
          </div>

          {/* Email (read-only) */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Email <span style={{ color: '#94a3b8', fontWeight: 400 }}>(cannot be changed)</span>
            </label>
            <input
              type="email" value={user?.email || ''} disabled
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.95rem', background: '#f8fafc', color: '#94a3b8', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
            />
          </div>

          {/* Profile type */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              UI experience
              <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>— changes how the app looks and talks to you</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PROFILE_TYPES.map(({ value, emoji, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setProfileType(value)}
                  style={{
                    padding: '12px 14px', borderRadius: 10, textAlign: 'left',
                    border: profileType === value ? `2px solid ${theme.primaryColor}` : '1.5px solid #e2e8f0',
                    background: profileType === value ? `${theme.primaryColor}08` : '#fff',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{emoji} {label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '11px', borderRadius: 10, border: 'none',
              background: saved ? '#16a34a' : (saving ? '#94a3b8' : theme.primaryColor),
              color: '#fff', fontSize: '0.95rem', fontWeight: 600,
              cursor: saving ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif',
              transition: 'background 0.3s'
            }}
          >
            {saved ? (
              <><CheckCircle size={16} /> Saved!</>
            ) : saving ? (
              'Saving...'
            ) : (
              <><Save size={16} /> Save changes</>
            )}
          </button>
        </div>

      </div>
    </Layout>
  );
};

export default ProfilePage;
