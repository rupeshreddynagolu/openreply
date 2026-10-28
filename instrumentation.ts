// Runs once when the Next server starts, before it serves requests.
//
// 1. With MIGRATE_ON_START=true (set by the cPanel package), applies pending
//    database migrations, for hosts where `prisma migrate deploy` cannot run.
// 2. Starts the job runtime (DM queue, heartbeat, comment reconciler) inside
//    the web process, so a single Node app is the whole deployment. Set
//    RUN_JOBS=false where the runtime runs as its own process
//    (`npm run worker`) or the host is serverless, like Vercel.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  if (process.env.MIGRATE_ON_START === "true") {
    const { applyPendingMigrations } = await import("@/lib/db/migrate-on-start");
    try {
      const { applied } = await applyPendingMigrations();
      console.log(
        applied.length > 0
          ? `[Migrate] Applied ${applied.length} migration(s): ${applied.join(", ")}`
          : "[Migrate] Database is up to date"
      );
    } catch (error) {
      // Without its tables the app cannot work, but keep serving so
      // /api/health and the log say why instead of a blank Passenger error.
      console.error("[Migrate] Failed, job runtime not started:", error);
      return;
    }
  }

  if (process.env.RUN_JOBS === "false") return;

  const { startJobRuntime } = await import("@/lib/jobs/runtime");
  try {
    await startJobRuntime();
  } catch (error) {
    // Keep serving pages and webhooks: enqueued jobs wait in MySQL, and
    // /api/health reports the missing heartbeat.
    console.error("[DM Worker] Failed to start job runtime:", error);
  }
}
