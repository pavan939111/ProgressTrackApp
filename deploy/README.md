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
# 3. After deploy, set production URLs in both files and re-save env on Vercel:
#      NEXT_PUBLIC_API_URL / BACKEND_PUBLIC_URL = https://<backend>.vercel.app
#      FRONTEND_URL / NEXT_PUBLIC_APP_URL       = https://<frontend>.vercel.app
# 4. Google OAuth redirect URI (Google Cloud Console):
#      https://<backend>.vercel.app/api/oauth/google/callback
#
# Never commit filled frontend.env / backend.env — they are gitignored.
