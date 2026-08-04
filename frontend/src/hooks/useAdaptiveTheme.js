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
    language: 'simple',        // simpler vocabulary
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
    primaryColor: '#7c3aed',   // vibrant purple
    accentColor: '#a855f7',
    bgColor: '#faf5ff',
    cardStyle: 'rounded-xl shadow-sm border',
    buttonStyle: 'text-base px-6 py-3 rounded-lg font-medium',
    iconSize: 22,
    language: 'casual',
    showTips: true,
    spacing: 'normal',
    welcomeMessage: 'Spot scams before they spot you.',
    inputPlaceholder: 'Drop a suspicious message, DM, or email here...',
    trustLabels: {
      safe: 'Looks legit ✓',
      suspicious: 'Sus... proceed with care',
      likely_scam: 'Red flags detected 🚩',
      confirmed_scam: 'Scam confirmed — block and report'
    }
  },
  professional: {
    name: 'professional',
    label: 'Pro Security',
    fontSize: 'sm',
    fontSizeClass: 'text-sm',
    primaryColor: '#0f172a',   // dark slate
    accentColor: '#0ea5e9',
    bgColor: '#f8fafc',
    cardStyle: 'rounded-lg shadow-sm border',
    buttonStyle: 'text-sm px-5 py-2.5 rounded-md font-medium',
    iconSize: 18,
    language: 'technical',
    showTips: false,
    spacing: 'compact',
    welcomeMessage: 'Threat intelligence & scam analysis.',
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
    primaryColor: '#db2777',   // hot pink
    accentColor: '#f472b6',
    bgColor: '#fdf2f8',
    cardStyle: 'rounded-2xl shadow border',
    buttonStyle: 'text-base px-6 py-3 rounded-full font-semibold',
    iconSize: 22,
    language: 'casual',
    showTips: true,
    spacing: 'normal',
    welcomeMessage: "Don't get played. Check it here first.",
    inputPlaceholder: 'Paste that sketchy message, email, or DM...',
    trustLabels: {
      safe: "It's giving legit ✓",
      suspicious: 'Not sure about this one...',
      likely_scam: 'Major red flag energy 🚩',
      confirmed_scam: "It's a scam! Block them NOW"
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
