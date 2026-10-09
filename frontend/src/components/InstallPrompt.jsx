import React, { useEffect, useState } from 'react';
import { subscribeUserToPush } from '../utils/push';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setVisible(false);
    setDeferredPrompt(null);
    console.log('User response to A2HS prompt:', outcome);
  };

  if (!visible) return null;

  return (
    <div style={{position:'fixed',bottom:16,left:16,right:16,display:'flex',justifyContent:'space-between',alignItems:'center',background:'#0f172a',color:'#fff',padding:'12px 16px',borderRadius:8,zIndex:9999}}>
      <div style={{fontSize:14}}>Install CyberTwin for quicker access and offline support.</div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={() => setVisible(false)} style={{background:'transparent',color:'#fff',border:'1px solid rgba(255,255,255,0.12)',padding:'8px 12px',borderRadius:6}}>Dismiss</button>
        <button onClick={handleInstall} style={{background:'#06b6d4',color:'#04293a',border:'none',padding:'8px 12px',borderRadius:6}}>Install</button>
        <button onClick={async () => { try { await subscribeUserToPush(); alert('Notifications enabled'); } catch (e) { alert('Failed to enable notifications: ' + e.message); } }} style={{background:'#10b981',color:'#04293a',border:'none',padding:'8px 12px',borderRadius:6}}>Enable Notifications</button>
      </div>
    </div>
  );
}
