// Runs once when the Next server starts. Starts the job runtime (DM queue,
// heartbeat, comment reconciler) inside the web process, so a single Node app
// is the whole deployment. Set RUN_JOBS=false where the runtime runs as its own
// process (`npm run worker`) or the host is serverless, like Vercel.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
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
