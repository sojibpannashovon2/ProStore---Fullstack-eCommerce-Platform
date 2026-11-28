# Deployment

## Vercel (current)

The project is linked to Vercel. Production URL: https://pro-store-fullstack-e-commerce-plat.vercel.app

### One-time setup
1. Add environment variables in **Vercel → Project → Settings → Environment Variables** (see [ENVIRONMENT.md](./ENVIRONMENT.md)). At minimum: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `ENCRYPTION_KEY`.
2. For security email alerts: `RESEND_API_KEY` (and optionally `SUPER_ADMIN_ALERT_EMAIL`, `ALERT_FROM_EMAIL`).

### Deploy
```bash
vercel --prod
```
- `prebuild` runs `prisma migrate deploy` before `next build`.
- The migration step is non-fatal on transient DB connectivity errors (migrations are expected to be already applied). Apply schema changes to the DB before/with the release.

### Notes
- `AUTH_TRUST_HOST=true` is required behind Vercel's proxy.
- Product images use Neon Object Storage (S3). Local uploads are a dev fallback and do not persist on serverless.
- The AI agent uses the built-in deterministic engine in production (no Ollama); set `OLLAMA_*` only if a local model is reachable.

## Local production build
```bash
npm run build
npm run start
```

## Database
- Local: `npx prisma migrate dev`.
- After schema edits: `npm run db:generate`.
- Seed roles/accounts: `npx tsx db/seed-rbac.ts`.

## Post-deploy checklist
- Sign in as SuperAdmin, verify **Deleted Items** and **Security** pages.
- Confirm currency switches to ৳ BDT in Bangla.
- Verify a blocked/inactive user cannot sign in and active sessions are invalidated.