# Deploy guide — Render (AI) + Vercel (Web)

Production runs two services:

| Service | Host | Env file (local) |
|---------|------|------------------|
| Next.js BFF | Vercel | `apps/web/.env` |
| Express AI worker | Render | `apps/ai-service/.env` |

`INTERNAL_API_KEY` must be **identical** on both. `GEMINI_API_KEY` lives **only** on Render.

---

## Prerequisites

1. Push the monorepo to GitHub (includes `render.yaml`, `apps/web/vercel.json`).
2. Neon Postgres + Vercel Blob already configured on Vercel.
3. Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

Generate a shared secret (save it — you need the same value in both places):

```bash
openssl rand -base64 32
```

---

## Step 1 — Deploy AI service on Render

1. Open [render.com](https://render.com) → **New** → **Blueprint**.
2. Connect repo `nkieu-config/job-tracker-app-project`.
3. Render reads `render.yaml` and creates `job-tracker-ai-service`.
4. When prompted for env vars, set:
   - `GEMINI_API_KEY` — your Gemini key
   - `INTERNAL_API_KEY` — same value as on Vercel (see Step 2)
5. Click **Apply**. Wait for deploy to finish.
6. Copy the service URL, e.g. `https://job-tracker-ai-service.onrender.com`.
7. Verify: `curl https://job-tracker-ai-service.onrender.com/health` → `{"status":"ok"}`

**Free tier:** service sleeps after ~15 min idle; first AI request may take ~30s to wake.

### Manual deploy (without Blueprint)

| Field | Value |
|-------|-------|
| Root Directory | *(leave empty — repo root)* |
| Build Command | `npm ci && npm run build -w @job-tracker/ai-service` |
| Start Command | `npm run start -w @job-tracker/ai-service` |
| Health Check Path | `/health` |
| Region | Singapore |

---

## Step 2 — Vercel (web app)

### Project settings (one-time)

In [Vercel project settings](https://vercel.com/nkieus-projects/job-tracker-app-project/settings):

1. **Root Directory** → `apps/web`
2. Enable **Include source files outside of the Root Directory** (for `packages/shared` and `packages/db`).

`apps/web/vercel.json` sets monorepo install/build commands.

### Environment variables

| Variable | Notes |
|----------|-------|
| `INTERNAL_API_KEY` | Same as Render |
| `AI_SERVICE_URL` | Render service URL (set after Step 1) |
| `BETTER_AUTH_URL` | `https://job-tracker-app-project.vercel.app` |
| `DATABASE_URL` / `DIRECT_URL` | Neon |
| `BETTER_AUTH_SECRET` | random string |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |

**Do not** set `GEMINI_API_KEY` on Vercel.

Set `AI_SERVICE_URL` after Render is live:

```bash
./scripts/set-ai-service-url.sh https://job-tracker-ai-service.onrender.com
```

Redeploy Vercel after env changes (new deployments only pick up new vars).

---

## Step 3 — Database migrations

```bash
npx prisma migrate deploy
```

---

## Step 4 — Smoke test

See [manual-qa.md](./manual-qa.md) sections 7–9 on the live URL.

---

## Local development

```bash
npm run dev      # Terminal 1 — Next.js
npm run dev:ai   # Terminal 2 — AI service
```
