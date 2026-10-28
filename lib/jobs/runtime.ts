/**
 * Job runtime — everything that has to keep running in the background.
 *
 * Starts Sidequest's in-process engine (it claims DM jobs from MySQL and runs
 * them), the heartbeat that /api/health reads, and the polling reconciler for
 * comments the webhook missed. Runs inside the Next server by default (see
 * instrumentation.ts), or standalone via `npm run worker`.
 */

import os from "node:os";
import { Sidequest } from "sidequest";
import { recordWorkerHeartbeat } from "@/lib/ops/worker-health";
import { reconcileComments } from "@/lib/polling/comment-reconciler";
// Registers DmJob for sidequest.jobs.mjs before the engine can run a job.
import "@/lib/jobs/dm-job";
import { ensureSidequest, sidequestConfig } from "@/lib/jobs/sidequest";

const HEARTBEAT_INTERVAL_MS = 30_000;
// Polling safety net for comments that webhooks miss. Every few minutes, so it
// cannot ride on a once-a-day cron.
const POLL_INTERVAL_MS = Number(
  process.env.COMMENT_POLL_INTERVAL_MS ?? 5 * 60_000
);

const globalForRuntime = globalThis as unknown as {
  jobRuntimeStarted?: boolean;
};

export async function startJobRuntime(): Promise<void> {
  // Once per process: dev reloads and a second caller must not start a second
  // engine or double the timers.
  if (globalForRuntime.jobRuntimeStarted) return;
  globalForRuntime.jobRuntimeStarted = true;

  const startedAt = new Date().toISOString();

  // Configure first through the shared helper, so an enqueue racing this
  // startup sees the same config. start() then reuses it.
  try {
    await ensureSidequest();
    await Sidequest.start(sidequestConfig());
  } catch (error) {
    globalForRuntime.jobRuntimeStarted = false;
    throw error;
  }
  console.log("[DM Worker] Started");

  async function heartbeat() {
    try {
      await recordWorkerHeartbeat({
        pid: process.pid,
        hostname: os.hostname(),
        startedAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[DM Worker] Heartbeat failed:", message);
    }
  }

  async function poll() {
    try {
      await reconcileComments();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[DM Worker] Comment reconciliation failed:", message);
    }
  }

  void heartbeat();
  const heartbeatTimer = setInterval(() => void heartbeat(), HEARTBEAT_INTERVAL_MS);

  // Kick off one sweep shortly after boot, then on a fixed interval.
  const firstPoll = setTimeout(() => void poll(), 10_000);
  const pollTimer = setInterval(() => void poll(), POLL_INTERVAL_MS);

  // Sidequest handles the signal itself: it waits for running jobs, then
  // exits. Stopping the timers keeps new work from starting meanwhile.
  const stopTimers = () => {
    clearInterval(heartbeatTimer);
    clearTimeout(firstPoll);
    clearInterval(pollTimer);
  };
  process.once("SIGINT", stopTimers);
  process.once("SIGTERM", stopTimers);
}
