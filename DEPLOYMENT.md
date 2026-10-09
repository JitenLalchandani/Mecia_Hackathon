# Deployment (Option A) — Docker Compose on a VPS

This repository includes a production Docker Compose setup and an optional GitHub Actions workflow to deploy to a server over SSH.

Prerequisites
- A VPS or cloud VM with Docker and Docker Compose installed.
- An SSH deploy key added to this repo's secrets (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH`, `DEPLOY_SSH_PORT`).

Files added
- `docker-compose.prod.yml` — runs `frontend`, `backend`, `mongo`, and `nginx`.
- `infra/nginx/default.conf` — nginx reverse-proxy serving frontend and proxying `/api` to backend.
- `infra/.env.prod.template` — environment template to copy to `.env.prod` and fill secrets.
- `.github/workflows/deploy-prod.yml` — GitHub Actions workflow that SCPs files to server and runs `docker compose up -d --build`.

Quick manual deploy steps
1. Copy the env template and fill values:

```bash
cp infra/.env.prod.template infra/.env.prod
# edit infra/.env.prod and set real values (MONGO_URI, JWT_SECRET, VAPID keys)
```

2. Copy files to server (example):

```bash
scp docker-compose.prod.yml infra/nginx/default.conf infra/.env.prod user@your-host:/home/user/app
```

3. SSH to server and run:

```bash
cd /home/user/app
docker compose -f docker-compose.prod.yml up -d --build
```

Notes
- The `frontend` service builds from `frontend/Dockerfile` — ensure that `Dockerfile` produces a production-ready static server (the repo contains a `Dockerfile` for frontend).
- If you want HTTPS with Let's Encrypt, add a small reverse-proxy (Traefik/Certbot) or run Certbot on the server and update nginx config.
