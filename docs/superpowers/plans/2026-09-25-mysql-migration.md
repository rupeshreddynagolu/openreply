# MySQL Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the app's datastore from PostgreSQL to MySQL, migrating existing dev data, with zero net loss of functionality.

**Architecture:** Swap the Prisma datasource provider and driver adapter, convert the two Postgres-only `String[]` columns to `Json`, fix the handful of call sites whose TS type changes as a result, regenerate migrations against a fresh MySQL database, then run a one-off script that copies every row across from the live Postgres database.

**Tech Stack:** Prisma 7.8.0, `@prisma/adapter-mariadb` (Prisma's official MySQL/MariaDB driver adapter, works for both engines — target here is MySQL specifically), `mariadb` npm driver package, MySQL 8 (Docker), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-25-mysql-migration-design.md`

## Global Constraints

- Target engine is MySQL, not MariaDB (confirmed with the user) — the adapter package name (`adapter-mariadb`) is just what Prisma ships for both.
- `@prisma/adapter-mariadb` and `mariadb` must be pinned to versions matching the installed `prisma`/`@prisma/client` (`7.8.0`): `@prisma/adapter-mariadb@7.8.0`, `mariadb@^3.5.4`.
- Do not delete the old Postgres container/volume until Task 7's end-to-end verification passes.
- `prisma.config.ts` needs no changes — it already reads `DATABASE_URL` from env, and will pick up the new MySQL connection string automatically once `.env` changes.

---

### Task 1: `asStringArray` helper

**Files:**
- Create: `lib/utils/json-array.ts`
- Test: `__tests__/json-array.test.ts`

**Interfaces:**
- Produces: `asStringArray(value: Prisma.JsonValue | null | undefined): string[]` — used by Task 3 to bridge the `Automation.keywords` / `Automation.publicReplyMessages` fields (which become `Json`-typed in Task 2) back to `string[]` at each read site.

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/json-array.test.ts
/**
 * asStringArray — Unit Tests
 */

import { describe, it, expect } from "vitest";
import { asStringArray } from "../lib/utils/json-array";

describe("asStringArray", () => {
  it("returns the array unchanged when every element is a string", () => {
    expect(asStringArray(["LINK", "SHOP"])).toEqual(["LINK", "SHOP"]);
  });

  it("returns an empty array for null", () => {
    expect(asStringArray(null)).toEqual([]);
  });

  it("returns an empty array for undefined", () => {
    expect(asStringArray(undefined)).toEqual([]);
  });

  it("returns an empty array for a non-array JSON value", () => {
    expect(asStringArray("LINK")).toEqual([]);
    expect(asStringArray(42)).toEqual([]);
    expect(asStringArray({ a: 1 })).toEqual([]);
  });

  it("filters out non-string elements from a mixed array", () => {
    expect(asStringArray(["LINK", 1, null, "SHOP"])).toEqual(["LINK", "SHOP"]);
  });

  it("returns an empty array for an empty array", () => {
    expect(asStringArray([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/json-array.test.ts`
Expected: FAIL — `Cannot find module '../lib/utils/json-array'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/utils/json-array.ts
/**
 * JSON Array Helper
 *
 * Automation.keywords and Automation.publicReplyMessages are stored as a
 * Json column on MySQL (Prisma has no scalar-list support for MySQL), so
 * Prisma's generated type for them is Prisma.JsonValue rather than
 * string[]. This narrows a JsonValue read back from Prisma down to a
 * string[], for the handful of call sites that need one.
 */

import type { Prisma } from "@/app/generated/prisma/client";

export function asStringArray(
  value: Prisma.JsonValue | null | undefined
): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/json-array.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/utils/json-array.ts __tests__/json-array.test.ts
git commit -m "feat: add asStringArray helper for JSON-typed keyword fields"
```

---

### Task 2: Schema provider swap + driver adapter swap

**Files:**
- Modify: `prisma/schema.prisma:9` (datasource provider), `prisma/schema.prisma:179` (`keywords`), `prisma/schema.prisma:200` (`publicReplyMessages`)
- Modify: `lib/db/client.ts` (driver adapter import + construction)
- Modify: `package.json` (dependencies)

**Interfaces:**
- Consumes: nothing new.
- Produces: `Automation.keywords` and `Automation.publicReplyMessages` become `Prisma.JsonValue` in the generated client — this is what makes Task 3's fixes necessary. `lib/db/client.ts` still exports `prisma` and `getPrisma()` with the same signatures as before; only the adapter underneath changes.

This task deliberately leaves the codebase **not type-checking** at the end of Step 5 — that broken state (16 known errors across 3 files) is the expected, verified output of this exact change, fixed in Task 3. Do not "fix forward" inside this task.

- [ ] **Step 1: Swap the Prisma dependencies**

```bash
npm uninstall @prisma/adapter-pg pg @types/pg
npm install @prisma/adapter-mariadb@7.8.0 mariadb@^3.5.4
```

- [ ] **Step 2: Edit the schema**

In `prisma/schema.prisma`, change:

```prisma
datasource db {
  provider = "postgresql"
}
```

to:

```prisma
datasource db {
  provider = "mysql"
}
```

In the `Automation` model, change:

```prisma
  keywords       String[]
```

to:

```prisma
  keywords       Json
```

and change:

```prisma
  publicReplyMessages String[] @default([])
```

to:

```prisma
  publicReplyMessages Json @default("[]")
```

- [ ] **Step 3: Regenerate the Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client (7.8.0) to ./app/generated/prisma`

- [ ] **Step 4: Update `lib/db/client.ts`**

Current file:

```typescript
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  return new PrismaClient({
    adapter: new PrismaPg(databaseUrl),
  });
}
```

Change the first line and the adapter construction:

```typescript
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  return new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
  });
}
```

(The rest of the file — `getPrisma()`, the `prisma` proxy export — is unchanged.)

- [ ] **Step 5: Confirm the expected (broken) typecheck state**

Run: `npx tsc --noEmit`
Expected: exactly 16 errors, all in `app/reports/[shareSlug]/page.tsx`, `lib/polling/comment-reconciler.ts`, and `lib/queue/dm-worker.ts`. If you see errors anywhere else, stop — something else in the schema changed unexpectedly.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma lib/db/client.ts package.json package-lock.json
git commit -m "feat: switch Prisma datasource and driver adapter to MySQL"
```

---

### Task 3: Fix the JsonValue read sites

**Files:**
- Modify: `lib/reports/data.ts:164`
- Modify: `lib/polling/comment-reconciler.ts:92-135` (approximate — read the current file, these are the lines as of Task 2's schema change)
- Modify: `lib/queue/dm-worker.ts:240`, `lib/queue/dm-worker.ts:364-378`, `lib/queue/dm-worker.ts:973`

**Interfaces:**
- Consumes: `asStringArray` from Task 1 (`lib/utils/json-array.ts`).
- Produces: a clean `npx tsc --noEmit` — this is the last task that touches application code before infra/data work.

- [ ] **Step 1: Fix `lib/reports/data.ts`**

Add the import near the top of the file (alongside the other `lib/` imports already there):

```typescript
import { asStringArray } from "@/lib/utils/json-array";
```

Change line 164 from:

```typescript
      keywords: automation.keywords,
```

to:

```typescript
      keywords: asStringArray(automation.keywords),
```

This alone also fixes the 3 downstream errors in `app/reports/[shareSlug]/page.tsx:262` — that file's `report.campaign.keywords` type is inferred from this function's return value, not declared separately.

- [ ] **Step 2: Fix `lib/polling/comment-reconciler.ts`**

Add the import near the top of the file:

```typescript
import { asStringArray } from "@/lib/utils/json-array";
```

Find the `.catch((error): SweepStat => ({ ... }))` block (around line 90-98) and change:

```typescript
        keywords: automation.keywords.join(","),
```

to:

```typescript
        keywords: asStringArray(automation.keywords).join(","),
```

Find the `sweepCampaign(automation, sinceMs, tokenCache)` call (around line 92) and change it to transform the automation object first:

```typescript
    const stat = await sweepCampaign(
      { ...automation, keywords: asStringArray(automation.keywords) },
      sinceMs,
      tokenCache
    ).catch(
```

Leave `sweepCampaign`'s own parameter type annotation (`keywords: string[]`) and its internal body (`automation.keywords.join(",")` inside the function, and the `matchKeywords(c.text ?? "", automation.keywords, automation.wholeWordMatch)` call further down) exactly as they are — they already expect `string[]`, and now receive it.

- [ ] **Step 3: Fix `lib/queue/dm-worker.ts`**

Add the import near the top of the file:

```typescript
import { asStringArray } from "@/lib/utils/json-array";
```

Change line 240 from:

```typescript
      : matchKeywords(
          commentText,
          automation.keywords,
          automation.wholeWordMatch
        );
```

to:

```typescript
      : matchKeywords(
          commentText,
          asStringArray(automation.keywords),
          automation.wholeWordMatch
        );
```

Change line 973 (the same pattern, in the DM-triggered path) from:

```typescript
      : matchKeywords(
          messageText,
          automation.keywords,
          automation.wholeWordMatch
        );
```

to:

```typescript
      : matchKeywords(
          messageText,
          asStringArray(automation.keywords),
          automation.wholeWordMatch
        );
```

Change the reply-pool block (around line 362-367) from:

```typescript
    const replyPool =
      automation.publicReplyMessages.length > 0
        ? automation.publicReplyMessages
        : automation.publicReplyMessage
          ? [automation.publicReplyMessage]
          : [];
```

to:

```typescript
    const publicReplyMessages = asStringArray(automation.publicReplyMessages);
    const replyPool =
      publicReplyMessages.length > 0
        ? publicReplyMessages
        : automation.publicReplyMessage
          ? [automation.publicReplyMessage]
          : [];
```

This also fixes the remaining errors at (what were) lines 371 and 375 — `replyPool` is now `string[]`, so `.length` and index access both type-check.

- [ ] **Step 4: Run full typecheck**

Run: `npx tsc --noEmit`
Expected: no output (clean)

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: all test files pass (145+ tests, same count as before this plan started plus the 6 new `json-array` tests)

- [ ] **Step 6: Commit**

```bash
git add lib/reports/data.ts lib/polling/comment-reconciler.ts lib/queue/dm-worker.ts
git commit -m "fix: adapt keyword/reply-message read sites to Json-typed fields"
```

---

### Task 4: MySQL container, `.env`, fresh baseline migration

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env`, `.env.example`
- Create: `prisma/migrations-postgres-archive/` (moved from `prisma/migrations/`)
- Create: fresh migration under `prisma/migrations/` (generated by the tool, not hand-written)

**Interfaces:**
- Consumes: the MySQL-provider schema from Task 2.
- Produces: a running, empty MySQL database with the current schema applied — Task 5 reads from the old Postgres DB and writes into this one.

- [ ] **Step 1: Update `docker-compose.yml`**

Replace the `postgres` service:

```yaml
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: openreply
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

with:

```yaml
  mysql:
    image: mysql:8
    environment:
      MYSQL_DATABASE: openreply
      MYSQL_ROOT_PASSWORD: mysql
    ports:
      - "3306:3306"
    volumes:
      - mysqldata:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-pmysql"]
      interval: 5s
      timeout: 5s
      retries: 5
```

and update the `volumes:` block at the bottom from:

```yaml
volumes:
  pgdata:
  redisdata:
```

to:

```yaml
volumes:
  mysqldata:
  redisdata:
```

- [ ] **Step 2: Start the new MySQL container**

```bash
docker compose up -d mysql
docker compose ps
```

Expected: `mysql` service shows `healthy` within ~10-15s.

- [ ] **Step 3: Update `.env` and `.env.example`**

In both files, change:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/openreply
```

to:

```
DATABASE_URL=mysql://root:mysql@localhost:3306/openreply
```

- [ ] **Step 4: Archive the Postgres migrations**

```bash
mkdir -p prisma/migrations-postgres-archive
git mv prisma/migrations/2026* prisma/migrations-postgres-archive/
git mv prisma/migrations/migration_lock.toml prisma/migrations-postgres-archive/
```

- [ ] **Step 5: Generate the fresh MySQL baseline migration**

```bash
npx prisma migrate dev --name mysql_baseline
```

Expected: Prisma creates `prisma/migrations/<timestamp>_mysql_baseline/migration.sql` and applies it to the empty MySQL database with no prompts (there's no prior migration history to reconcile — the archived Postgres migrations are outside `prisma/migrations/` now, so Prisma doesn't see them).

- [ ] **Step 6: Verify the schema applied correctly**

```bash
npx prisma studio
```

Confirm all 16 tables from `prisma/schema.prisma` appear (User, Account, Session, VerificationToken, Workspace, WorkspaceMember, WorkspaceInvitation, InstagramAccount, FollowerSnapshot, Automation, DmLog, ProcessedComment, TrackedLink, LinkClick, WebhookEvent, OperationalEvent), all empty. Close Prisma Studio (Ctrl+C) when confirmed.

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml .env.example prisma/migrations-postgres-archive prisma/migrations
git commit -m "feat: add MySQL container, archive Postgres migrations, add MySQL baseline"
```

(`.env` is gitignored — no need to add it, but leave it updated on disk.)

---

### Task 5: Data migration script

**Files:**
- Create: `scripts/migrate-pg-to-mysql.ts`

**Interfaces:**
- Consumes: the running Postgres container (still up — do not stop it before this task), the running MySQL container from Task 4, the `prisma` export from `lib/db/client.ts` (now MySQL-backed) for writes, and a raw `pg.Client` for reads.
- Produces: every row from the Postgres database copied into MySQL with identical IDs, ready for Task 7's app-level verification.

- [ ] **Step 1: Write the migration script**

```typescript
// scripts/migrate-pg-to-mysql.ts
/**
 * One-off script: copies every row from the (still-running) Postgres
 * database into the new MySQL database, in FK-dependency order, converting
 * Automation.keywords / Automation.publicReplyMessages from Postgres text[]
 * to plain JS arrays (which Prisma's Json field accepts directly) along the
 * way. Safe to run against an empty MySQL database only — it does not
 * upsert or dedupe.
 *
 * Usage: PG_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/openreply" \
 *        npx tsx --env-file=.env scripts/migrate-pg-to-mysql.ts
 *
 * .env must already point DATABASE_URL at the target MySQL database — that
 * is what `prisma` (imported below) connects to.
 */

import { Client as PgClient } from "pg";
import { prisma } from "../lib/db/client";

const PG_DATABASE_URL = process.env.PG_DATABASE_URL;
if (!PG_DATABASE_URL) {
  throw new Error("PG_DATABASE_URL environment variable is required");
}

async function main() {
  const pg = new PgClient({ connectionString: PG_DATABASE_URL });
  await pg.connect();

  async function copyTable<T>(
    label: string,
    pgTable: string,
    insertMany: (rows: T[]) => Promise<unknown>
  ) {
    const { rows } = await pg.query<T>(`SELECT * FROM "${pgTable}"`);
    if (rows.length > 0) {
      await insertMany(rows);
    }
    console.log(`${label}: copied ${rows.length} rows`);
  }

  await copyTable("User", "User", (rows) =>
    prisma.user.createMany({ data: rows as never })
  );
  await copyTable("Account", "Account", (rows) =>
    prisma.account.createMany({ data: rows as never })
  );
  await copyTable("Session", "Session", (rows) =>
    prisma.session.createMany({ data: rows as never })
  );
  await copyTable("VerificationToken", "VerificationToken", (rows) =>
    prisma.verificationToken.createMany({ data: rows as never })
  );
  await copyTable("Workspace", "Workspace", (rows) =>
    prisma.workspace.createMany({ data: rows as never })
  );
  await copyTable("WorkspaceMember", "WorkspaceMember", (rows) =>
    prisma.workspaceMember.createMany({ data: rows as never })
  );
  await copyTable("WorkspaceInvitation", "WorkspaceInvitation", (rows) =>
    prisma.workspaceInvitation.createMany({ data: rows as never })
  );
  await copyTable("InstagramAccount", "InstagramAccount", (rows) =>
    prisma.instagramAccount.createMany({ data: rows as never })
  );
  await copyTable("FollowerSnapshot", "FollowerSnapshot", (rows) =>
    prisma.followerSnapshot.createMany({ data: rows as never })
  );
  await copyTable(
    "Automation",
    "Automation",
    (rows: Array<Record<string, unknown>>) =>
      prisma.automation.createMany({
        data: rows.map((r) => ({
          ...r,
          keywords: Array.isArray(r.keywords) ? r.keywords : [],
          publicReplyMessages: Array.isArray(r.publicReplyMessages)
            ? r.publicReplyMessages
            : [],
        })) as never,
      })
  );
  await copyTable("DmLog", "DmLog", (rows) =>
    prisma.dmLog.createMany({ data: rows as never })
  );
  await copyTable("ProcessedComment", "ProcessedComment", (rows) =>
    prisma.processedComment.createMany({ data: rows as never })
  );
  await copyTable("TrackedLink", "TrackedLink", (rows) =>
    prisma.trackedLink.createMany({ data: rows as never })
  );
  await copyTable("LinkClick", "LinkClick", (rows) =>
    prisma.linkClick.createMany({ data: rows as never })
  );
  await copyTable("WebhookEvent", "WebhookEvent", (rows) =>
    prisma.webhookEvent.createMany({ data: rows as never })
  );
  await copyTable("OperationalEvent", "OperationalEvent", (rows) =>
    prisma.operationalEvent.createMany({ data: rows as never })
  );

  await pg.end();
  await prisma.$disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run it**

```bash
PG_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/openreply" \
  npx tsx --env-file=.env scripts/migrate-pg-to-mysql.ts
```

Expected: one "copied N rows" line per table, no errors, ending in "Done."

- [ ] **Step 3: Verify row counts match on both sides**

```bash
PG_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/openreply" npx tsx --env-file=.env -e "
import { Client } from 'pg';
import { prisma } from './lib/db/client';
(async () => {
  const pg = new Client({ connectionString: process.env.PG_DATABASE_URL });
  await pg.connect();
  const tables = ['User','Account','Session','Workspace','WorkspaceMember','WorkspaceInvitation','InstagramAccount','FollowerSnapshot','Automation','DmLog','ProcessedComment','TrackedLink','LinkClick','WebhookEvent','OperationalEvent'];
  for (const t of tables) {
    const pgCount = (await pg.query(\`SELECT COUNT(*) FROM \"\${t}\"\`)).rows[0].count;
    // @ts-expect-error dynamic model access for a one-off verification script
    const myCount = await prisma[t.charAt(0).toLowerCase() + t.slice(1)].count();
    console.log(t, 'postgres:', pgCount, 'mysql:', myCount, pgCount == myCount ? 'OK' : 'MISMATCH');
  }
  await pg.end();
  await prisma.\$disconnect();
})();
"
```

Expected: every row printed `OK`. If any row says `MISMATCH`, stop and investigate before proceeding — do not continue to Task 6/7 with unverified data.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-pg-to-mysql.ts
git commit -m "feat: add one-off Postgres-to-MySQL data migration script"
```

---

### Task 6: Update deployment docs

**Files:**
- Modify: `docs/setup.md`
- Modify: `docs/deploy-dokploy.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: nothing (prose-only changes).
- Produces: docs that describe MySQL as the datastore, consistent with the code changes from Tasks 1-5.

- [ ] **Step 1: Update `docs/setup.md`**

Find and replace the local-setup instructions:

```
brew install postgresql@16 redis
brew services start postgresql@16
```

→

```
brew install mysql redis
brew services start mysql
```

```
createdb openreply
```

→

```
mysql -uroot -e "CREATE DATABASE openreply"
```

```
Then set `DATABASE_URL` to match your local user, for example `postgresql://YOUR_USER@localhost:5432/openreply`.
```

→

```
Then set `DATABASE_URL` to match your local user, for example `mysql://root@localhost:3306/openreply`.
```

Also update every other prose mention of "Postgres"/"PostgreSQL" in this file (the Railway hosting section: "Add PostgreSQL" → "Add MySQL", "Postgres, Redis: Railway" → "MySQL, Redis: Railway", the `DATABASE_URL` table row description, and the "Everything above is enough..." closing section if it names Postgres) to say MySQL instead, and change example connection strings from `postgresql://...` to `mysql://...`.

- [ ] **Step 2: Update `docs/deploy-dokploy.md`**

Change:

```
OpenReply needs four services running:
```

section's Postgres bullet/description to reference MySQL instead, and any `postgresql://` example connection string to `mysql://`.

- [ ] **Step 3: Update `README.md`**

Search for "Postgres" in `README.md` and update each occurrence's surrounding sentence to describe MySQL instead (the architecture description, the local dev setup section, and the `createdb openreply` / `DATABASE_URL` example near the bottom, matching the same replacements as Step 1).

- [ ] **Step 4: Verify no stale references remain**

```bash
grep -rni "postgres" docs/setup.md docs/deploy-dokploy.md README.md
```

Expected: no output, or only mentions that are intentionally historical/contextual (review each one manually — there should be none left describing the current setup).

- [ ] **Step 5: Commit**

```bash
git add docs/setup.md docs/deploy-dokploy.md README.md
git commit -m "docs: update self-host guides for MySQL"
```

---

### Task 7: End-to-end verification and Postgres decommission

**Files:** none (operational task)

**Interfaces:**
- Consumes: everything from Tasks 1-6.
- Produces: a running app fully on MySQL, confirmed working, with the Postgres container stopped (not deleted).

- [ ] **Step 1: Restart the server and worker**

```bash
# find and kill existing server/worker processes, then:
npm run dev > /tmp/or-server.log 2>&1 &
npm run worker > /tmp/or-worker.log 2>&1 &
```

Check both log files for a clean startup (`✓ Ready` for the server, `[DM Worker] Started` for the worker), no errors.

- [ ] **Step 2: Verify in the browser**

Open the app's dashboard. Confirm:
- The connected Instagram account still shows as "Connected" on the Settings page, with the same username as before migration.
- The Campaigns page shows both existing campaigns, with their keywords and public reply messages intact (this specifically exercises the `Json`-field conversion from Task 5).
- The DM Logs page shows the same 13 log entries as before migration.

- [ ] **Step 3: Run the full verification suite one more time**

```bash
npx tsc --noEmit
npx vitest run
```

Expected: both clean, same as after Task 3.

- [ ] **Step 4: Stop the old Postgres container**

```bash
docker stop openreply-postgres-1
```

Do not remove the container or its volume yet — keep it as a rollback point. (Revisit removing it a few days after this migration has been running stably, per the spec's rollback section — this is a manual follow-up, not part of this plan.)

- [ ] **Step 5: Commit**

There's nothing new to commit in this task (it's verification + an operational `docker stop`), so there's no commit step here. If Step 2's browser check surfaces any issue, fix it as a new task before considering this plan complete.
