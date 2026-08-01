# Security & secrets

- Never commit `.env`, `.env.local`, `env`, or files named like `env (1)`.
- Copy `.env.example` → `.env.local` and fill values locally / in Vercel.
- Machine-specific MCP paths: copy `.agents/mcp_config.example.json` → `.agents/mcp_config.json` (gitignored).
- If credentials were ever pushed, **rotate them** in Firebase + Cloudinary consoles (git history may still contain old values).
- Deploy Firestore rules from `firestore.rules` (auth-required owner access only).
