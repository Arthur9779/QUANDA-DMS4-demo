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
| `NEXT_PUBLIC_APP_URL` | No | Public app origin for local documentation and deployment configuration. |

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

When `GEMINI_API_KEY` is absent, `/api/roadmap` returns a deterministic roadmap based on the project type. The UI labels this as demo mode. If a configured AI request times out, fails, or returns invalid JSON after one repair attempt, QUANDA returns the same safe fallback shape with a bilingual notice.

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

## 11. Vercel deployment

1. Push this repository to GitHub.
2. Import the repository into Vercel and keep the detected Next.js framework preset.
3. Add `GEMINI_API_KEY` as a server environment variable.
4. Optionally add `GEMINI_MODEL=gemini-3.1-flash-lite` and `NEXT_PUBLIC_APP_URL` with the public origin.
5. Deploy and test the public URL in English and Vietnamese.
6. Temporarily test without the API key, or with the upstream service unavailable, to confirm demo and fallback behaviour.

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
