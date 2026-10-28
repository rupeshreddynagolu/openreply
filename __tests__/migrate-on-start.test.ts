/**
 * Startup migration runner — Unit Tests
 *
 * Drives applyPendingMigrations against a fake connection that keeps
 * `_prisma_migrations` rows in memory, with real migration folders on disk.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  applyPendingMigrations,
  type MigrationConnection,
} from "../lib/db/migrate-on-start";

interface Row {
  id: string;
  checksum: string;
  migration_name: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
  logs: string | null;
}

let dir: string;

function writeMigration(name: string, sql: string) {
  fs.mkdirSync(path.join(dir, name));
  fs.writeFileSync(path.join(dir, name, "migration.sql"), sql);
}

// In-memory stand-in for MySQL: understands the runner's bookkeeping queries
// and records every other statement as an executed migration script.
function fakeConnection(rows: Row[], failOn?: string) {
  const executed: string[] = [];
  const conn: MigrationConnection = {
    query: vi.fn(async (sql: string, values: unknown[] = []) => {
      if (sql.startsWith("SELECT GET_LOCK")) return [{ acquired: 1 }];
      if (sql.startsWith("SELECT RELEASE_LOCK")) return [];
      if (sql.includes("CREATE TABLE IF NOT EXISTS _prisma_migrations")) return [];
      if (sql.startsWith("SELECT migration_name")) return rows;
      if (sql.startsWith("INSERT INTO _prisma_migrations")) {
        const [id, checksum, migration_name] = values as string[];
        rows.push({ id, checksum, migration_name, finished_at: null, rolled_back_at: null, logs: null });
        return [];
      }
      if (sql.startsWith("UPDATE _prisma_migrations SET finished_at")) {
        rows.find((r) => r.id === values[0])!.finished_at = new Date();
        return [];
      }
      if (sql.startsWith("UPDATE _prisma_migrations SET logs")) {
        rows.find((r) => r.id === values[1])!.logs = values[0] as string;
        return [];
      }
      if (failOn && sql.includes(failOn)) throw new Error("syntax error near BROKEN");
      executed.push(sql);
      return [];
    }),
    end: vi.fn(async () => {}),
  };
  return { conn, executed };
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "migrations-"));
  fs.writeFileSync(path.join(dir, "migration_lock.toml"), 'provider = "mysql"\n');
  vi.stubEnv("DATABASE_URL", "mysql://user:pass@localhost:3306/app");
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe("applyPendingMigrations", () => {
  it("applies every migration in folder order on an empty database", async () => {
    writeMigration("20260102_second", "CREATE TABLE b (id INT);");
    writeMigration("20260101_first", "CREATE TABLE a (id INT);");
    const rows: Row[] = [];
    const { conn, executed } = fakeConnection(rows);

    const result = await applyPendingMigrations(dir, async () => conn);

    expect(result.applied).toEqual(["20260101_first", "20260102_second"]);
    expect(executed).toEqual(["CREATE TABLE a (id INT);", "CREATE TABLE b (id INT);"]);
    // Recorded the way Prisma does: SHA-256 of migration.sql, finished.
    expect(rows[0].checksum).toBe(
      createHash("sha256").update("CREATE TABLE a (id INT);").digest("hex")
    );
    expect(rows.every((r) => r.finished_at)).toBe(true);
    expect(conn.end).toHaveBeenCalled();
  });

  it("skips migrations that are already applied", async () => {
    writeMigration("20260101_first", "CREATE TABLE a (id INT);");
    writeMigration("20260102_second", "CREATE TABLE b (id INT);");
    const rows: Row[] = [
      { id: "1", checksum: "x", migration_name: "20260101_first", finished_at: new Date(), rolled_back_at: null, logs: null },
    ];
    const { conn, executed } = fakeConnection(rows);

    const result = await applyPendingMigrations(dir, async () => conn);

    expect(result.applied).toEqual(["20260102_second"]);
    expect(executed).toEqual(["CREATE TABLE b (id INT);"]);
  });

  it("refuses to continue past a migration that failed earlier", async () => {
    writeMigration("20260101_first", "CREATE TABLE a (id INT);");
    const rows: Row[] = [
      { id: "1", checksum: "x", migration_name: "20260101_first", finished_at: null, rolled_back_at: null, logs: "boom" },
    ];
    const { conn, executed } = fakeConnection(rows);

    await expect(applyPendingMigrations(dir, async () => conn)).rejects.toThrow(
      /20260101_first failed earlier/
    );
    expect(executed).toEqual([]);
    expect(conn.end).toHaveBeenCalled();
  });

  it("records a failing migration as failed and stops", async () => {
    writeMigration("20260101_first", "CREATE TABLE a (id INT);");
    writeMigration("20260102_broken", "BROKEN SQL;");
    writeMigration("20260103_third", "CREATE TABLE c (id INT);");
    const rows: Row[] = [];
    const { conn, executed } = fakeConnection(rows, "BROKEN");

    await expect(applyPendingMigrations(dir, async () => conn)).rejects.toThrow(
      /20260102_broken failed: syntax error/
    );
    expect(executed).toEqual(["CREATE TABLE a (id INT);"]);
    const broken = rows.find((r) => r.migration_name === "20260102_broken")!;
    expect(broken.finished_at).toBeNull();
    expect(broken.logs).toContain("syntax error");
  });
});
