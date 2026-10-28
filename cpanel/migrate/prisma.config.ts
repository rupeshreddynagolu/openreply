// Prisma config for running the migrations on the server (cPanel Terminal).
// Copied into the cPanel package by scripts/package-cpanel.mjs, next to
// schema.prisma and migrations/.
//
// DATABASE_URL comes from the environment, or else from the app's .env one
// folder up, so a .env made for the app works here too.
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "prisma/config";

const appEnv = path.join(import.meta.dirname, "..", ".env");
if (!process.env.DATABASE_URL && fs.existsSync(appEnv)) {
  process.loadEnvFile(appEnv);
}

export default defineConfig({
  schema: "schema.prisma",
  migrations: {
    path: "migrations",
  },
  // The job queue's own tables (created by the app at startup). Without this,
  // a database where the app has already run counts as "not empty" and
  // migrate deploy refuses it (P3005).
  experimental: {
    externalTables: true,
  },
  tables: {
    external: [
      "sidequest_jobs",
      "sidequest_queues",
      "sidequest_migrations",
      "sidequest_migrations_lock",
    ],
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
