import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Search, Check, X,
  Clock, Shield, Trash2, Mail, ChevronRight
} from 'lucide-react';
import { trustCircleAPI } from '../utils/api';
import useAdaptiveTheme from '../hooks/useAdaptiveTheme';
import Layout from '../components/ui/Layout';

const PROFILE_ICONS = { senior: '👴', student: '🎓', professional: '💼', teen: '🧑' };

// ── Avatar initials ───────────────────────────────────────────────────────────
const Avatar = ({ name, color, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: `${color}20`, color, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.35
  }}>
    {name?.[0]?.toUpperCase()}
  </div>
);

// ── Section header ────────────────────────────────────────────────────────────
const SectionHead = ({ icon: Icon, title, count, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
    <Icon size={17} color={color} />
    <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{title}</h2>
    {count !== undefined && (
      <span style={{ marginLeft: 4, fontSize: '0.75rem', fontWeight: 600, padding: '1px 8px', borderRadius: 20, background: `${color}18`, color }}>
        {count}
      </span>
    )}
  </div>
);

const TrustCirclePage = () => {
  const { theme } = useAdaptiveTheme();

  const [circle, setCircle]       = useState([]);
  const [requests, setRequests]   = useState([]);
  const [searchQ, setSearchQ]     = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg]    = useState('');
  const [loading, setLoading]     = useState(true);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting]   = useState(false);
  const [toast, setToast]         = useState('');
  const [activeTab, setActiveTab] = useState('circle'); // circle | invite | requests

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadData = useCallback(async () => {
    try {
      const [circleRes, reqRes] = await Promise.all([
        trustCircleAPI.getMyCircle(),
        trustCircleAPI.getPendingRequests()
      ]);
      setCircle(circleRes.data.data);
      setRequests(reqRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Debounced user search
  useEffect(() => {
    if (searchQ.length < 3) { setSearchRes([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await trustCircleAPI.searchUsers(searchQ);
        setSearchRes(data.data);
      } catch { setSearchRes([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ]);

  const handleInvite = async (emailOverride) => {
    const target = emailOverride || inviteEmail;
    if (!target) return;
    setInviting(true);
    try {
      await trustCircleAPI.sendInvite({ email: target, message: inviteMsg });
      showToast(`Invite sent to ${target}`);
      setInviteEmail(''); setInviteMsg(''); setSearchQ(''); setSearchRes([]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not send invite');
    } finally { setInviting(false); }
  };

  const handleRespond = async (id, action) => {
    try {
      await trustCircleAPI.respondToRequest(id, action);
      showToast(action === 'accept' ? 'Added to your circle!' : 'Request declined');
      loadData();
    } catch (err) { showToast('Something went wrong'); }
  };

  const handleRemove = async (connectionId) => {
    if (!window.confirm('Remove this person from your circle?')) return;
    try {
      await trustCircleAPI.removeMember(connectionId);
      showToast('Removed from circle');
      loadData();
    } catch { showToast('Could not remove'); }
  };

  const TABS = [
    { id: 'circle',   label: 'My Circle',  count: circle.length },
    { id: 'invite',   label: 'Add People', count: null },
    { id: 'requests', label: 'Requests',   count: requests.length || null },
  ];

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${theme.primaryColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} color={theme.primaryColor} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>TrustCircle</h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Share alerts and investigations with people you trust</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#0f172a' : '#64748b',
                fontWeight: activeTab === tab.id ? 600 : 400, fontSize: '0.85rem',
                fontFamily: 'Inter, sans-serif',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{ background: theme.primaryColor, color: '#fff', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px' }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: My Circle ───────────────────────────────────────────── */}
        {activeTab === 'circle' && (
          <div>
            <SectionHead icon={Shield} title="Your trusted contacts" count={circle.length} color={theme.primaryColor} />
            {loading ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading...</p>
            ) : circle.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <Users size={36} color="#e2e8f0" style={{ margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontWeight: 500, color: '#94a3b8', margin: '0 0 4px' }}>Your circle is empty</p>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>Add trusted contacts to share scam alerts with them</p>
                <button onClick={() => setActiveTab('invite')}
                  style={{ marginTop: 16, padding: '9px 20px', borderRadius: 8, border: 'none', background: theme.primaryColor, color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  Add someone
                </button>
              </div>
            ) : (
              <div>
                {circle.map(({ connectionId, contact, since }) => (
                  <div key={connectionId} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Avatar name={contact.name} color={theme.primaryColor} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0f172a' }}>{contact.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 1 }}>
                        {contact.email} · {PROFILE_ICONS[contact.profileType]} {contact.profileType}
                      </div>
                    </div>
                    <button onClick={() => handleRemove(connectionId)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6, borderRadius: 6 }}
                      title="Remove from circle">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Add People ──────────────────────────────────────────── */}
        {activeTab === 'invite' && (
          <div>
            {/* Search existing users */}
            <SectionHead icon={Search} title="Find CyberTwin users" color={theme.primaryColor} />
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search by name or email..."
                style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
              />
            </div>

            {searchQ.length >= 3 && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 24 }}>
                {searching ? (
                  <p style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>Searching...</p>
                ) : searchRes.length === 0 ? (
                  <p style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>No users found</p>
                ) : searchRes.map(user => {
                  const statusLabels = { accepted: 'In circle', pending: 'Pending', declined: 'Declined', blocked: 'Blocked' };
                  const inCircle = user.connectionStatus === 'accepted';
                  return (
                    <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                      <Avatar name={user.name} color={theme.primaryColor} size={36} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>{user.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{user.email}</div>
                      </div>
                      {user.connectionStatus ? (
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>{statusLabels[user.connectionStatus]}</span>
                      ) : (
                        <button onClick={() => handleInvite(user.email)}
                          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: theme.primaryColor, color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Direct email invite */}
            <SectionHead icon={Mail} title="Invite by email" color="#64748b" />
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 18 }}>
              <input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                type="email" placeholder="their@email.com"
                style={{ width: '100%', padding: '9px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif', marginBottom: 10, boxSizing: 'border-box' }}
              />
              <input
                value={inviteMsg}
                onChange={e => setInviteMsg(e.target.value)}
                placeholder="Optional message..."
                style={{ width: '100%', padding: '9px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif', marginBottom: 12, boxSizing: 'border-box' }}
              />
              <button
                onClick={() => handleInvite()}
                disabled={!inviteEmail || inviting}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: (!inviteEmail || inviting) ? '#94a3b8' : theme.primaryColor, color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                {inviting ? 'Sending...' : 'Send invite'}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: Requests ────────────────────────────────────────────── */}
        {activeTab === 'requests' && (
          <div>
            <SectionHead icon={Clock} title="Pending requests" count={requests.length} color="#d97706" />
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <Clock size={36} color="#e2e8f0" style={{ margin: '0 auto 10px', display: 'block' }} />
                <p style={{ color: '#94a3b8', margin: 0 }}>No pending requests</p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req._id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: req.message ? 10 : 0 }}>
                    <Avatar name={req.requester?.name} color={theme.primaryColor} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{req.requester?.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{req.requester?.email}</div>
                    </div>
                  </div>
                  {req.message && (
                    <p style={{ fontSize: '0.85rem', color: '#475569', background: '#f8fafc', borderRadius: 8, padding: '8px 12px', margin: '8px 0', fontStyle: 'italic' }}>
                      "{req.message}"
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => handleRespond(req._id, 'accept')}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Check size={14} /> Accept
                    </button>
                    <button onClick={() => handleRespond(req._id, 'decline')}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <X size={14} /> Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: '#0f172a', color: '#fff', padding: '10px 20px', borderRadius: 10,
            fontSize: '0.88rem', fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 9999, whiteSpace: 'nowrap', animation: 'fadeIn 0.2s ease-out'
          }}>
            {toast}
          </div>
        )}

      </div>
    </Layout>
  );
};

export default TrustCirclePage;
