/**
 * Sidequest configuration — the MySQL-backed job queue.
 *
 * Jobs live in the app's own MySQL database (sidequest_* tables, migrated by
 * Sidequest itself on first configure), so no Redis is needed. Both the
 * enqueue side (webhook, reconciler) and the job runtime go through
 * ensureSidequest(), and both must pass the same config: whichever runs first
 * in a process wins.
 */

import path from "node:path";
import { Sidequest, type SidequestConfig } from "sidequest";
// Sidequest loads the driver below by name at runtime, which the standalone
// build's file tracing cannot follow. Importing it here gets the driver and its
// dependencies (knex, mysql2) into the cPanel package.
import "@sidequest/mysql-backend";

export const DM_QUEUE = "dm-processing";

export function sidequestConfig(): SidequestConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  return {
    backend: {
      driver: "@sidequest/mysql-backend",
      // Store job timestamps in UTC. mysql2 defaults to the Node process's
      // local zone, which differs from the database's on many hosts and would
      // skew every "available_at <= now" comparison made in SQL.
      config: { connection: { uri: databaseUrl, timezone: "Z" } },
    },
    queues: [{ name: DM_QUEUE, concurrency: 5 }],
    maxConcurrentJobs: 5,
    // Run jobs on the host process: no forked engine and no worker threads.
    // Shared hosts cap processes, and a thread would have to load the job code
    // from disk, which in a Next build only exists inside the bundle.
    fork: false,
    runner: "inline",
    // The runner always imports job classes from a file; this one hands back
    // the classes the app registered in memory (see sidequest.jobs.mjs).
    manualJobResolution: true,
    jobsFilePath: path.join(process.cwd(), "sidequest.jobs.mjs"),
    // Once a second is plenty for DM latency and keeps a shared MySQL quiet;
    // the 100ms default is 10 queries a second around the clock.
    jobPollingInterval: 1000,
    dashboard: { enabled: false },
  };
}

const globalForSidequest = globalThis as unknown as {
  sidequestConfigured?: Promise<unknown>;
};

export function ensureSidequest(): Promise<unknown> {
  if (!globalForSidequest.sidequestConfigured) {
    globalForSidequest.sidequestConfigured = Sidequest.configure(
      sidequestConfig()
    ).catch((error) => {
      // Let the next caller retry instead of caching a failed connection.
      globalForSidequest.sidequestConfigured = undefined;
      throw error;
    });
  }
  return globalForSidequest.sidequestConfigured;
}
