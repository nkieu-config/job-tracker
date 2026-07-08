# Architecture

How the system is put together, and the reasoning behind the key decisions.

## System overview

```
Browser
   │
   ▼
Next.js (apps/web) ── auth, CRUD, file upload, pgvector queries, AI
   │                        │
   │                        ├──▶ Postgres (Neon) + Vercel Blob
   │                        │
   │                        └──▶ lib/ai/ (in-process) ──▶ Gemini API
```

- **One Next.js service.** Server Actions and Route Handlers handle UI, sessions, database access, file upload, rate limiting, and the AI calls. `GEMINI_API_KEY` is read only inside `lib/ai/` (server-side) and is never sent to the browser.
- **`lib/ai/` module.** `analyze` (structured JSON), `embeddings` (batch), and `stream` (token-by-token bullet tailoring + interview prep). The heavy Gemini logic sits behind one boundary; the rest of the app imports a thin facade (`lib/ai-client.ts`).
- **Shared Zod schemas** in `packages/shared/` are the single source of truth for the AI contract — used both to constrain the model (schema-out) and to validate its response (validate-in).

## Monorepo layout

```
job-tracker/
├── apps/
│   ├── web/                 # @job-tracker/web — Next.js 16
│   │   ├── src/
│   │   │   ├── app/         # App Router (routes)
│   │   │   ├── components/  # UI by domain (auth, applications, resumes…)
│   │   │   ├── actions/     # Server Actions
│   │   │   └── lib/         # Server utilities (auth, data, ai/)
│   │   └── tests/
├── packages/
│   ├── db/                  # Prisma schema + migrations + generated client
│   └── shared/              # Zod schemas, AiError, shared constants
├── docs/
├── scripts/
└── turbo.json               # Turborepo task pipeline
```

Orchestrated with npm workspaces + Turborepo (`npm run check` typechecks every workspace through the turbo pipeline).

## Key decisions

### Why the AI runs in-process (and not as a separate service)

This started as a separate Express microservice and was later folded into the Next.js app. The honest trade-off:

- **What the split bought:** the Gemini key lived in its own process, and the AI worker could scale/deploy independently.
- **What it cost:** an extra network hop, a second deployment target, a shared-key auth scheme to maintain, and a two-process local dev loop — all to wrap a handful of I/O-bound Gemini SDK calls.
- **Why in-process wins here:** the key is server-only either way (Server Actions and Route Handlers never reach the browser), the AI work is I/O-bound not CPU-bound (a separate process buys no isolation the event loop doesn't already give), and Route Handlers stream a `ReadableStream` just as well as Express. Removing the hop cut latency and the operational surface without weakening the security boundary.

The AI code is still isolated **as a module** (`lib/ai/`) rather than a service, so the boundary is preserved where it adds value (one place owns the key and the prompts) and dropped where it only added ceremony.

### Defense-in-depth auth

A `proxy.ts` (Next 16's renamed middleware) does an optimistic cookie check for fast redirects, but it is **never the only gate**: every page, Server Action, and route handler independently re-checks the session and scopes its queries by `userId`. This design directly addresses CVE-2025-29927, where Next.js middleware could be bypassed entirely — here, bypassing the middleware gains an attacker nothing.

### Two-layer AI validation

The JSON schema Gemini must follow is derived from a Zod schema (`z.toJSONSchema`), and the response is re-validated with that same Zod schema on the way back in. Malformed model output becomes an explicit, recoverable `AiError` instead of a runtime crash somewhere in the UI. Schema-out, validate-in — the model is treated as an untrusted external system.

### pgvector via raw SQL

Vector columns are declared as `Unsupported("vector(768)")` in the Prisma schema, so Prisma tracks them in migrations without schema drift, while embeddings are written and ranked with raw SQL — cosine distance via the `<=>` operator over an HNSW index. Resume fit scores are a single ranked query, not an application-side loop.

### Streaming UX

Bullet tailoring and interview prep stream token-by-token: Gemini's async chunk iterator is wrapped in a web `ReadableStream` inside `lib/ai/stream.ts` and returned straight from the Route Handler to the browser. The user sees output begin in under a second instead of staring at a spinner for ten.

### Per-request data efficiency

- The session lookup is memoized with `React.cache`, so a request costs one Better Auth call instead of one per layout + page.
- Independent reads on a page are fetched with `Promise.all` instead of waterfalling.

### Private resume storage

Resume PDFs live in a **private** Vercel Blob store and are streamed only through an authenticated, ownership-scoped route handler. The blob URL is never exposed publicly.

## Challenges & solutions

| Challenge | Solution |
| --- | --- |
| **Prisma 7 dropped the bundled query engine** | Schema and generated client live in `packages/db/`; migrations run from the repo root via `prisma.config.ts`. |
| **Connection exhaustion in serverless** | Next.js serverless functions were exhausting Postgres connections with the standard `pg` driver (plus TLS/SNI routing issues). Switched to `@neondatabase/serverless` + `@prisma/adapter-neon`, which pool natively over HTTP/WebSocket. |
| **Better Auth pulled a broken kysely** | kysely `0.29.2` stopped re-exporting a symbol the adapter imports; pinned to `0.28.17` via an npm `override`. |
| **Next 16 renamed `middleware` → `proxy`** | Read the bundled Next docs and adopted the new `proxy.ts` convention — which also reinforced the decision to keep auth checks in the data layer. |
| **AI output can't be trusted** | The Zod round-trip (schema-out, validate-in) makes off-schema Gemini responses an explicit, recoverable failure instead of a page crash. |
| **Resume privacy** | Private Blob store + authenticated streaming route; no public URLs. |

## Related docs

- [Setup & scripts](setup.md)
- [Deploy guide](deploy.md)
- [Manual QA checklist](manual-qa.md)
- [Design system](DESIGN.md)
