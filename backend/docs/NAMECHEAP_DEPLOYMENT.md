# QUANDA Namecheap deployment runbook

This runbook targets only the existing QUANDA backend application. Do not use
these steps for any other cPanel application or database.

## Verified target

- Application URL: `https://quanda-api.dms.onl/`
- Application root: `/home/dmsoghwg/quanda-api-app`
- Startup file: `app.js`
- Application mode: `Production`
- Node.js version: `20.20.2`
- Database: `dmsoghwg_quanda`
- Privileged database user: `dmsoghwg_quanda_app`
- Server-side database host: `127.0.0.1`
- Database port: `3306`

The cPanel Node app exists and is running. At the Phase 7 inspection it had no
application environment variables configured.

## cPanel environment variables

Add these in **cPanel → Setup Node.js App → quanda-api.dms.onl → Edit →
Environment variables**. Enter secret values directly in cPanel; never commit
or paste them into chat.

| Variable | Value or instruction | Secret |
| --- | --- | --- |
| `DB_HOST` | `127.0.0.1` | No |
| `DB_PORT` | `3306` | No |
| `DB_NAME` | `dmsoghwg_quanda` | No |
| `DB_USER` | `dmsoghwg_quanda_app` | No |
| `DB_PASSWORD` | Existing password for the database user | Yes |
| `SESSION_SECRET` | A new independent random value with at least 32 bytes of entropy | Yes |
| `ADMIN_API_TOKEN` | A different new random value with at least 32 bytes of entropy | Yes |
| `ALLOWED_ORIGINS` | `https://quanda-dms4-demo-jet.vercel.app` | No |
| `SESSION_IDLE_MINUTES` | `30` | No |
| `EVENT_BATCH_LIMIT` | `50` | No |
| `LOG_LEVEL` | `info` | No |

Do not add `PORT`; cPanel/Passenger supplies it. Production mode already sets
`NODE_ENV=production`. If cPanel exposes either value, preserve the
platform-managed value.

Generate `SESSION_SECRET` and `ADMIN_API_TOKEN` privately and independently,
for example with `openssl rand -hex 32`. Do not reuse the database password or
either token for another purpose.

## Upload contents

Copy the contents of `backend/` into `/home/dmsoghwg/quanda-api-app`:

- `app.js`
- `package.json`
- `pnpm-lock.yaml`
- `src/`
- `database/`
- `scripts/`

Do not upload `.env`, `node_modules/`, `tests/`, `.DS_Store`, logs, or local
coverage files. Inspect the existing target before replacing any file and keep
a recoverable backup of material existing content.

## Phase 8 execution order

1. Verify the exact target directory and inspect its current contents.
2. Back up material existing QUANDA files without touching sibling apps.
3. Upload the backend package into the application root.
4. Add the cPanel environment variables above and save them.
5. Run **Run NPM Install** for this application only.
6. Enter the displayed QUANDA virtual environment and run `npm run deployment:check`.
7. Run `npm run migrate:status`, review the pending migration, then run
   `npm run migrate` once.
8. Run `npm run migrate:status` again and then `npm run deployment:preflight`.
9. Restart only `quanda-api.dms.onl`.
10. Verify `/health`, session creation, project save/restore, event batching,
    CORS, and protected analytics authorization.

The migration runner is additive and checksum-verified. Never modify a
migration already recorded in `schema_migrations`, and never run destructive
SQL against the production database.

## Vercel handoff after backend verification

Set this frontend production environment variable in the connected Vercel
project and redeploy:

```text
NEXT_PUBLIC_QUANDA_API_URL=https://quanda-api.dms.onl
```

Do not put `DB_PASSWORD`, `SESSION_SECRET`, or `ADMIN_API_TOKEN` in Vercel or in
any `NEXT_PUBLIC_` variable.
