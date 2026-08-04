import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock, Shield, AlertTriangle, XCircle, CheckCircle,
  ChevronDown, ChevronUp, BookmarkPlus, BookmarkCheck,
  Search, Filter
} from 'lucide-react';
import { investigationAPI, reportsAPI } from '../utils/api';
import useAdaptiveTheme from '../hooks/useAdaptiveTheme';
import Layout from '../components/ui/Layout';

const LABEL_CONFIG = {
  safe:           { icon: CheckCircle,   color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: 'Safe'           },
  suspicious:     { icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fcd34d', label: 'Suspicious'     },
  likely_scam:    { icon: XCircle,       color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', label: 'Likely Scam'   },
  confirmed_scam: { icon: XCircle,       color: '#7f1d1d', bg: '#fef2f2', border: '#ef4444', label: 'Confirmed Scam' },
};

const ACTION_LABELS = {
  safe_to_proceed:      'Safe to proceed',
  proceed_with_caution: 'Proceed with caution',
  do_not_respond:       'Do not respond',
  block_and_report:     'Block and report',
};

// ── Single investigation row (collapsible) ────────────────────────────────────
const InvestigationRow = ({ inv, theme }) => {
  const [expanded, setExpanded]   = useState(false);
  const [fullData, setFullData]   = useState(null);
  const [loading,  setLoading]    = useState(false);
  const [saved,    setSaved]      = useState(false);
  const [saving,   setSaving]     = useState(false);

  const cfg  = LABEL_CONFIG[inv.trustScore?.label] || LABEL_CONFIG.suspicious;
  const Icon = cfg.icon;

  const handleExpand = async () => {
    setExpanded(prev => !prev);
    if (!fullData && !loading) {
      setLoading(true);
      try {
        const { data } = await investigationAPI.getById(inv._id);
        setFullData(data.data);
      } catch { /* silently fail — show what we have */ }
      finally { setLoading(false); }
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    setSaving(true);
    try {
      await reportsAPI.create({
        investigationId: inv._id,
        title: `${inv.scamDNA?.scamType?.replace(/_/g, ' ')} — ${new Date(inv.createdAt).toLocaleDateString()}`,
        tags: inv.scamDNA?.patterns || [],
        isPublic: false
      });
      setSaved(true);
    } catch (err) {
      if (err.response?.status === 409) setSaved(true);
    } finally { setSaving(false); }
  };

  const detail = fullData || inv;

  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: `1px solid ${expanded ? cfg.color + '40' : '#e2e8f0'}`,
      marginBottom: 10, overflow: 'hidden',
      transition: 'border-color 0.2s'
    }}>
      {/* Row header — always visible */}
      <div
        onClick={handleExpand}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer' }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 10, background: cfg.bg, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={18} color={cfg.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', background: '#0f172a', padding: '1px 8px', borderRadius: 20 }}>
              {inv.trustScore?.score}/100
            </span>
            {inv.scamDNA?.scamType && inv.scamDNA.scamType !== 'legitimate' && (
              <span style={{ fontSize: '0.72rem', color: '#64748b', background: '#f1f5f9', padding: '1px 8px', borderRadius: 20, textTransform: 'capitalize' }}>
                {inv.scamDNA.scamType.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            {new Date(inv.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}
            {new Date(inv.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            {' · '}
            <span style={{ textTransform: 'capitalize' }}>{inv.inputType?.replace('_', ' ')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Save as report button */}
          <button
            onClick={handleSave}
            disabled={saving || saved}
            title={saved ? 'Saved to reports' : 'Save as report'}
            style={{
              width: 30, height: 30, borderRadius: 8, border: `1px solid ${saved ? '#16a34a' : '#e2e8f0'}`,
              background: saved ? '#f0fdf4' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >
            {saved
              ? <BookmarkCheck size={14} color="#16a34a" />
              : <BookmarkPlus  size={14} color="#94a3b8" />
            }
          </button>
          {expanded ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9' }}>
          {loading ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '12px 0' }}>Loading details...</p>
          ) : (
            <>
              {/* Explanation */}
              {detail.trustScore?.explanation && (
                <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: '10px 14px', margin: '12px 0 10px' }}>
                  <p style={{ fontSize: '0.87rem', color: '#334155', margin: 0, lineHeight: 1.6 }}>
                    {detail.trustScore.explanation}
                  </p>
                </div>
              )}

              {/* Recommendation */}
              {detail.recommendation && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Shield size={13} color={theme.primaryColor} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {ACTION_LABELS[detail.recommendation.action] || detail.recommendation.action}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: '#475569', margin: '0 0 8px', lineHeight: 1.55 }}>
                    {detail.recommendation.advice}
                  </p>
                  {detail.recommendation.steps?.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {detail.recommendation.steps.map((step, i) => (
                        <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: '0.83rem', color: '#64748b' }}>
                          <span style={{
                            minWidth: 20, height: 20, borderRadius: '50%',
                            background: `${theme.primaryColor}18`, color: theme.primaryColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 700, flexShrink: 0
                          }}>{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Evidence & red flags */}
              {detail.scamDNA?.redFlags?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Red flags detected</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {detail.scamDNA.redFlags.map((flag, i) => (
                      <span key={i} style={{
                        fontSize: '0.73rem', padding: '3px 9px', borderRadius: 20,
                        background: '#fef2f2', color: '#dc2626', fontWeight: 500
                      }}>{flag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Input text preview */}
              {detail.inputText && (
                <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>Original input</p>
                  <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0, lineHeight: 1.5, maxHeight: 80, overflow: 'hidden' }}>
                    {detail.inputText}
                  </p>
                </div>
              )}

              <p style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: 10, marginBottom: 0 }}>
                Analysed by {detail.aiModel || 'rule-based'} · {detail.processingTime}ms
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const HistoryPage = () => {
  const { theme }                       = useAdaptiveTheme();
  const [investigations, setInvestigations] = useState([]);
  const [filtered,       setFiltered]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchQ,        setSearchQ]        = useState('');
  const [filterLabel,    setFilterLabel]    = useState('all');
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(false);

  const load = useCallback(async (pageNum = 1, append = false) => {
    try {
      const { data } = await investigationAPI.getHistory(pageNum, 15);
      const items = data.data;
      setInvestigations(prev => append ? [...prev, ...items] : items);
      setHasMore(data.pagination.page < data.pagination.pages);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, [load]);

  // Filter + search
  useEffect(() => {
    let result = [...investigations];
    if (filterLabel !== 'all') {
      result = result.filter(i => i.trustScore?.label === filterLabel);
    }
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      result = result.filter(i =>
        i.scamDNA?.scamType?.includes(q) ||
        i.trustScore?.label?.includes(q) ||
        i.scamDNA?.patterns?.some(p => p.includes(q))
      );
    }
    setFiltered(result);
  }, [investigations, filterLabel, searchQ]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next, true);
  };

  const FILTERS = [
    { v: 'all',           label: 'All'        },
    { v: 'safe',          label: '✅ Safe'     },
    { v: 'suspicious',    label: '⚠️ Sus'      },
    { v: 'likely_scam',   label: '🚩 Likely'  },
    { v: 'confirmed_scam',label: '🛑 Confirmed'},
  ];

  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${theme.primaryColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} color={theme.primaryColor} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Investigation History</h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              {investigations.length} past analysis{investigations.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>

        {/* Search + filter */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search by scam type or pattern..."
              style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f.v} onClick={() => setFilterLabel(f.v)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500,
                  border: filterLabel === f.v ? `2px solid ${theme.primaryColor}` : '1px solid #e2e8f0',
                  background: filterLabel === f.v ? `${theme.primaryColor}10` : '#fff',
                  color: filterLabel === f.v ? theme.primaryColor : '#64748b',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading history...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <Clock size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontWeight: 500, color: '#94a3b8', margin: '0 0 4px' }}>
              {investigations.length === 0 ? 'No investigations yet' : 'No results match your filter'}
            </p>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
              {investigations.length === 0
                ? 'Analyse a message to see results here'
                : 'Try changing your search or filter'}
            </p>
          </div>
        ) : (
          <>
            {filtered.map(inv => (
              <InvestigationRow key={inv._id} inv={inv} theme={theme} />
            ))}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', background: '#fff',
                  color: '#64748b', cursor: 'pointer', fontWeight: 500,
                  fontSize: '0.88rem', fontFamily: 'Inter, sans-serif', marginTop: 8
                }}>
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;
