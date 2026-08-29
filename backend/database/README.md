# Database migrations

The SQL files in `migrations/` are the authoritative, forward-only history for
the QUANDA backend database.

## Commands

From `backend/`, with database variables loaded from `.env` or the process
environment:

```sh
npm run migrate:status
npm run migrate
```

The migration commands require only `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`,
and `DB_PASSWORD`. The status command creates the `schema_migrations` metadata
table when it does not yet exist, but it does not apply application tables.

## Safety rules

- Never edit or rename an applied migration. Add the next numbered SQL file.
- Checksums stop execution if an applied migration has changed.
- Execution stops if the database records an applied migration whose local file
  is missing.
- A MySQL advisory lock prevents two application processes from migrating at
  the same time.
- MySQL and MariaDB DDL can commit implicitly, so migrations are deliberately
  not presented as transactional. Each table in the initial migration uses
  `CREATE TABLE IF NOT EXISTS`, making an interrupted first run safe to retry.
- There is no automatic destructive rollback command. A correction must be a
  separately reviewed forward migration.

JSON documents use `LONGTEXT` for broad cPanel MariaDB compatibility. The API
validates and serializes these values before storage; analytics may use MariaDB
JSON functions on the valid JSON text.

Phase 5 defines and verifies the schema locally. Do not run either command
against production until the cPanel environment is reviewed in the deployment
phase and a database backup exists.
