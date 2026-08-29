# QUANDA API

Lightweight Node.js 20 backend for persistent anonymous users, sessions,
project snapshots, product events, analytics, and synthetic development data.

The existing QUANDA frontend and AI endpoints remain on Vercel. This service is
an optional persistence layer: an unavailable analytics backend must never stop
Creative DNA analysis, tutorial matching, roadmap generation, or the calendar.

The Vercel frontend uses one centralized client in `src/lib/quandaApi.ts`. It
bootstraps opaque anonymous identities, renews idle sessions, batches events,
and synchronizes versioned project snapshots. Browser storage remains the
immediate offline-safe copy.

## Local status

Phase 5 adds the reviewed persistence schema and a checksum-protected,
forward-only migration runner. The schema and runner are verified locally; no
production database migration has been executed.

## Local setup

1. Use Node.js 20.20.2.
2. Run `npm install` in this directory.
3. Copy `.env.example` to a local `.env` file.
4. Enter local-only database credentials and locally generated secrets.
5. Run `npm run migrate:status`, then `npm run migrate` against the local
   database.
6. Run `npm start`.

Never commit `.env`. Production credentials belong in cPanel environment
variables and are not needed during frontend development.

## API

### Public

- `GET /health`
- `POST /api/v1/session`

Session bootstrap accepts optional `identityToken` and `sessionToken` values.
It returns opaque replacements when a new anonymous identity or session is
needed. A session becomes inactive after 30 minutes by default.

### Anonymous-session authenticated

Send the session token as `Authorization: Bearer <token>`.

- `POST /api/v1/events`
- `POST /api/v1/projects`
- `GET /api/v1/projects`
- `GET /api/v1/projects/:id`
- `PATCH /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`

Event requests are batches with client-generated UUIDs. Duplicate client event
IDs are ignored safely. Project deletion is a soft deletion; project updates
use an expected version to prevent silent conflicting writes.

### Administrative

Send `ADMIN_API_TOKEN` as a bearer token.

- `GET /api/v1/admin/analytics/overview`
- `GET /api/v1/admin/analytics/retention`
- `GET /api/v1/admin/analytics/events`

Query parameters:

- `start=YYYY-MM-DD`
- `end=YYYY-MM-DD`
- `source=real|synthetic` (defaults to `real`)
- `scenarioId=<uuid>` when a synthetic scenario is selected

Synthetic data is excluded by default.

## Event transport

`POST /api/v1/events` accepts:

```json
{
  "events": [
    {
      "id": "e1c2657b-0faf-4bb5-887d-f05642928a6a",
      "name": "roadmap_generated",
      "eventTime": "2026-08-28T08:00:00.000Z",
      "projectId": "ff407342-c7cc-497c-b5c6-c21f555f9301",
      "properties": {
        "source": "ai",
        "stageCount": 6
      }
    }
  ]
}
```

Properties are limited to small primitive values. Briefs and full project
snapshots belong in project storage, not analytics properties.

Tracked product milestones include brief submission, Creative DNA completion
and confirmation, tutorial matching/open/replacement, roadmap generation and
viewing, stage completion, calendar adoption, project creation/update/
completion, language changes, sessions, and returning visits. UI-only clicks
are intentionally excluded.

## Retention definition

D1, D7, and D30 are exact UTC calendar-day return metrics. A retained user has
a session on the specified day after their first-use date. Cohorts too young to
reach the measured day are excluded from its denominator.

## Synthetic data

After the schema is installed, a development scenario can be created:

```sh
npm run seed:synthetic -- --users 1000 --d1 0.42 --d7 0.24 --d30 0.12
```

Useful controls include `--start`, `--end`, `--sessions`, `--tutorial`,
`--calendar`, `--completion`, `--seed`, and `--name`.

Deletion requires both the exact scenario UUID and a scenario-specific
confirmation value:

```sh
npm run delete:synthetic -- \
  --scenario 00000000-0000-0000-0000-000000000000 \
  --confirm DELETE-SYNTHETIC-00000000-0000-0000-0000-000000000000
```

The deletion service constrains every affected table by both `scenario_id` and
`is_synthetic = TRUE`; it cannot select real activity.

## Production boundary

The intended production target is the existing cPanel application:

- Application root: `/home/dmsoghwg/quanda-api-app`
- Startup file: `app.js`
- Node.js: 20.20.2
- URL: `https://quanda-api.dms.onl/`

No deployment should occur before migration review, local tests, frontend
integration, and explicit production environment-variable setup.

The verified cPanel settings, exact environment-variable list, safe upload
boundary, migration order, and production verification sequence are documented
in [`docs/NAMECHEAP_DEPLOYMENT.md`](docs/NAMECHEAP_DEPLOYMENT.md).
