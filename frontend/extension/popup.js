const scanBtn = document.getElementById('scanBtn');
const status = document.getElementById('status');
const resultEl = document.getElementById('result');

const BACKEND = (chrome && chrome.runtime && chrome.runtime.getManifest)
  ? (chrome.runtime.getManifest().content_security_policy || 'http://localhost:5000')
  : 'http://localhost:5000';

async function getSelectedText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return '';

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    });
    return results && results[0] && results[0].result ? results[0].result : '';
  } catch (e) {
    return '';
  }
}

scanBtn.addEventListener('click', async () => {
  status.textContent = 'Gathering selection…';
  resultEl.style.display = 'none';

  const text = await getSelectedText();
  if (!text || text.trim().length < 10) {
    status.textContent = 'Select at least 10 characters to scan.';
    return;
  }

  status.textContent = 'Scanning…';

  try {
    const resp = await fetch('http://localhost:5000/api/public/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, profileType: 'professional' })
    });

    const json = await resp.json();
    if (!json || !json.success) throw new Error(json?.message || 'Scan failed');

    status.textContent = 'Scan complete';
    resultEl.style.display = 'block';
    resultEl.textContent = JSON.stringify(json.data, null, 2);
  } catch (err) {
    status.textContent = 'Error: ' + (err.message || err);
  }
});
