# 🛡️ CyberTwin AI

**Adaptive cybersecurity platform — scam detection, network scanning, TrustCircle, and AI responses tailored to every user.**

---

## Features

| Feature | Description |
|---|---|
| 🔍 Investigation Engine | Paste any message, email, URL — get a Trust Score + verdict |
| 🧬 Scam DNA | Classifies scam type: phishing, lottery, romance scam, impersonation, etc. |
| 📊 Trust Score | 0–100 animated ring with colour-coded verdict |
| 🎨 Adaptive UI & AI | 4 experiences — Senior, Student, Professional, Teen. AI explanations change too |
| 👥 TrustCircle | Add trusted contacts, send invites, share alerts |
| 📋 Reports | Save investigations, make them public with shareable links |
| 🌐 Network Scanner | Nmap-powered port scanner — verified domains only, full consent gate |
| 📖 History | Searchable, filterable investigation history with expandable details |
| 🔐 JWT Auth | Secure register/login, bcrypt password hashing |

---

## Tech stack

- **Frontend** — React 18, React Router v6, Axios
- **Backend** — Node.js 18, Express, MongoDB, Mongoose
- **Auth** — JWT + bcrypt
- **AI** — Rule-based Scam DNA engine + optional OpenAI GPT-4o-mini
- **Network** — Nmap 7.x (system dependency)
- **Deployment** — Docker + Docker Compose

---

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- **Nmap installed on the backend server**

### Install Nmap

```bash
# Ubuntu / Debian
sudo apt-get install nmap

# macOS
brew install nmap

# Windows — download installer from https://nmap.org/download.html
# Add nmap to your PATH after installation

# Verify
nmap --version
```

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/your-username/cybertwin-ai.git
cd cybertwin-ai
npm run install:all
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cybertwin
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_key_here   # optional — falls back to rules
```

### 3. Seed demo data

```bash
cd database/seeds
node seed.js
```

Demo accounts created:

| Profile | Email | Password |
|---|---|---|
| 👴 Senior | senior@demo.com | demo1234 |
| 🎓 Student | student@demo.com | demo1234 |
| 💼 Professional | pro@demo.com | demo1234 |
| 🧑 Teen | teen@demo.com | demo1234 |

### 4. Run the project

```bash
# From root — starts backend (port 5001) + frontend (port 3000)
npm run dev
```

---

## Docker (full stack)

```bash
# Copy and fill in env vars
cp backend/.env.example backend/.env

# Build and start everything
docker-compose up --build
```

Access at http://localhost:3000

---

## Network Scanner — important notes

The Network Scanner uses **Nmap** and operates under a strict 3-layer consent system:

1. **Consent gate** — user must explicitly agree they own or have permission to scan the domain
2. **Domain verification** — user proves ownership via DNS TXT record or file upload (same as Google/Cloudflare)
3. **Scan-time re-confirmation** — consent re-confirmed at every scan, logged in the database

**Scanning domains without permission is illegal.** CyberTwin enforces verified-only scanning and logs all activity.

---

## Project structure

```
cybertwin/
├── backend/src/
│   ├── config/         MongoDB connection
│   ├── controllers/    auth, investigation, profile, reports,
│   │                   trustCircle, networkScan
│   ├── middleware/     JWT auth, error handling
│   ├── models/         User, Investigation, Report, TrustCircle,
│   │                   VerifiedDomain, ScanResult
│   └── routes/         all API routes
├── frontend/src/
│   ├── components/ui/  Layout (sidebar + mobile nav)
│   ├── context/        AuthContext
│   ├── hooks/          useAdaptiveTheme
│   ├── pages/          Dashboard, Investigate, History, TrustCircle,
│   │                   Reports, NetworkScan, Profile, Login, Register
│   └── utils/          Axios API service
├── ai/engines/
│   ├── scamDNA.js      Scam DNA + Trust Score (adaptive per profile)
│   └── nmapEngine.js   Nmap wrapper + port risk classifier
└── database/seeds/
    └── seed.js         Demo data with adaptive AI responses
```

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/investigate/message` | Analyse a message |
| GET  | `/api/investigate/history` | Past investigations |
| GET  | `/api/profile` | Profile + stats |
| PUT  | `/api/profile` | Update profile |
| GET  | `/api/trust-circle` | My circle |
| POST | `/api/trust-circle/invite` | Send invite |
| PUT  | `/api/trust-circle/requests/:id` | Accept/decline |
| POST | `/api/reports` | Save investigation as report |
| GET  | `/api/reports/shared` | Reports shared with me |
| GET  | `/api/reports/public/:token` | Public report (no auth) |
| GET  | `/api/network-scan/domains` | My verified domains |
| POST | `/api/network-scan/domains` | Add domain |
| POST | `/api/network-scan/domains/:id/verify` | Verify ownership |
| POST | `/api/network-scan/domains/:id/scan` | Start Nmap scan |
| GET  | `/api/network-scan/domains/results/:scanId` | Poll scan result |

## Gmail Integration (OAuth & IMAP)

CyberTwin can connect to a user's Gmail account to fetch messages for automated scanning. For prototype and security the server stores only an encrypted refresh token — message content is fetched on-demand and not persisted unless the user explicitly saves an investigation.

Required environment variables (backend/.env):

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_REDIRECT=https://your-backend.example.com/api/integrations/google/callback
ENCRYPTION_KEY=32+ char secret used to encrypt tokens
```

Notes & security considerations:
- Tokens are encrypted using AES-256-GCM with `ENCRYPTION_KEY`. Keep this key secret and rotate if compromised.
- The OAuth state parameter is a short-lived JWT bound to the logged-in user to prevent CSRF.
- Scanned message snippets are not stored by default; only analysed results saved when a user explicitly creates an investigation.
- In production, serve backend over HTTPS and set `GOOGLE_OAUTH_REDIRECT` to an HTTPS endpoint under your domain.
- For privacy-first deployments, consider building an Electron or mobile app that performs analysis locally and never uploads message content.


---

## Pitch demo flow (August 8th)

1. **Login as `senior@demo.com`** → show large text, warm simple language
2. **Login as `pro@demo.com`** → show compact technical view, same engine
3. **Paste a scam message** → watch Trust Score ring animate to result
4. **Switch profile type** in Profile page → same message, different AI response
5. **TrustCircle** → show invite flow
6. **Network Scanner** → show consent gate + verification steps (demo with your own domain)
7. **History** → show expandable investigations with full details

---

*CyberTwin AI — Built for college pitch, August 2025*
