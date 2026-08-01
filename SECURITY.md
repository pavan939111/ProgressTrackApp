# Security & secrets

- Never commit `.env`, `.env.local`, `env`, or files named like `env (1)`.
- Copy `.env.example` → `.env.local` and fill values locally / in Vercel.
- Keep `firestore.rules` and `firestore.indexes.json` local only (gitignored). Deploy them with Firebase CLI from your machine.
- Never commit service account JSON, `.firebaserc`, or Cloudinary/Firebase secrets.
- If credentials were ever pushed, **rotate them** in Firebase + Cloudinary consoles (git history may still contain old values).
