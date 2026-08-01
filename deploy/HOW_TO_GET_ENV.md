# How to get the missing env values

## Architecture rule
- **Frontend** only needs `NEXT_PUBLIC_API_URL` (+ optional `NEXT_PUBLIC_APP_URL`).
- **All Firebase / Auth / Firestore / OAuth / Cloudinary / VAPID** values go on the **backend** only.

---

## Frontend (`deploy/frontend.env`)

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | Backend Vercel URL — `https://backend-six-roan-24.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Frontend Vercel URL — `https://progress-track-app.vercel.app` |

---

## Backend — Firebase web config + Auth REST

Firebase Console → Project settings → Your apps (Web):

| Env | Field |
|-----|--------|
| `FIREBASE_WEB_API_KEY` | apiKey |
| `FIREBASE_AUTH_DOMAIN` | authDomain |
| `FIREBASE_PROJECT_ID` | projectId |
| `FIREBASE_STORAGE_BUCKET` | storageBucket |
| `FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |
| `FIREBASE_APP_ID` | appId |
| `FIREBASE_MEASUREMENT_ID` | measurementId |
| `FIREBASE_VAPID_KEY` | Cloud Messaging → Web Push certificates |

You may keep `NEXT_PUBLIC_FIREBASE_*` **on the backend only** as aliases. Do **not** put them in the frontend project.

---

## Firebase Admin (backend)

1. Firebase Console → Service accounts → Generate private key
2. `FIREBASE_SERVICE_ACCOUNT_JSON` (one-line) **or** `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`

---

## Google Calendar OAuth (backend)

1. Google Cloud Console → OAuth Web client
2. Authorized redirect URI (login + calendar share this one):
   - `https://backend-six-roan-24.vercel.app/api/oauth/google/callback`
   - Local: `http://localhost:3001/api/oauth/google/callback`
3. Authorized JavaScript origins (optional): `https://progress-track-app.vercel.app`
4. `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

Also enable **Google** under Firebase Console → Authentication → Sign-in method (required for Continue with Google).

### If you see `INVALID IDP RESPONSE` / audience not allowed
Your `GOOGLE_CLIENT_ID` is from a different Google Cloud project than Firebase (`pta-1-8f439`). PTA now falls back to **Admin custom tokens** when that happens (needs `FIREBASE_SERVICE_ACCOUNT_JSON` on the backend).

Optional hard fix in Firebase Console:
1. Authentication → Sign-in method → Google → Web SDK configuration  
2. Add your Web client ID: `….apps.googleusercontent.com`  
3. Or create a new OAuth Web client **inside** the Firebase-linked GCP project and update `GOOGLE_CLIENT_ID` / `SECRET`.

Ensure Authorized redirect URIs include:
- `https://backend-six-roan-24.vercel.app/api/oauth/google/callback`
- `http://localhost:3001/api/oauth/google/callback`

---

## Cloudinary (backend)

Cloud name, API key, API secret — backend only.

If photo upload fails with **Invalid Signature** / **api_secret mismatch**, open
[Cloudinary Console → Settings → API Keys](https://console.cloudinary.com/settings/api-keys),
generate a new key, and update on the backend Vercel project:

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- or a single `CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME`

PTA also falls back to **Firebase Storage** (`profiles/{uid}/avatar.jpg`) when Cloudinary fails,
so enable Storage in the Firebase console and set `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.

---

## Session alarms (backend cron)

1. Set `CRON_SECRET` on the backend Vercel project (any long random string).
2. Ensure `FIREBASE_SERVICE_ACCOUNT_JSON` (or PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY) is set — needed to send FCM.
3. Redeploy backend. Vercel Cron hits `/api/cron/reminders` every minute (Pro plan). On Hobby, use an external cron (e.g. cron-job.org) every minute:

`GET https://YOUR-BACKEND.vercel.app/api/cron/reminders`  
Header: `Authorization: Bearer YOUR_CRON_SECRET`

4. On the phone: Profile → Allow notifications (registers FCM token) → set reminder times → Save.
