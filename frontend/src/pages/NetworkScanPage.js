import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Network, Plus, Shield, CheckCircle, AlertTriangle,
  XCircle, Clock, Trash2, RefreshCw, ChevronDown,
  ChevronUp, Lock, Unlock, Info, Zap
} from 'lucide-react';
import { networkScanAPI } from '../utils/api';
import useAdaptiveTheme from '../hooks/useAdaptiveTheme';
import Layout from '../components/ui/Layout';

const CONSENT_TEXT = "I confirm that I own this domain or have explicit written permission from the domain owner to perform security scanning. I understand that scanning domains without permission is illegal and against CyberTwin's terms of service.";

const RISK_CONFIG = {
  low:      { color: '#16a34a', bg: '#f0fdf4', label: 'Low Risk' },
  medium:   { color: '#d97706', bg: '#fffbeb', label: 'Medium Risk' },
  high:     { color: '#dc2626', bg: '#fef2f2', label: 'High Risk' },
  critical: { color: '#7f1d1d', bg: '#fef2f2', label: 'Critical' },
};

const STATUS_CONFIG = {
  pending_verification: { color: '#d97706', label: 'Needs Verification', icon: Clock },
  verified:             { color: '#16a34a', label: 'Verified',           icon: CheckCircle },
  failed:               { color: '#dc2626', label: 'Verification Failed', icon: XCircle },
};

// ── Consent Gate Modal ────────────────────────────────────────────────────────
const ConsentGate = ({ onAccept, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 500, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={20} color="#d97706" />
        </div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Permission Required</h2>
      </div>

      <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
        <p style={{ fontSize: '0.88rem', color: '#92400e', lineHeight: 1.6, margin: 0 }}>
          <strong>⚠️ Legal notice:</strong> Running network scans on domains you don't own or have explicit permission to scan is illegal under computer misuse laws in most countries (India's IT Act 2000, UK Computer Misuse Act, US CFAA, etc.).
        </p>
      </div>

      <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, marginBottom: 16 }}>
        CyberTwin's network scanner is designed exclusively for scanning <strong>your own domains or infrastructure</strong>. By continuing, you confirm:
      </p>

      <ul style={{ paddingLeft: 0, listStyle: 'none', marginBottom: 20 }}>
        {[
          'You are the owner of the domain OR have explicit written permission from the owner',
          'You understand that CyberTwin logs all scan activity',
          'You will complete domain ownership verification before any scan runs',
          'You accept full legal responsibility for your use of this tool'
        ].map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: '0.86rem', color: '#475569' }}>
            <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
            {item}
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose}
          style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Cancel
        </button>
        <button onClick={onAccept}
          style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          I Understand & Agree
        </button>
      </div>
    </div>
  </div>
);

// ── Add Domain Form ───────────────────────────────────────────────────────────
const AddDomainForm = ({ onAdded, theme }) => {
  const [domain,   setDomain]   = useState('');
  const [method,   setMethod]   = useState('dns_txt');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showConsent, setShowConsent] = useState(false);

  const handleSubmit = async () => {
    if (!domain.trim()) { setError('Please enter a domain'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await networkScanAPI.addDomain({
        domain: domain.trim(),
        verificationMethod: method,
        consentGiven: true
      });
      onAdded(data.data, data.verificationInstructions);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add domain');
    } finally { setLoading(false); }
  };

  return (
    <>
      {showConsent && (
        <ConsentGate
          onAccept={() => { setShowConsent(false); handleSubmit(); }}
          onClose={() => setShowConsent(false)}
        />
      )}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Add a domain to scan</h3>
        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="yourdomain.com"
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', fontFamily: 'Inter, sans-serif', marginBottom: 10, boxSizing: 'border-box' }}
        />
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6, fontWeight: 500 }}>Verification method:</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ v: 'dns_txt', label: '🔤 DNS TXT Record' }, { v: 'file', label: '📄 File Upload' }].map(({ v, label }) => (
              <button key={v} onClick={() => setMethod(v)}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: method === v ? `2px solid ${theme.primaryColor}` : '1.5px solid #e2e8f0', background: method === v ? `${theme.primaryColor}08` : '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: method === v ? 600 : 400, color: method === v ? theme.primaryColor : '#64748b', fontFamily: 'Inter, sans-serif' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 8 }}>{error}</p>}
        <button onClick={() => setShowConsent(true)} disabled={loading || !domain.trim()}
          style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: loading || !domain.trim() ? '#94a3b8' : theme.primaryColor, color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Plus size={16} /> {loading ? 'Adding...' : 'Add Domain'}
        </button>
      </div>
    </>
  );
};

