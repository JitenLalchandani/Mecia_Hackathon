# CyberTwin Electron Agent — Local-first

This lightweight Electron agent runs the Scam DNA analysis locally on the user's device. It is designed to keep message contents on-device and not upload them by default.

Quick start (development):

```bash
cd agent/electron
npm install
npm start
```

Security notes:
- Analysis runs locally using the repository's `ai/engines/scamDNA.js` engine. No data is sent to any server by default.
- The agent uses `contextIsolation` and a `preload.js` bridge to expose only a minimal API (`analyzeText`, `openFile`).
- If you add a network-upload feature, make it optional and clearly labelled; default must remain local-only.

Uploads are explicitly opt-in and disabled by default. Enabling uploads will show a confirmation dialog and uploads will never occur automatically — any upload requires an explicit user action. Settings are persisted locally under the agent's user data folder.
