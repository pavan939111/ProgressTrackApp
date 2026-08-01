# Vercel setup (frontend + backend)

This repo is a monorepo. Each Vercel project must point at the app folder.

## Frontend project

1. **Root Directory** → `frontend`  
   Settings → General → Root Directory → `frontend` → Save
2. Framework: Next.js (auto)
3. Install / Build: leave **default** (`npm install` / `next build`) — uses `frontend/vercel.json`
4. Env from `deploy/frontend.env`:
   - `NEXT_PUBLIC_API_URL` = backend URL (e.g. `https://backend-six-roan-24.vercel.app`)
   - `NEXT_PUBLIC_APP_URL` = this frontend URL

If Root Directory is left as `.` (repo root), the root `vercel.json` installs into `frontend/` and symlinks `node_modules` so Next.js can be detected. Prefer Root Directory = `frontend` instead.

## Backend project

1. **Root Directory** → `backend`
2. Env from `deploy/backend.env`
3. `FRONTEND_URL` / OAuth redirect must match the live frontend URL
