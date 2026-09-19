const inputEl = document.getElementById('input');
const analyzeBtn = document.getElementById('analyze');
const openFileBtn = document.getElementById('openFile');
const clearBtn = document.getElementById('clear');
const status = document.getElementById('status');
const resultEl = document.getElementById('result');
const profileEl = document.getElementById('profile');
const uploadsToggle = document.getElementById('uploadsToggle');

// Load settings on startup
(async () => {
  try {
    const settings = await window.cybertwin.getSettings();
    if (settings && settings.uploadsEnabled) uploadsToggle.checked = true;
  } catch (e) {
    console.warn('Could not load settings', e);
  }
})();

openFileBtn.addEventListener('click', async () => {
  status.textContent = 'Opening file…';
  const res = await window.cybertwin.openFile();
  if (res.canceled) {
    status.textContent = 'File open cancelled';
    return;
  }
  if (res.error) {
    status.textContent = 'Error reading file: ' + res.error;
    return;
  }
  inputEl.value = res.content;
  status.textContent = 'File loaded';
});

clearBtn.addEventListener('click', () => {
  inputEl.value = '';
  resultEl.style.display = 'none';
  status.textContent = '';
});

analyzeBtn.addEventListener('click', async () => {
  const text = inputEl.value;
  if (!text || text.trim().length < 10) {
    status.textContent = 'Please provide at least 10 characters to analyze.';
    return;
  }
  status.textContent = 'Analyzing locally…';
  resultEl.style.display = 'none';
  try {
    const profile = profileEl.value || 'professional';
    const data = await window.cybertwin.analyzeText(text, 'message', profile);
    resultEl.textContent = JSON.stringify(data, null, 2);
    resultEl.style.display = 'block';
    status.textContent = 'Analysis complete — local only.';
    // If uploads are enabled (opt-in), do NOT auto-upload. Show a clear message and require explicit action.
    if (uploadsToggle.checked) {
      status.textContent += ' Uploads are enabled, but content is NOT uploaded automatically. Use the export button to upload explicitly.';
    }
  } catch (err) {
    status.textContent = 'Error: ' + (err.message || err);
  }
});

uploadsToggle.addEventListener('change', async (e) => {
  if (e.target.checked) {
    // Ask user to confirm enabling uploads
    const ok = await window.cybertwin.confirmEnableUploads();
    if (!ok) {
      uploadsToggle.checked = false;
      return;
    }
  }
  // Persist setting
  try {
    await window.cybertwin.setSettings({ uploadsEnabled: uploadsToggle.checked });
    status.textContent = uploadsToggle.checked ? 'Uploads enabled (you chose to opt-in).' : 'Uploads disabled.';
  } catch (err) {
    status.textContent = 'Failed to save settings.';
    uploadsToggle.checked = !uploadsToggle.checked; // revert
  }
});
