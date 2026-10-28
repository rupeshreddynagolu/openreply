/**
 * DmJob — the single Sidequest job class behind the DM queue.
 *
 * One class carries every DM job type, routed by name like the BullMQ queue
 * was (process-comment, process-postback, ...), so the processors in
 * lib/queue/dm-worker.ts are unchanged. Arguments are (name, data, key): the
 * key is the old deterministic job id, kept so duplicate enqueues collapse
 * through Sidequest's uniqueness digest and so jobs stay readable in the table.
 */

import { Job } from "sidequest";
import type { DmQueueJob } from "@/lib/queue/client";

// Retry delays after the 1st and 2nd failed attempt — the same 5/15/45
// minute ladder the BullMQ worker used. Sidequest's own backoff is only
// fixed or exponential, so the job picks the delay itself.
export const BACKOFF_DELAYS = [5 * 60 * 1000, 15 * 60 * 1000, 45 * 60 * 1000];

export const DM_JOB_MAX_ATTEMPTS = 3;

export class DmJob extends Job {
  async run(name: string, data: DmQueueJob, key?: string | null) {
    // Imported lazily: the queue client builds this class to enqueue, and the
    // worker module imports the queue client — a static import would cycle and
    // pull the whole worker into every route that only enqueues.
    const { processJob, recordWorkerFailure } = await import(
      "@/lib/queue/dm-worker"
    );
    const job = {
      id: key ?? `sq_${this.id}`,
      name,
      data,
      attemptsMade: this.attempt - 1,
    };

    try {
      await processJob(job);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[DM Worker] Job ${job.id} failed (attempt ${this.attempt}):`,
        err.message
      );
      await recordWorkerFailure(job, err);

      if (this.attempt >= this.max_attempts) {
        return this.fail(err);
      }
      const delay =
        BACKOFF_DELAYS[Math.min(this.attempt - 1, BACKOFF_DELAYS.length - 1)];
      return this.retry(err, delay);
    }

    console.log(`[DM Worker] Job ${job.id} completed`);
  }
}

// Sidequest's runner resolves job classes by importing sidequest.jobs.mjs from
// disk, which cannot reach code inside the Next bundle. Publishing the class
// here lets that file hand back this exact class (inline runner, same process).
(globalThis as Record<string, unknown>).__flowlySidequestJobs = { DmJob };
