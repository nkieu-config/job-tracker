# Manual QA — smoke test

A click-through checklist to confirm the app works end to end. Run it against
either target:

- **Production:** your live Vercel URL.
- **Local:** `npm run dev:ai` (terminal 1) and `npm run dev` (terminal 2), then open http://localhost:3000.

> Tip: the demo account is pre-populated, so you can test everything without
> entering data yourself. Some steps need env vars — the table notes which.

## Which feature needs which env var

| Feature | Needs |
| --- | --- |
| Sign in / sign up, applications CRUD, dashboard | `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |
| Resume upload + “View PDF” | `BLOB_READ_WRITE_TOKEN` |
| Analyze, Resume fit, Tailor bullets (AI) | Web: `AI_SERVICE_URL`, `INTERNAL_API_KEY` · AI service: `GEMINI_API_KEY`, `INTERNAL_API_KEY` |

## Checklist

| # | Do this | Where | Expected result |
| --- | --- | --- | --- |
| 1 | Open the app, click **Try the demo account** | `/sign-in` | Redirected to `/dashboard`, signed in as Demo User |
| 2 | Look at the dashboard | `/dashboard` | Metrics (response/interview rate, offers), a **Pipeline** of stage cards with counts, and an **Upcoming deadlines** list — all populated |
| 3 | Click a pipeline stage, e.g. **Applied** | `/dashboard` | Goes to the applications list filtered to that status |
| 4 | Click **Applications** in the top nav | nav | Full list; the status filter chips work |
| 5 | Open **Acme Corp · Senior Backend Engineer** | list | Detail page with status, deadline, job description |
| 6 | In **Skills analysis**, read the result | detail | Required skills tagged ✓ matched / ✗ missing vs the resume |
| 7 | Click **Re-analyze** _(AI)_ | detail | Button shows “Analyzing…”, then the analysis refreshes (no error) |
| 8 | Click **Compute resume fit** _(AI)_ | detail | Shows “Embedding…”, then resume versions ranked by **match %** |
| 9 | In **Tailor resume bullets**, type a sentence and click **Tailor bullets** _(AI)_ | detail | Text **streams in** live, bullet by bullet |
| 10 | Go to **Resumes → upload a small PDF** _(Blob)_ | `/dashboard/resumes` | Upload succeeds; the extracted text shows on the resume page; **View PDF** opens the file |
| 11 | Create a new application | `/dashboard/applications/new` | Saved; appears in the list and dashboard counts update |
| 12 | Edit then delete that application | detail → Edit / Delete | Changes persist; delete asks to confirm, then it’s gone |
| 13 | Click **Sign out** | nav | Back to sign-in |
| 14 | While signed out, open `/dashboard` directly | URL bar | Redirected to `/sign-in` (auth protection) |

## If something fails

- **An AI button errors** → check the AI microservice is running and env vars match. Web needs `AI_SERVICE_URL` + `INTERNAL_API_KEY`; the AI service needs `GEMINI_API_KEY` + the same `INTERNAL_API_KEY`. In production, redeploy both Vercel (web) and Railway/Render (AI service) after changing env vars.
- **Upload or View PDF fails** → `BLOB_READ_WRITE_TOKEN` is missing; set it and
  redeploy.
- **Hit “AI rate limit reached”** → expected after 30 AI actions/hour per user;
  wait or use a different account.
- **Env var added but still failing** → Vercel only applies new env vars to
  *new* deployments. Redeploy (Deployments → ⋯ → Redeploy).

## Automated checks (no clicking)

```bash
npm run lint        # code style
npm run typecheck   # types
npm test            # unit/component tests (16)
npm run build       # production build
```
