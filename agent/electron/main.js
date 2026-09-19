const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');

async function readSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { uploadsEnabled: false };
  }
}

async function writeSettings(s) {
  try {
    await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(s, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC to open a file from renderer and return its text content
ipcMain.handle('agent:openFile', async () => {
  const res = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [ { name: 'Text', extensions: ['txt', 'eml', 'html', 'md'] }, { name: 'All', extensions: ['*'] } ]
  });
  if (res.canceled || !res.filePaths || res.filePaths.length === 0) return { canceled: true };
  try {
    const content = await fs.readFile(res.filePaths[0], 'utf8');
    return { canceled: false, content };
  } catch (e) {
    return { canceled: false, error: e.message };
  }
});

// Settings IPC
ipcMain.handle('agent:getSettings', async () => {
  return await readSettings();
});

ipcMain.handle('agent:setSettings', async (event, settings) => {
  return await writeSettings(settings);
});

// Show a confirmation modal when user opts into uploads
ipcMain.handle('agent:confirmEnableUploads', async () => {
  const result = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['Enable Uploads', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    title: 'Enable Uploads (opt-in)',
    message: 'Enabling uploads will allow message content to be uploaded to a remote server for analysis. Do not enable unless you trust the server and understand the privacy implications.',
    detail: 'Uploads are disabled by default. You can revoke this later in the settings. Only enable if you explicitly consent.'
  });
  return result.response === 0; // true if 'Enable Uploads' clicked
});
