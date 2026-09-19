import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Search, Clock, User, LogOut, Menu, X, Users, FileText, Network } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useAdaptiveTheme from '../../hooks/useAdaptiveTheme';

const NAV_ITEMS = [
  { path: '/dashboard',    icon: Shield,   label: 'Dashboard'     },
  { path: '/investigate',  icon: Search,   label: 'Investigate'   },
  { path: '/history',      icon: Clock,    label: 'History'       },
  { path: '/trust-circle', icon: Users,    label: 'TrustCircle'   },
  { path: '/reports',      icon: FileText, label: 'Reports'       },
  { path: '/network-scan', icon: Network,  label: 'Network Scan'  },
  { path: '/profile',      icon: User,     label: 'Profile'       },
];

const Layout = ({ children }) => {
  const { user, logout }   = useAuth();
  const { theme }          = useAdaptiveTheme();
  const location           = useLocation();
  const navigate           = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDarkTheme        = theme.bgColor.startsWith('#0') || theme.bgColor.startsWith('#1');

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bgColor, color: isDarkTheme ? '#e2e8f0' : '#0f172a' }}>

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: 240,
        background: isDarkTheme ? '#07130f' : '#fff',
        borderRight: isDarkTheme ? '1px solid rgba(74, 222, 128, 0.35)' : '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', padding: '24px 16px',
        position: 'sticky', top: 0, height: '100vh', zIndex: 10,
        boxShadow: isDarkTheme ? 'inset -1px 0 0 rgba(74,222,128,0.18), 0 0 18px rgba(74,222,128,0.08)' : 'none'
      }} className="desktop-sidebar">

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 8 }}>
          <div style={{ background: theme.primaryColor, borderRadius: 10, padding: 8 }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: isDarkTheme ? '#f8fafc' : '#0f172a' }}>CyberTwin</div>
            <div style={{ fontSize: '0.7rem', color: isDarkTheme ? '#94a3b8' : '#94a3b8', textTransform: 'capitalize' }}>{theme.label}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                  background: active ? `${theme.primaryColor}18` : 'transparent',
                  color: active ? theme.primaryColor : (isDarkTheme ? '#cbd5e1' : '#64748b'),
                  fontWeight: active ? 600 : 400, fontSize: '0.9rem',
                  transition: 'all 0.15s',
                  border: active ? `1px solid ${theme.primaryColor}44` : '1px solid transparent'
                }}>
                  <Icon size={18} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div style={{ borderTop: isDarkTheme ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid #e2e8f0', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingLeft: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `${theme.primaryColor}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: theme.primaryColor
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isDarkTheme ? '#f8fafc' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: isDarkTheme ? '#94a3b8' : '#94a3b8', textTransform: 'capitalize' }}>
                {user?.profileType}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none',
            color: isDarkTheme ? '#cbd5e1' : '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif'
          }}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile header ────────────────────────────────────────── */}
      <div style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: isDarkTheme ? '#0b1220' : '#fff', borderBottom: isDarkTheme ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid #e2e8f0',
        padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between', color: isDarkTheme ? '#f8fafc' : '#0f172a'
      }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: theme.primaryColor, borderRadius: 8, padding: 6 }}>
            <Shield size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, color: isDarkTheme ? '#f8fafc' : '#0f172a' }}>CyberTwin</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 56, left: 0, right: 0, bottom: 0,
          background: isDarkTheme ? '#07130f' : '#fff', zIndex: 49, padding: '16px', overflowY: 'auto',
          boxShadow: isDarkTheme ? 'inset 0 0 20px rgba(74,222,128,0.08)' : 'none'
        }} className="mobile-drawer">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 10, marginBottom: 4,
                  background: active ? `${theme.primaryColor}18` : 'transparent',
                  color: active ? theme.primaryColor : (isDarkTheme ? '#cbd5e1' : '#64748b'),
                  fontWeight: active ? 600 : 400, fontSize: '1rem',
                  border: active ? `1px solid ${theme.primaryColor}44` : '1px solid transparent'
                }}>
                  <Icon size={20} /> {label}
                </div>
              </Link>
            );
          })}
          <div style={{ borderTop: isDarkTheme ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid #e2e8f0', marginTop: 16, paddingTop: 16 }}>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '12px 16px', borderRadius: 10, border: 'none', background: 'none',
              color: isDarkTheme ? '#cbd5e1' : '#94a3b8', cursor: 'pointer', fontSize: '1rem', fontFamily: 'Inter, sans-serif'
            }}>
              <LogOut size={20} /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-header   { display: flex !important; }
          main { padding-top: 56px; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
