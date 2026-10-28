// Standalone job runtime, for hosts that run the worker as its own process
// (Dokploy, a VPS with pm2). The web app starts the same runtime in-process by
// default; set RUN_JOBS=false on the web app when running this, so the
// reconciler and heartbeat run once.
import { startJobRuntime } from "@/lib/jobs/runtime";

startJobRuntime().catch((error) => {
  console.error("[DM Worker] Failed to start:", error);
  process.exit(1);
});