// ── Verification Instructions Panel ──────────────────────────────────────────
const VerificationPanel = ({ instructions, domain, onVerify, verifying }) => (
  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: 16, marginBottom: 12 }}>
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <Info size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#92400e', margin: '0 0 4px' }}>
          Verify ownership of {domain}
        </p>
        <p style={{ fontSize: '0.82rem', color: '#92400e', margin: 0 }}>Method: {instructions?.method}</p>
      </div>
    </div>
    <ol style={{ paddingLeft: 16, margin: '0 0 12px' }}>
      {instructions?.steps?.map((step, i) => (
        <li key={i} style={{ fontSize: '0.82rem', color: '#78350f', marginBottom: 4, lineHeight: 1.5 }}>{step}</li>
      ))}
    </ol>
    {instructions?.record && (
      <div style={{ background: '#fef3c7', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontFamily: 'monospace', fontSize: '0.78rem', color: '#92400e' }}>
        <div>Name: <strong>{instructions.record.name}</strong></div>
        <div>Type: <strong>{instructions.record.type}</strong></div>
        <div>Value: <strong>{instructions.record.value}</strong></div>
      </div>
    )}
    <button onClick={onVerify} disabled={verifying}
      style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: verifying ? '#94a3b8' : '#d97706', color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
      {verifying ? 'Checking...' : '✓ Verify Now'}
    </button>
  </div>
);

// ── Port row ──────────────────────────────────────────────────────────────────
const PortRow = ({ port }) => {
  const risk = RISK_CONFIG[port.risk] || RISK_CONFIG.medium;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 60px 80px 1fr auto', gap: 8, padding: '8px 12px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', fontSize: '0.82rem' }}>
      <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#0f172a' }}>{port.port}/{port.protocol}</span>
      <span style={{ color: port.state === 'open' ? '#16a34a' : '#94a3b8', fontWeight: 500 }}>{port.state}</span>
      <span style={{ color: '#475569' }}>{port.service}</span>
      <span style={{ color: '#64748b', fontSize: '0.78rem' }}>{port.version || '—'}</span>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: risk.bg, color: risk.color, whiteSpace: 'nowrap' }}>{risk.label}</span>
    </div>
  );
};

