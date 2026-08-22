# QUANDA

QUANDA turns a creative project brief, deadline, current experience, and weekly availability into a practical 4–8 stage learning and production roadmap. It supports English and Vietnamese, matches stages to a verified local tutorial catalogue, and stays demonstrable without an AI key.

## 1. Product overview

The app is designed for students and early-career creatives who need to learn unfamiliar tools while finishing a real deliverable. It provides:

- Deadline-aware feasibility guidance and time estimates
- Ordered learning and production tasks
- Curated tutorial recommendations
- English and Vietnamese interface modes
- Saved drafts, roadmap progress, and stage completion in the browser
- Optional Google Gemini-generated roadmaps with a deterministic demo fallback

## 2. MVP scope

This repository contains the proposal-ready MVP only: one responsive planning flow, the server-side roadmap endpoint, local tutorial data, validation, persistence, accessibility states, and deployment configuration. QUANDA is not a chatbot, account system, collaboration tool, or learning-management platform.

## 3. Screenshots

> Screenshot placeholder: add final desktop and mobile screenshots after the public deployment URL is confirmed.

The generated social preview is available at `public/quanda-social-card.png`.

## 4. Local installation

Requirements: Node.js 22.13 or newer and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm run dev
```

Open `http://localhost:3000`.

## 5. Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Server-only Google AI Studio API key. With no key, QUANDA uses demo mode. |
| `GEMINI_BASE_URL` | No | Gemini API endpoint. Defaults to Google's `v1beta` endpoint. |
| `GEMINI_MODEL` | No | Model name. Defaults to `gemini-3.1-flash-lite`. |
| `GEMINI_CLASSIFICATION_MODEL` | No | Model used for Creative DNA classification; falls back to `GEMINI_MODEL`. |
| `GEMINI_CLASSIFICATION_TIMEOUT_MS` | No | Creative DNA classification timeout, clamped to 500–25,000 ms. |
| `GEMINI_ROADMAP_GENERATION_TIMEOUT_MS` | No | Timeout for the initial roadmap request, clamped to 1,000–60,000 ms. |
| `GEMINI_ROADMAP_REPAIR_TIMEOUT_MS` | No | Independent fresh timeout for repairing an invalid roadmap response, clamped to 1,000–60,000 ms. |
| `GEMINI_FILE_SEARCH_STORE` | For semantic retrieval | Indexed Gemini File Search store resource name. |
| `GEMINI_FILE_SEARCH_ONTOLOGY_HASH` | For semantic retrieval | Source hash of the ontology indexed in that store. |
| `GEMINI_FILE_SEARCH_EMBEDDING_MODEL` | No | Store embedding model. Defaults to `models/gemini-embedding-2`. |
| `GEMINI_RETRIEVAL_MODEL` | No | Model used for retrieval interactions; falls back to `GEMINI_MODEL`. |
| `GEMINI_RETRIEVAL_TIMEOUT_MS` | No | Semantic retrieval timeout between 250 and 15,000 ms. |
| `YOUTUBE_API_KEY` | No | Server-only YouTube Data API key for optional live video discovery. Curated and indexed matching works without it. |
| `NEXT_PUBLIC_APP_URL` | No | Public app origin for local documentation and deployment configuration. |

Creative DNA uses a compact, OpenAPI-compatible Gemini structured-output schema, then validates the complete response against the stricter server-side contract. Fallback diagnostics log only a bounded error class and status, never model output or secrets.

Never prefix the Gemini key with `NEXT_PUBLIC_` and never place it in client-side code. `.env.local` is ignored by Git.

## 6. Google AI Studio setup

