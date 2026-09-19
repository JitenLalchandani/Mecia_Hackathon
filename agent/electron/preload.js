const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Load the Scam DNA engine from the mono-repo (local analysis)
const scamEngine = require(path.join(__dirname, '..', '..', 'ai', 'engines', 'scamDNA'));

contextBridge.exposeInMainWorld('cybertwin', {
  analyzeText: async (text, inputType = 'message', profileType = 'professional') => {
    if (!text || typeof text !== 'string' || text.trim().length < 1) {
      throw new Error('No text provided');
    }
    // Call local async engine
    const result = await scamEngine.analyzeMessage(text, inputType, profileType);
    return result;
  },
  openFile: async () => {
    return await ipcRenderer.invoke('agent:openFile');
  }
  ,
  getSettings: async () => {
    return await ipcRenderer.invoke('agent:getSettings');
  },
  setSettings: async (settings) => {
    return await ipcRenderer.invoke('agent:setSettings', settings);
  },
  confirmEnableUploads: async () => {
    return await ipcRenderer.invoke('agent:confirmEnableUploads');
  }
});
