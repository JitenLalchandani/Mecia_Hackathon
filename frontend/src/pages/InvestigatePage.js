import React, { useState } from 'react';
import { Shield, Search, AlertTriangle, CheckCircle, XCircle, Loader, ChevronDown, ChevronUp, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { investigationAPI, reportsAPI } from '../utils/api';
import useAdaptiveTheme from '../hooks/useAdaptiveTheme';
import Layout from '../components/ui/Layout';

const TrustScoreRing = ({ score, label }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorMap = {
    safe: '#16a34a',
    suspicious: '#d97706',
    likely_scam: '#dc2626',
    confirmed_scam: '#7f1d1d'
  };
  const color = colorMap[label] || '#64748b';

  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>Trust Score</span>
      </div>
    </div>
  );
};

const EvidenceCard = ({ evidence }) => {
  const severityColors = {
    low: '#16a34a', medium: '#d97706', high: '#dc2626', critical: '#7f1d1d'
  };
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
      padding: '10px 14px', marginBottom: 8
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize', color: '#0f172a' }}>
          {evidence.type.replace('_', ' ')}
        </span>
        <span style={{
          fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
          background: `${severityColors[evidence.severity]}18`,
          color: severityColors[evidence.severity]
        }}>
          {evidence.severity}
        </span>
      </div>
      {evidence.snippet && (
        <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
          "{evidence.snippet}"
        </p>
      )}
    </div>
  );
};

