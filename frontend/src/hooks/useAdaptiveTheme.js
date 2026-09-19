import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * CyberTwin Adaptive UI System
 * Returns theme config based on user's profile type
 * senior | student | professional | teen
 */

const THEMES = {
  senior: {
    name: 'senior',
    label: 'Senior Guardian',
    fontSize: 'large',
    fontSizeClass: 'text-lg',
    primaryColor: '#1e40af',   // deep trustworthy blue
    accentColor: '#3b82f6',
    bgColor: '#f0f7ff',
    cardStyle: 'rounded-2xl shadow-md border-2',
    buttonStyle: 'text-lg px-8 py-4 rounded-xl font-semibold',
    iconSize: 28,
    language: 'simple',
    showTips: true,
    spacing: 'spacious',
    welcomeMessage: 'Stay safe online. We check messages for you.',
    inputPlaceholder: 'Paste the message you received here...',
    trustLabels: {
      safe: '✅ This looks safe',
      suspicious: '⚠️ Be careful with this',
      likely_scam: '🚫 This is probably a scam',
      confirmed_scam: '🛑 Stop! This is a scam'
    }
  },
  student: {
    name: 'student',
    label: 'Student Shield',
    fontSize: 'base',
    fontSizeClass: 'text-base',
    primaryColor: '#7c9bff',
    accentColor: '#b084ff',
    bgColor: '#0b1020',
    cardStyle: 'rounded-xl shadow-[0_0_18px_rgba(124,155,255,0.18)] border border-indigo-400/30',
    buttonStyle: 'text-base px-6 py-3 rounded-lg font-semibold',
    iconSize: 22,
    language: 'casual',
    showTips: true,
    spacing: 'normal',
    welcomeMessage: 'Stay sharp and keep your inbox safe.',
    inputPlaceholder: 'Drop a suspicious message, DM, or email here...',
    trustLabels: {
      safe: 'Looks legit ✓',
      suspicious: 'Proceed with care',
      likely_scam: 'Red flags detected 🚩',
      confirmed_scam: 'Scam confirmed — block and report'
    }
  },
  professional: {
    name: 'professional',
    label: 'Pro Security',
    fontSize: 'sm',
    fontSizeClass: 'text-sm',
    primaryColor: '#5eb7ff',
    accentColor: '#93c5fd',
    bgColor: '#0b0f14',
    cardStyle: 'rounded-lg shadow-sm border border-slate-700',
    buttonStyle: 'text-sm px-5 py-2.5 rounded-md font-semibold',
    iconSize: 18,
    language: 'technical',
    showTips: false,
    spacing: 'compact',
    welcomeMessage: 'Threat intelligence and scam analysis.',
    inputPlaceholder: 'Paste message, email body, or URL for analysis...',
    trustLabels: {
      safe: 'Clean',
      suspicious: 'Anomaly detected',
      likely_scam: 'High threat probability',
      confirmed_scam: 'Confirmed threat'
    }
  },
  teen: {
    name: 'teen',
    label: 'Teen Defender',
    fontSize: 'base',
    fontSizeClass: 'text-base',
    primaryColor: '#4afc78',
    accentColor: '#b8ffbf',
    bgColor: '#020d0a',
    cardStyle: 'rounded-2xl shadow-[0_0_30px_rgba(74,252,120,0.32)] border border-[#4afc78]/80 bg-[#03130f]',
    buttonStyle: 'text-base px-6 py-3 rounded-md font-bold uppercase tracking-[0.12em]',
    iconSize: 22,
    language: 'casual',
    showTips: true,
    spacing: 'normal',
    welcomeMessage: 'Threat detected. We block the shady payload before it reaches you.',
    inputPlaceholder: 'Paste the suspicious DM, link, or message here...',
    trustLabels: {
      safe: '✅ Clean signal',
      suspicious: '⚠️ Unverified packet',
      likely_scam: '🚫 Likely scam payload',
      confirmed_scam: '🛑 Scam confirmed. Block it.'
    }
  }
};

const useAdaptiveTheme = () => {
  const { user } = useAuth();
  const profileType = user?.profileType || 'professional';

  const theme = useMemo(() => THEMES[profileType] || THEMES.professional, [profileType]);

  return { theme, themes: THEMES };
};

export default useAdaptiveTheme;
