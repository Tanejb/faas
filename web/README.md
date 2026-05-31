# CampusHub Web (frontend)

React + Vite UI for the CampusHub Firebase backend.

## Setup

```bash
cd web
cp .env.example .env
npm install
```

## Run locally

Terminal 1 (repo root):

```bash
npm run emulators
```

Terminal 2:

```bash
npm run dev:web
```

Open http://localhost:5173 and click **Check /health**.

## Deploy (Firebase Hosting)

Build and deploy from repo root (after `firebase login`):

```bash
npm run deploy:hosting
```

Hosting on the **Spark (free)** plan is sufficient for a static SPA. You still need Blaze if you deploy Cloud Functions to production.
