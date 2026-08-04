import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, AlertTriangle, XCircle, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { profileAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import useAdaptiveTheme from '../hooks/useAdaptiveTheme';
import Layout from '../components/ui/Layout';

const StatCard = ({ icon: Icon, label, value, color, loading }) => (
  <div style={{
    background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14
  }}>
    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
        {loading ? <span style={{ color: '#e2e8f0' }}>—</span> : value}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const TIPS = {
  senior: [
    'Banks and government agencies never ask for your password or OTP over message.',
    'If someone is pressuring you to act fast — stop. That is a warning sign.',
    'Always verify unexpected calls through the official phone number on their website.',
    'When in doubt, ask a trusted family member or paste it here first.',
  ],
  student: [
    "That job offer that found you on Instagram? Investigate it here before responding.",
    'Free gift cards, prizes, or exclusive deals are almost always scams.',
    'Check any link before you click — especially shortened ones like bit.ly.',
    "If a person online is asking for money after a short time, it's likely a romance scam.",
  ],
  teen: [
    "If someone online is offering money, gifts, or opportunities — it's probably a trap.",
    'Verify before you click any link, even from accounts that look legit.',
    "Anyone pushing you to keep a conversation secret is a red flag.",
    'Screenshot suspicious messages and drop them here — takes 10 seconds.',
  ],
  professional: [
    'Spear phishing targets you specifically — verify sender domains carefully.',
    'BEC (Business Email Compromise) often spoofs internal domains by one character.',
    'Urgent wire transfer requests should always be verified via a secondary channel.',
    'Check SPF/DKIM headers on suspicious emails before acting.',
  ],
};

const DashboardPage = () => {
  const { user } = useAuth();
  const { theme } = useAdaptiveTheme();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await profileAPI.getProfile();
        setStats(data.data.stats);
      } catch (err) {
        console.error('Could not load stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const scamsCaught = stats ? (stats.likely_scam || 0) + (stats.confirmed_scam || 0) : 0;
  const tips = TIPS[user?.profileType] || TIPS.professional;

  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>{theme.welcomeMessage}</p>
        </div>

        <Link to="/investigate" style={{ textDecoration: 'none' }}>
          <div style={{
            background: theme.primaryColor, borderRadius: 16, padding: '20px 24px',
            marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
          }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>Investigate a message</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem' }}>Paste anything suspicious — we'll analyse it in seconds</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Search size={20} color="#fff" />
              <ArrowRight size={20} color="#fff" />
            </div>
          </div>
        </Link>

        <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Your activity</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          <StatCard icon={Shield}        label="Total analyses" value={stats?.total      ?? 0} color="#0f172a" loading={loading} />
          <StatCard icon={CheckCircle}   label="Safe messages"  value={stats?.safe       ?? 0} color="#16a34a" loading={loading} />
          <StatCard icon={AlertTriangle} label="Suspicious"     value={stats?.suspicious ?? 0} color="#d97706" loading={loading} />
          <StatCard icon={XCircle}       label="Scams caught"   value={scamsCaught}             color="#dc2626" loading={loading} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
          <Link to="/history" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <Clock size={18} color="#64748b" />
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>View history</span>
              <ArrowRight size={14} color="#94a3b8" style={{ marginLeft: 'auto' }} />
            </div>
          </Link>
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <Shield size={18} color="#64748b" />
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>Edit profile</span>
              <ArrowRight size={14} color="#94a3b8" style={{ marginLeft: 'auto' }} />
            </div>
          </Link>
        </div>

        {theme.showTips && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>🛡️ Stay protected</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {tips.map((tip, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i < tips.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ color: theme.primaryColor, fontWeight: 700, flexShrink: 0, minWidth: 18 }}>{i + 1}.</span>
                  <span style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.55 }}>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default DashboardPage;
