# Deploy env templates for Vercel (and other hosts)
#
# Files:
#   frontend.env.example  — template (safe to commit)
#   backend.env.example   — template (safe to commit)
#   frontend.env          — your filled values (gitignored)
#   backend.env           — your filled secrets (gitignored)
#
# How to use on Vercel
# 1. Create two projects (or one monorepo with two apps):
#      - Frontend Root Directory: frontend
#      - Backend Root Directory:  backend
# 2. Project Settings → Environment Variables
#      Paste every KEY=VALUE from the matching deploy/*.env file
# 3. Production URLs (already filled in deploy/*.env templates):
#      NEXT_PUBLIC_API_URL / BACKEND_PUBLIC_URL = https://backend-six-roan-24.vercel.app
#      FRONTEND_URL / NEXT_PUBLIC_APP_URL       = https://progress-track-app.vercel.app
# 4. Google OAuth redirect URIs (Google Cloud Console):
#      https://backend-six-roan-24.vercel.app/api/oauth/google/callback   (Calendar)
#      https://backend-six-roan-24.vercel.app/api/auth/google/callback    (Login)
#    Authorized JavaScript origin (optional):
#      https://progress-track-app.vercel.app
# 5. Firebase Console → Authentication → Sign-in method → enable Google
#
# Never commit filled frontend.env / backend.env — they are gitignored.
