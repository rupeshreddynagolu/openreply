/**
 * Applies pending Prisma migrations when the server starts.
 *
 * For hosts with no way to run `prisma migrate deploy`: shared cPanel accounts
 * usually block remote MySQL, and Prisma's CLI needs a native schema engine
 * for the server's platform, which a package built elsewhere does not have.
 * Opt in with MIGRATE_ON_START=true (the cPanel package sets it).
 *
 * It does what `migrate deploy` does, in Prisma's own bookkeeping, so the CLI
 * keeps working against the same database later: migrations are applied in
 * folder order, each recorded in `_prisma_migrations` with the SHA-256 of its
 * migration.sql, under the same advisory lock name Prisma takes. A migration
 * that failed part-way is left recorded as failed and stops every later
 * start, as it does for Prisma, because MySQL cannot roll back DDL.
 */

import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import mariadb from "mariadb";

// Prisma's advisory lock name for migrations on MySQL, so this and the CLI
// never apply migrations against the same database at once.
const MIGRATION_LOCK = "prisma_migrate";
const LOCK_TIMEOUT_SECONDS = 60;

export interface MigrationResult {
  applied: string[];
}

export interface MigrationConnection {
  query(sql: string, values?: unknown[]): Promise<unknown>;
  end(): Promise<void>;
}

interface AppliedRow {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
}

function connect(databaseUrl: string): Promise<MigrationConnection> {
  // DATABASE_URL is a mysql:// URL (Prisma's format); the driver only takes
  // mariadb:// strings, so pass the parts instead.
  const url = new URL(databaseUrl);
  return mariadb.createConnection({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    // A migration.sql holds many statements, sent as one script like Prisma.
    multipleStatements: true,
  });
}

function readMigrations(dir: string) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => {
      const sql = fs.readFileSync(path.join(dir, name, "migration.sql"), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      return { name, sql, checksum };
    });
}

export async function applyPendingMigrations(
  dir = path.join(process.cwd(), "prisma", "migrations"),
  openConnection: (databaseUrl: string) => Promise<MigrationConnection> = connect
): Promise<MigrationResult> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const migrations = readMigrations(dir);
  const conn = await openConnection(databaseUrl);
  const applied: string[] = [];

  try {
    const [lock] = (await conn.query("SELECT GET_LOCK(?, ?) AS acquired", [
      MIGRATION_LOCK,
      LOCK_TIMEOUT_SECONDS,
    ])) as { acquired: number | bigint | null }[];
    if (Number(lock?.acquired) !== 1) {
      throw new Error(
        `Timed out after ${LOCK_TIMEOUT_SECONDS}s waiting for the migration lock`
      );
    }

    // Same definition Prisma creates on MySQL.
    await conn.query(`
      CREATE TABLE IF NOT EXISTS _prisma_migrations (
        id VARCHAR(36) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        finished_at DATETIME(3) NULL,
        migration_name VARCHAR(255) NOT NULL,
        logs TEXT NULL,
        rolled_back_at DATETIME(3) NULL,
        started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        applied_steps_count INT UNSIGNED NOT NULL DEFAULT 0,
        PRIMARY KEY (id)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    const rows = (await conn.query(
      "SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations"
    )) as AppliedRow[];

    const failed = rows.find((row) => !row.finished_at && !row.rolled_back_at);
    if (failed) {
      throw new Error(
        `Migration ${failed.migration_name} failed earlier and was left half-applied. ` +
          "Fix the database by hand, then mark it with `prisma migrate resolve`."
      );
    }

    const done = new Set(
      rows.filter((row) => row.finished_at).map((row) => row.migration_name)
    );

    for (const migration of migrations) {
      if (done.has(migration.name)) continue;

      const id = randomUUID();
      await conn.query(
        "INSERT INTO _prisma_migrations (id, checksum, migration_name, started_at, applied_steps_count) VALUES (?, ?, ?, UTC_TIMESTAMP(3), 0)",
        [id, migration.checksum, migration.name]
      );

      try {
        await conn.query(migration.sql);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await conn.query("UPDATE _prisma_migrations SET logs = ? WHERE id = ?", [
          message,
          id,
        ]);
        throw new Error(`Migration ${migration.name} failed: ${message}`);
      }

      await conn.query(
        "UPDATE _prisma_migrations SET finished_at = UTC_TIMESTAMP(3), applied_steps_count = 1 WHERE id = ?",
        [id]
      );
      applied.push(migration.name);
    }

    return { applied };
  } finally {
    await conn.query("SELECT RELEASE_LOCK(?)", [MIGRATION_LOCK]).catch(() => {});
    await conn.end();
  }
}
