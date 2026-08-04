import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Share2, Globe, Lock, Trash2,
  CheckCircle, AlertTriangle, XCircle, Copy, Users
} from 'lucide-react';
import { reportsAPI } from '../utils/api';
import useAdaptiveTheme from '../hooks/useAdaptiveTheme';
import Layout from '../components/ui/Layout';

const LABEL_CONFIG = {
  safe:           { icon: CheckCircle,   color: '#16a34a', bg: '#f0fdf4', label: 'Safe' },
  suspicious:     { icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', label: 'Suspicious' },
  likely_scam:    { icon: XCircle,       color: '#dc2626', bg: '#fef2f2', label: 'Likely Scam' },
  confirmed_scam: { icon: XCircle,       color: '#7f1d1d', bg: '#fef2f2', label: 'Confirmed Scam' },
};

const ScoreBadge = ({ label, score }) => {
  const cfg = LABEL_CONFIG[label] || LABEL_CONFIG.suspicious;
  const Icon = cfg.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
      <Icon size={12} /> {cfg.label} · {score}
    </span>
  );
};

const ReportCard = ({ report, onDelete, onTogglePublic, theme }) => {
  const inv = report.investigationId;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const url = `${window.location.origin}/reports/public/${report.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 18px', marginBottom: 12 }}>
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {report.title}
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
            {new Date(report.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {report.viewCount > 0 && ` · ${report.viewCount} views`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {/* Public toggle */}
          <button
            onClick={() => onTogglePublic(report)}
            title={report.isPublic ? 'Make private' : 'Make public'}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: report.isPublic ? '#f0fdf4' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {report.isPublic ? <Globe size={14} color="#16a34a" /> : <Lock size={14} color="#94a3b8" />}
          </button>
          {/* Copy share link */}
          {report.isPublic && report.shareToken && (
            <button onClick={copyLink}
              title="Copy share link"
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {copied ? <CheckCircle size={14} color="#16a34a" /> : <Copy size={14} color="#64748b" />}
            </button>
          )}
          {/* Delete */}
          <button onClick={() => onDelete(report._id)}
            title="Delete report"
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={14} color="#94a3b8" />
          </button>
        </div>
      </div>

      {/* Investigation summary */}
      {inv && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <ScoreBadge label={inv.trustScore?.label} score={inv.trustScore?.score} />
          <span style={{ fontSize: '0.78rem', color: '#64748b', background: '#f1f5f9', padding: '3px 9px', borderRadius: 20 }}>
            {inv.scamDNA?.scamType?.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {/* Tags */}
      {report.tags?.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {report.tags.map(t => (
            <span key={t} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, background: `${theme.primaryColor}10`, color: theme.primaryColor, fontWeight: 500 }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Summary */}
      {report.summary && (
        <p style={{ fontSize: '0.83rem', color: '#475569', marginTop: 8, lineHeight: 1.5 }}>{report.summary}</p>
      )}
    </div>
  );
};

const ReportsPage = () => {
  const { theme } = useAdaptiveTheme();
  const [reports, setReports]           = useState([]);
  const [sharedReports, setSharedReports] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('mine');
  const [toast, setToast]               = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadReports = useCallback(async () => {
    try {
      const [myRes, sharedRes] = await Promise.all([
        reportsAPI.getMyReports(),
        reportsAPI.getSharedWithMe()
      ]);
      setReports(myRes.data.data);
      setSharedReports(sharedRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await reportsAPI.delete(id);
      setReports(prev => prev.filter(r => r._id !== id));
      showToast('Report deleted');
    } catch { showToast('Could not delete'); }
  };

  const handleTogglePublic = async (report) => {
    try {
      const { data } = await reportsAPI.update(report._id, { isPublic: !report.isPublic });
      setReports(prev => prev.map(r => r._id === report._id ? data.data : r));
      showToast(data.data.isPublic ? 'Report is now public — share the link!' : 'Report is now private');
    } catch { showToast('Could not update visibility'); }
  };

  const TABS = [
    { id: 'mine',   label: 'My Reports',       count: reports.length },
    { id: 'shared', label: 'Shared with me',   count: sharedReports.length },
  ];

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${theme.primaryColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} color={theme.primaryColor} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Reports</h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Saved investigations you can share</p>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div style={{ background: `${theme.primaryColor}08`, border: `1px solid ${theme.primaryColor}20`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Share2 size={16} color={theme.primaryColor} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>
            Save any investigation as a report. Make it <strong>public</strong> to get a shareable link, or share it directly with your <strong>TrustCircle</strong> contacts.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#0f172a' : '#64748b',
                fontWeight: activeTab === tab.id ? 600 : 400, fontSize: '0.85rem',
                fontFamily: 'Inter, sans-serif',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
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

        {/* My Reports */}
        {activeTab === 'mine' && (
          <div>
            {loading ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading...</p>
            ) : reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <FileText size={36} color="#e2e8f0" style={{ margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontWeight: 500, color: '#94a3b8', margin: '0 0 4px' }}>No saved reports yet</p>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>After investigating a message, save it as a report to see it here</p>
              </div>
            ) : (
              reports.map(r => (
                <ReportCard key={r._id} report={r} onDelete={handleDelete} onTogglePublic={handleTogglePublic} theme={theme} />
              ))
            )}
          </div>
        )}

        {/* Shared with me */}
        {activeTab === 'shared' && (
          <div>
            {sharedReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <Users size={36} color="#e2e8f0" style={{ margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontWeight: 500, color: '#94a3b8', margin: '0 0 4px' }}>Nothing shared with you yet</p>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>Reports shared by your TrustCircle contacts will appear here</p>
              </div>
            ) : (
              sharedReports.map(r => (
                <div key={r._id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 18px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${theme.primaryColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: theme.primaryColor, flexShrink: 0 }}>
                      {r.userId?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>{r.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Shared by {r.userId?.name}</div>
                    </div>
                  </div>
                  {r.investigationId && (
                    <ScoreBadge label={r.investigationId.trustScore?.label} score={r.investigationId.trustScore?.score} />
                  )}
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
            zIndex: 9999, whiteSpace: 'nowrap'
          }}>
            {toast}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportsPage;