1. Open Google AI Studio and create an API key for the project that will run QUANDA.
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`.
3. Keep `GEMINI_MODEL=gemini-3.1-flash-lite`, or change it only to a compatible Gemini model available to the project.
4. Restart the development server.

The default Gemini API endpoint is:

```text
https://generativelanguage.googleapis.com/v1beta
```

API access, models, quotas, regional availability, and billing depend on the Google Cloud project connected to the AI Studio key. QUANDA does not assume that Gemini usage is free.

The browser sends only the validated roadmap request to `/api/roadmap`. The server route reads the key, calls the Gemini API, validates the JSON, attempts one repair when necessary, and returns normalized data. The key is never included in browser code or API responses.

## 7. Demo mode

When `GEMINI_API_KEY` is absent, `/api/roadmap` returns a deterministic roadmap based on the confirmed Creative DNA and learning plan. AI roadmaps must carry every selected tutorial into the production path exactly once; invalid responses receive one constrained repair. If that repair fails, the fallback groups the complete skill-gap set into at most eight stages while preserving every selected verified tutorial, with a bilingual explanation.

## 8. Add tutorials

Edit `src/data/tutorials.json`. Each entry needs:

- A unique `id`
- English and Vietnamese display titles
- Creator, verified direct YouTube URL, matching `youtubeVideoId`, and content language
- A supported `applicationId`
- Search topics, level, duration, verification date, and source type

Only catalogue IDs may be rendered as tutorial links. Every catalogue entry must be a verified, direct YouTube video URL with a matching 11-character video ID. If no video matches, QUANDA shows an empty-state message instead of inventing a link or sending the user to search results.

## 9. Add translations

Edit `src/i18n/translations.ts`. Add the same key to both the `en` and `vi` objects, then use the typed translation object in the relevant component. Keep loading, validation, timeout, and fallback messages bilingual.

## 10. Test commands

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run test:e2e
pnpm run build
```

Run the complete check sequence with:

```bash
pnpm run test:all
```

`npm run build` executes the same production build script and is the Vercel compatibility check.

## Knowledge contracts and evaluation

Versioned Creative DNA, ontology, tutorial metadata, and tutorial-score contracts are documented in [`docs/knowledge-contracts.md`](docs/knowledge-contracts.md). The offline benchmark and metric definitions are documented in [`evals/README.md`](evals/README.md).

Run the deterministic baseline without Gemini or YouTube access:

```bash
pnpm eval
pnpm eval:ontology
pnpm eval:retrieval
pnpm eval:creative-dna
pnpm eval:tutorials
pnpm tutorial:match --case blender-beginner-toon
```

The compiled runtime ontology and update workflow are documented in [`docs/ontology.md`](docs/ontology.md). Semantic retrieval, File Search indexing, freshness checks, diagnostics, and fallback behavior are documented in [`docs/ontology-retrieval.md`](docs/ontology-retrieval.md). Ontology-backed classification is documented in [`docs/creative-dna-analysis.md`](docs/creative-dna-analysis.md), the editable review/persistence flow in [`docs/creative-dna-review.md`](docs/creative-dna-review.md), and contextual skill-gap/tutorial matching in [`docs/tutorial-matching.md`](docs/tutorial-matching.md).

## 11. Vercel deployment

1. Push this repository to GitHub.
2. Import the repository into Vercel and keep the detected Next.js framework preset.
3. Add `GEMINI_API_KEY` as a server environment variable. Optionally add `YOUTUBE_API_KEY` for live YouTube discovery; the verified local catalogue remains the first source tier.
4. Run `pnpm ontology:index` locally with the same API key, then add the printed `GEMINI_FILE_SEARCH_STORE` and `GEMINI_FILE_SEARCH_ONTOLOGY_HASH` values to Vercel. Skip this step to use deterministic local ontology retrieval.
5. Optionally add `GEMINI_MODEL=gemini-3.1-flash-lite`, `GEMINI_RETRIEVAL_TIMEOUT_MS`, and `NEXT_PUBLIC_APP_URL` with the public origin.
6. Deploy and test the public URL in English and Vietnamese.
7. Temporarily test without the API key, with a stale index hash, or with the upstream service unavailable, to confirm demo and retrieval fallback behaviour.

On a Vercel Hobby project, merge production changes through the GitHub account that owns the Vercel project. Hobby deployments can block a production commit whose Git author is not a project member, even when that commit is already on the production branch.

The server endpoint uses bounded request sizes, a short in-memory rate limit, and request timeouts; it does not start background jobs.

## 12. Known limitations

- Browser persistence is device-local and has no account sync.
- The in-memory rate limit is best-effort and is not shared across server instances.
- The catalogue is intentionally small and covers the applications required by this MVP.
- AI output quality depends on the selected Gemini model and account availability.
- Feasibility estimates are planning guidance, not guarantees.
- The demo templates cover Blender, Figma, and DaVinci Resolve project patterns.

## 13. Future features

- Cloud-synced projects and accounts
- Instructor feedback and shared roadmaps
- A larger, periodically re-verified tutorial catalogue
- Privacy-conscious production analytics
- Export to calendar or printable project plan