const InvestigatePage = () => {
  const { theme } = useAdaptiveTheme();
  const [text, setText] = useState('');
  const [inputType, setInputType] = useState('message');
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [saved, setSaved]             = useState(false);
  const [saving, setSaving]           = useState(false);

  const handleSaveReport = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await reportsAPI.create({
        investigationId: result._id,
        title: `${result.scamDNA?.scamType?.replace(/_/g, ' ')} – ${new Date().toLocaleDateString()}`,
        tags: result.scamDNA?.patterns || [],
        isPublic: false
      });
      setSaved(true);
    } catch (err) {
      // 409 = already saved — treat as success
      if (err.response?.status === 409) { setSaved(true); }
    } finally { setSaving(false); }
  };

  const actionConfig = {
    safe_to_proceed: { icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: 'Safe to proceed' },
    proceed_with_caution: { icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fcd34d', label: 'Proceed with caution' },
    do_not_respond: { icon: XCircle, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', label: 'Do not respond' },
    block_and_report: { icon: XCircle, color: '#7f1d1d', bg: '#fef2f2', border: '#ef4444', label: 'Block and report' }
  };

  const handleInvestigate = async () => {
    if (text.trim().length < 10) {
      setError('Please enter at least 10 characters to analyse.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setShowDetails(false);
    setSaved(false);

    try {
      const { data } = await investigationAPI.investigate(text, inputType);
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const actionInfo = result ? actionConfig[result.recommendation?.action] : null;
  const ActionIcon = actionInfo?.icon;

  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
            background: `${theme.primaryColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={28} color={theme.primaryColor} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Investigation Engine
          </h1>
          <p style={{ color: '#64748b', fontSize: theme.fontSizeClass === 'text-lg' ? '1.1rem' : '0.95rem' }}>
            {theme.welcomeMessage}
          </p>
        </div>

        {/* Input card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {/* Input type selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['message', 'email', 'url', 'social_post'].map(type => (
              <button
                key={type}
                onClick={() => setInputType(type)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500,
                  border: inputType === type ? `2px solid ${theme.primaryColor}` : '1px solid #e2e8f0',
                  background: inputType === type ? `${theme.primaryColor}12` : '#fff',
                  color: inputType === type ? theme.primaryColor : '#64748b',
                  cursor: 'pointer', textTransform: 'capitalize'
                }}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={theme.inputPlaceholder}
            rows={6}
            style={{
              width: '100%', padding: 16, borderRadius: 12,
              border: '1.5px solid #e2e8f0', fontSize: theme.fontSizeClass === 'text-lg' ? '1.05rem' : '0.95rem',
              fontFamily: 'Inter, sans-serif', resize: 'vertical', outline: 'none',
              color: '#0f172a', lineHeight: 1.6, background: '#fafafa',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = theme.primaryColor}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />

          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: 8 }}>{error}</p>
          )}

          <button
            onClick={handleInvestigate}
            disabled={loading || text.trim().length < 10}
            style={{
              width: '100%', marginTop: 16, padding: theme.fontSizeClass === 'text-lg' ? '16px' : '12px',
              borderRadius: 12, border: 'none', cursor: loading ? 'wait' : 'pointer',
              background: loading || text.trim().length < 10 ? '#94a3b8' : theme.primaryColor,
              color: '#fff', fontSize: theme.fontSizeClass === 'text-lg' ? '1.1rem' : '1rem',
              fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s', fontFamily: 'Inter, sans-serif'
            }}
          >
            {loading ? (
              <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analysing...</>
            ) : (
              <><Search size={18} /> Analyse Now</>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="animate-fade-in">
            {/* Trust Score + Action */}
            <div style={{
              background: actionInfo?.bg, border: `2px solid ${actionInfo?.border}`,
              borderRadius: 16, padding: 24, marginBottom: 16,
              display: 'grid', gridTemplateColumns: '140px 1fr', gap: 24, alignItems: 'center'
            }}>
              <TrustScoreRing score={result.trustScore.score} label={result.trustScore.label} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {ActionIcon && <ActionIcon size={22} color={actionInfo.color} />}
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: actionInfo?.color }}>
                    {theme.trustLabels?.[result.trustScore.label] || actionInfo?.label}
                  </span>
                </div>
                <p style={{ color: '#334155', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {result.trustScore.explanation}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  <span style={{ fontSize: '0.75rem', background: '#0f172a', color: '#fff', padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>
                    {result.scamDNA?.scamType?.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#475569', padding: '3px 10px', borderRadius: 20 }}>
                    Confidence: {result.scamDNA?.confidence}%
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 12, color: '#0f172a' }}>
                What to do
              </h3>
              <p style={{ color: '#334155', fontSize: '0.9rem', marginBottom: 12, lineHeight: 1.6 }}>
                {result.recommendation?.advice}
              </p>
              <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                {result.recommendation?.steps?.map((step, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: '0.88rem', color: '#475569' }}>
                    <span style={{
                      minWidth: 22, height: 22, borderRadius: '50%',
                      background: `${theme.primaryColor}20`, color: theme.primaryColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
                    }}>{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Details toggle */}
            {result.scamDNA?.evidence?.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  style={{
                    width: '100%', padding: '14px 20px', background: 'none', border: 'none',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a'
                  }}
                >
                  <span>Evidence details ({result.scamDNA.evidence.length} indicators)</span>
                  {showDetails ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                </button>
                {showDetails && (
                  <div style={{ padding: '0 16px 16px' }}>
                    {result.scamDNA.evidence.map((ev, i) => <EvidenceCard key={i} evidence={ev} />)}
                    {result.scamDNA.redFlags?.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Red flags</p>
                        {result.scamDNA.redFlags.map((flag, i) => (
                          <span key={i} style={{
                            display: 'inline-block', fontSize: '0.75rem', padding: '3px 10px',
                            background: '#fef2f2', color: '#dc2626', borderRadius: 20,
                            margin: '3px 4px 3px 0', fontWeight: 500
                          }}>{flag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Save as Report */}
            <button
              onClick={handleSaveReport}
              disabled={saving || saved}
              style={{
                marginTop: 12, width: '100%', padding: '10px', borderRadius: 10,
                border: `1.5px solid ${saved ? '#16a34a' : theme.primaryColor}`,
                background: saved ? '#f0fdf4' : '#fff',
                color: saved ? '#16a34a' : theme.primaryColor,
                cursor: saving ? 'wait' : 'pointer',
                fontWeight: 600, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
              {saved
                ? <><BookmarkCheck size={16} /> Saved to Reports</>
                : saving
                ? 'Saving...'
                : <><BookmarkPlus size={16} /> Save as Report</>
              }
            </button>

            {/* New analysis */}
            <button
              onClick={() => { setResult(null); setText(''); setSaved(false); }}
              style={{
                marginTop: 16, width: '100%', padding: '10px', borderRadius: 10,
                border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b',
                cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif'
              }}
            >
              Analyse another message
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default InvestigatePage;