// ── Scan Result Card ──────────────────────────────────────────────────────────
const ScanResultCard = ({ scan }) => {
  const [expanded, setExpanded] = useState(false);
  const summary = scan.securitySummary;
  const adaptive = scan.adaptiveSummary;
  const risk = RISK_CONFIG[summary?.riskLevel] || RISK_CONFIG.medium;

  if (scan.status === 'running') {
    return (
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RefreshCw size={18} color="#d97706" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#d97706' }}>Scan in progress...</span>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 'auto' }}>{new Date(scan.createdAt).toLocaleTimeString()}</span>
        </div>
      </div>
    );
  }

  if (scan.status === 'failed') {
    return (
      <div style={{ background: '#fef2f2', borderRadius: 12, border: '1px solid #fca5a5', padding: 16, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <XCircle size={18} color="#dc2626" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#dc2626' }}>Scan failed</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#991b1b', marginTop: 6 }}>{scan.errorMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${risk.color}30`, marginBottom: 10, overflow: 'hidden' }}>
      {/* Summary header */}
      <div style={{ padding: '14px 16px', background: risk.bg, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: risk.color }}>{risk.label}</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#fff', padding: '2px 8px', borderRadius: 20 }}>
              {summary?.openPortCount} open port{summary?.openPortCount !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 'auto' }}>
              {scan.scanType} · {scan.scanDurationMs ? `${(scan.scanDurationMs/1000).toFixed(1)}s` : ''}
            </span>
          </div>
          {adaptive?.explanation && (
            <p style={{ fontSize: '0.84rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>{adaptive.explanation}</p>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '14px 16px' }}>
          {/* Adaptive advice */}
          {adaptive?.advice && (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
              <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0 }}>{adaptive.advice}</p>
            </div>
          )}

          {/* Steps */}
          {adaptive?.steps?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Recommended steps</p>
              {adaptive.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: '0.83rem', color: '#475569' }}>
                  <span style={{ minWidth: 20, height: 20, borderRadius: '50%', background: `${risk.color}15`, color: risk.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>{i+1}</span>
                  {step}
                </div>
              ))}
            </div>
          )}

          {/* Port table */}
          {scan.ports?.length > 0 && (
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Open ports detail</p>
              <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 60px 80px 1fr auto', gap: 8, padding: '6px 12px', background: '#f8fafc', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                  <span>PORT</span><span>STATE</span><span>SERVICE</span><span>VERSION</span><span>RISK</span>
                </div>
                {scan.ports.filter(p => p.state === 'open').map((p, i) => <PortRow key={i} port={p} />)}
              </div>
            </div>
          )}

          {scan.ipAddress && (
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 10 }}>
              IP: {scan.ipAddress}{scan.osGuess ? ` · OS: ${scan.osGuess}` : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const NetworkScanPage = () => {
  const { theme } = useAdaptiveTheme();
  const [domains,      setDomains]      = useState([]);
  const [activeDomain, setActiveDomain] = useState(null);
  const [scanHistory,  setScanHistory]  = useState([]);
  const [instructions, setInstructions] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [verifying,    setVerifying]    = useState(false);
  const [scanning,     setScanning]     = useState(false);
  const [scanType,     setScanType]     = useState('quick');
  const [toast,        setToast]        = useState('');
  const [activeScanId, setActiveScanId] = useState(null);
  const pollRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const loadDomains = useCallback(async () => {
    try {
      const { data } = await networkScanAPI.getDomains();
      setDomains(data.data);
      if (data.data.length > 0 && !activeDomain) setActiveDomain(data.data[0]);
    } catch { console.error('Could not load domains'); }
    finally { setLoading(false); }
  }, [activeDomain]);

  useEffect(() => { loadDomains(); }, []);

  const loadHistory = useCallback(async (domainId) => {
    try {
      const { data } = await networkScanAPI.getScanHistory(domainId);
      setScanHistory(data.data);
    } catch { setScanHistory([]); }
  }, []);

  useEffect(() => {
    if (activeDomain) loadHistory(activeDomain._id);
  }, [activeDomain, loadHistory]);

  // Poll for scan completion
  useEffect(() => {
    if (!activeScanId) return;
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await networkScanAPI.getScanResult(activeScanId);
        if (data.data.status !== 'running') {
          clearInterval(pollRef.current);
          setActiveScanId(null);
          setScanning(false);
          if (activeDomain) loadHistory(activeDomain._id);
          showToast(data.data.status === 'completed' ? '✅ Scan complete!' : '❌ Scan failed');
        }
      } catch { clearInterval(pollRef.current); }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeScanId, activeDomain, loadHistory]);

  const handleDomainAdded = (newDomain, instr) => {
    setDomains(prev => [newDomain, ...prev]);
    setActiveDomain(newDomain);
    setInstructions(instr);
    showToast(`${newDomain.domain} added — complete verification to scan`);
  };

  const handleVerify = async () => {
    if (!activeDomain) return;
    setVerifying(true);
    try {
      const { data } = await networkScanAPI.verifyDomain(activeDomain._id);
      setActiveDomain(data.data);
      setDomains(prev => prev.map(d => d._id === data.data._id ? data.data : d));
      if (data.data.status === 'verified') {
        setInstructions(null);
        showToast(`✅ ${data.data.domain} verified!`);
      } else {
        showToast('Verification failed — check instructions and try again');
      }
    } catch (err) { showToast(err.response?.data?.reason || 'Verification failed'); }
    finally { setVerifying(false); }
  };

  const handleScan = async () => {
    if (!activeDomain || activeDomain.status !== 'verified') return;
    setScanning(true);
    try {
      const { data } = await networkScanAPI.startScan(activeDomain._id, scanType);
      setActiveScanId(data.scanId);
      setScanHistory(prev => [{ _id: data.scanId, status: 'running', createdAt: new Date(), scanType }, ...prev]);
      showToast(`Scan started — ${data.estimatedTime}`);
    } catch (err) {
      setScanning(false);
      showToast(err.response?.data?.message || 'Could not start scan');
    }
  };

  const handleDeleteDomain = async (id) => {
    if (!window.confirm('Remove this domain and all its scan history?')) return;
    try {
      await networkScanAPI.deleteDomain(id);
      const remaining = domains.filter(d => d._id !== id);
      setDomains(remaining);
      setActiveDomain(remaining[0] || null);
      setScanHistory([]);
      showToast('Domain removed');
    } catch { showToast('Could not remove domain'); }
  };

  const statusCfg = activeDomain ? STATUS_CONFIG[activeDomain.status] : null;

  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${theme.primaryColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Network size={22} color={theme.primaryColor} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Network Scanner</h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Scan your own domains for open ports and security risks</p>
          </div>
        </div>

        {/* Legal banner */}
        <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Lock size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.82rem', color: '#1e40af', margin: 0, lineHeight: 1.5 }}>
            <strong>Authorised use only.</strong> CyberTwin will only scan domains you have verified ownership of. Every scan is logged. Scanning without permission is illegal.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>

          {/* Sidebar — domain list */}
          <div>
            <AddDomainForm onAdded={handleDomainAdded} theme={theme} />

            {!loading && domains.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 10px', color: '#94a3b8', fontSize: '0.85rem' }}>
                No domains yet.<br />Add one above to start.
              </div>
            ) : (
              domains.map(d => {
                const scfg = STATUS_CONFIG[d.status];
                const StatusIcon = scfg?.icon;
                const isActive = activeDomain?._id === d._id;
                return (
                  <div key={d._id}
                    onClick={() => { setActiveDomain(d); setInstructions(null); }}
                    style={{ background: isActive ? `${theme.primaryColor}08` : '#fff', border: `1.5px solid ${isActive ? theme.primaryColor : '#e2e8f0'}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.domain}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          {StatusIcon && <StatusIcon size={11} color={scfg.color} />}
                          <span style={{ fontSize: '0.72rem', color: scfg?.color }}>{scfg?.label}</span>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteDomain(d._id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e2e8f0', padding: 2, flexShrink: 0 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Main content */}
          <div>
            {!activeDomain ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <Network size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontWeight: 500, color: '#94a3b8', margin: '0 0 4px' }}>No domain selected</p>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>Add a domain on the left to get started</p>
              </div>
            ) : (
              <>
                {/* Domain header */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 18px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{activeDomain.domain}</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {statusCfg && React.createElement(statusCfg.icon, { size: 13, color: statusCfg.color })}
                        <span style={{ fontSize: '0.8rem', color: statusCfg?.color, fontWeight: 500 }}>{statusCfg?.label}</span>
                        {activeDomain.verifiedAt && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>· verified {new Date(activeDomain.verifiedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    {activeDomain.status === 'verified' && (
                      <Unlock size={18} color="#16a34a" />
                    )}
                  </div>
                </div>

                {/* Verification panel */}
                {activeDomain.status !== 'verified' && (
                  <VerificationPanel
                    instructions={instructions || { method: activeDomain.verificationMethod === 'dns_txt' ? 'DNS TXT Record' : 'File Upload', steps: ['Click "Verify Now" to check for the verification token'] }}
                    domain={activeDomain.domain}
                    onVerify={handleVerify}
                    verifying={verifying}
                  />
                )}

                {/* Scan controls */}
                {activeDomain.status === 'verified' && (
                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 18px', marginBottom: 16 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: 10 }}>Scan type</p>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      {[
                        { v: 'quick',    label: '⚡ Quick',    desc: 'Top 100 ports · ~30s' },
                        { v: 'standard', label: '🔍 Standard', desc: 'Ports 1-1024 · ~2m' },
                        { v: 'full',     label: '🛡️ Full',     desc: 'All ports + versions · ~10m' }
                      ].map(({ v, label, desc }) => (
                        <button key={v} onClick={() => setScanType(v)}
                          style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: scanType === v ? `2px solid ${theme.primaryColor}` : '1.5px solid #e2e8f0', background: scanType === v ? `${theme.primaryColor}08` : '#fff', cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: scanType === v ? theme.primaryColor : '#0f172a' }}>{label}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{desc}</div>
                        </button>
                      ))}
                    </div>
                    <button onClick={handleScan} disabled={scanning}
                      style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: scanning ? '#94a3b8' : theme.primaryColor, color: '#fff', fontWeight: 600, cursor: scanning ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {scanning
                        ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Scanning...</>
                        : <><Zap size={16} /> Start Scan</>
                      }
                    </button>
                  </div>
                )}

                {/* Scan history */}
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: 10 }}>
                    Scan history {scanHistory.length > 0 && `(${scanHistory.length})`}
                  </p>
                  {scanHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <Clock size={28} color="#e2e8f0" style={{ margin: '0 auto 8px', display: 'block' }} />
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>No scans yet</p>
                    </div>
                  ) : (
                    scanHistory.map(scan => <ScanResultCard key={scan._id} scan={scan} />)
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: '0.88rem', fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 9999, whiteSpace: 'nowrap' }}>
            {toast}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NetworkScanPage;
