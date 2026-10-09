import React, { useState } from 'react';
import Layout from '../components/ui/Layout';

export default function AdminPushPage() {
  const [title, setTitle] = useState('CyberTwin Test');
  const [body, setBody] = useState('This is a test notification');
  const [url, setUrl] = useState('/');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const send = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/push/send-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url })
      });
      const json = await res.json();
      setResult({ ok: res.ok, data: json });
    } catch (e) {
      setResult({ ok: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container">
        <h2 style={{marginBottom:12}}>Admin: Send Test Notification</h2>
        <div style={{display:'grid',gap:12,maxWidth:720}}>
          <label>Title
            <input value={title} onChange={e=>setTitle(e.target.value)} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e2e8f0'}} />
          </label>
          <label>Body
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e2e8f0'}} />
          </label>
          <label>URL (open when clicked)
            <input value={url} onChange={e=>setUrl(e.target.value)} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e2e8f0'}} />
          </label>
          <div style={{display:'flex',gap:8}}>
            <button onClick={send} disabled={loading} style={{background:'#06b6d4',border:'none',padding:'10px 14px',borderRadius:8,color:'#04293a'}}>Send to all</button>
            <div style={{alignSelf:'center'}}>{loading ? 'Sending…' : ''}</div>
          </div>

          {result && (
            <pre style={{background:'#0f172a',color:'#e2e8f0',padding:12,borderRadius:8,overflow:'auto'}}>{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      </div>
    </Layout>
  );
}
