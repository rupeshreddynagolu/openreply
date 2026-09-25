# Migrate datastore from PostgreSQL to MySQL

## Why

The app currently runs on PostgreSQL via Prisma (`@prisma/adapter-pg`). The
user wants to run on MySQL instead (not MariaDB — confirmed as a distinct
target, even though Prisma's MySQL connector happens to work against both).

## Current state

- `prisma/schema.prisma`: `datasource db { provider = "postgresql" }`
- `lib/db/client.ts`: `PrismaPg` adapter over `pg`
- `docker-compose.yml`: local `postgres:16` service
- `docs/setup.md`, `docs/deploy-dokploy.md`, `README.md`: Postgres-specific
  instructions throughout (brew install, Railway "Add PostgreSQL", connection
  string examples)
- 19 existing Prisma migrations, all Postgres SQL
- Live dev data in the local Postgres container (`openreply-postgres-1`,
  running 8+ days): 2 users, 2 workspaces, 1 Instagram account, 2 automations,
  13 DM logs, 615 operational events, plus whatever rows exist in the other
  tables (sessions, tracked links, link clicks, webhook events, follower
  snapshots, processed comments) — not separately counted yet, must be
  captured by the migration script regardless of count.

## Schema-level incompatibility

Prisma's MySQL connector has no scalar list (`String[]`) support at all. Two
fields in `Automation` use it:

- `keywords String[]`
- `publicReplyMessages String[] @default([])`

Everything else in the schema (enums, `Json` columns, `@db.Date`, relations,
cascades, indexes, unique constraints) maps to MySQL with no changes. Prisma
auto-sizes unique `String` columns to `VARCHAR(191)` on MySQL by default,
which is sufficient here — no per-field `@db.VarChar` annotations needed.

## Design

### 1. Schema changes (`prisma/schema.prisma`)

- `datasource db { provider = "postgresql" }` → `provider = "mysql"`
- `keywords String[]` → `keywords Json`
- `publicReplyMessages String[] @default([])` → `publicReplyMessages Json @default("[]")`

### 2. Driver adapter swap

- Remove `@prisma/adapter-pg`, `pg`, `@types/pg`
- Add `@prisma/adapter-mariadb@7.8.0` (Prisma's official MySQL/MariaDB driver
  adapter — package is named `adapter-mariadb` but targets both engines) and
  `mariadb@^3.5.4` (the underlying driver)
- `lib/db/client.ts`: swap `PrismaPg` for the mariadb adapter's equivalent
  constructor, parsing `DATABASE_URL` as a `mysql://` connection string

### 3. Application code — the two JSON-typed fields

Converting `keywords`/`publicReplyMessages` to `Json` changes their generated
TS type from `string[]` to `Prisma.JsonValue`. Grepped every real usage;
write sites are unaffected (Prisma's `Json` field accepts a plain JS array
directly). Read sites that pull the field straight off a Prisma query result
and treat it as `string[]` need a cast. Confirmed touch points:

- `lib/queue/dm-worker.ts` (lines ~240, ~973)
- `lib/polling/comment-reconciler.ts` (lines ~95, ~131, ~187)
- `lib/reports/data.ts` (line ~164)
- `app/api/logs/route.ts` (line ~44, via a `select`)
- `app/api/automations/route.ts` (read-back sites only; the write/assignment
  sites already pass plain arrays and don't need changes)

Add a small typed helper, e.g. in `lib/utils/`:

```ts
export function asStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
```

Use it at each read site above. Frontend/API-response-facing `string[]`
interfaces (dashboard pages, `components/campaign-builder.tsx`,
`components/keyword-input.tsx`, etc.) are untouched — they consume JSON over
HTTP either way, independent of the Prisma-side type.

### 4. Data migration script

Postgres and MySQL dump formats aren't interchangeable, and the array→JSON
change means a raw SQL dump couldn't be replayed even if they were. Write a
one-off script (e.g. `scripts/migrate-pg-to-mysql.ts`, deleted after use) that:

1. Connects to the existing Postgres DB with the raw `pg` client (reading, not
   through Prisma, so it works regardless of the schema-file changes already
   applied for MySQL).
2. Connects to the new, empty MySQL DB through the updated Prisma client.
3. Reads and inserts every table in FK-dependency order, preserving all
   existing IDs so foreign keys stay intact:

   ```
   User → Account → Session → VerificationToken
     → Workspace → WorkspaceMember → WorkspaceInvitation
     → InstagramAccount → FollowerSnapshot
     → Automation
     → DmLog → ProcessedComment → TrackedLink → LinkClick
     → WebhookEvent → OperationalEvent
   ```

4. Converts `keywords` / `publicReplyMessages` from Postgres arrays to plain
   JS arrays (structurally identical — Postgres text[] already deserializes
   to a JS array via `pg`) on the way into the MySQL insert.
5. Prints a per-table row count on both sides at the end so the run is
   self-verifying.

### 5. Infra changes

- `docker-compose.yml`: replace the `postgres` service with `mysql:8`
  (`MYSQL_DATABASE`, `MYSQL_ROOT_PASSWORD` or a dedicated user, port 3306,
  healthcheck via `mysqladmin ping`)
- `.env`: `DATABASE_URL` becomes `mysql://user:pass@localhost:3306/openreply`
- Existing 19 Postgres migrations moved aside (e.g. into
  `prisma/migrations-postgres-archive/`, out of Prisma's migrations dir so
  they're not picked up) and a fresh baseline migration generated against the
  empty MySQL database from the current schema via `prisma migrate dev`

### 6. Docs

Update `docs/setup.md`, `docs/deploy-dokploy.md`, `README.md`: local install
instructions (`brew install postgresql@16` → `brew install mysql`,
`createdb` → `mysql -e "CREATE DATABASE ..."`), Railway "Add PostgreSQL" →
"Add MySQL", connection string examples, and any prose that names Postgres
as the datastore.

### 7. Verification

1. `npx tsc --noEmit` and `npx vitest run` after the code changes (schema +
   client + the `asStringArray` call sites) — before touching real data.
2. Bring up the MySQL container, run the fresh baseline migration.
3. Run the migration script against the live Postgres data, check the
   printed row counts match on both sides.
4. Point `.env` at MySQL, restart server + worker.
5. Visually confirm in the browser: dashboard shows the same connected
   Instagram account, the 2 campaigns with their keywords/reply messages
   intact, DM logs list matches pre-migration.
6. Only after that's confirmed: stop the old Postgres container (don't
   delete the volume immediately — keep it as a rollback point for a few
   days).

## Rollback

Until the old Postgres container/volume is deleted, rollback is: revert
`.env`'s `DATABASE_URL` and `prisma/schema.prisma`'s provider, reinstall
`@prisma/adapter-pg`/`pg`, restart. The Postgres data is untouched by any of
this (the migration only reads from it).

## Out of scope

- Any hosting/production deployment change beyond updating the docs to
  describe MySQL instead of Postgres — no actual production cutover is part
  of this task.
- Renaming `@prisma/adapter-mariadb` usage or adding MariaDB-specific
  handling; the target is MySQL and the shared adapter package is used only
  because Prisma ships one adapter for both engines.
