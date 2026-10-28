/**
 * DM Queue Client
 *
 * Enqueues DM jobs on the Sidequest queue in MySQL. Keeps the shape of the
 * BullMQ queue it replaced — add(name, data, { jobId, delay }) — so call sites
 * read the same.
 */

import { DuplicatedJobError, Sidequest } from "sidequest";
import { prisma } from "@/lib/db/client";
import { DM_JOB_MAX_ATTEMPTS, DmJob } from "@/lib/jobs/dm-job";
import { DM_QUEUE, ensureSidequest } from "@/lib/jobs/sidequest";

// ─── DM Queue ───────────────────────────────────────────────────────────────────

export type CommentSource = "WEBHOOK" | "POLLING";

export interface ProcessCommentJob {
  instagramAccountId: string;
  commentId: string;
  commentText: string;
  commenterId: string;
  commenterName?: string;
  mediaId: string;
  // Set when the comment came from an ad: the organic post the ad was made
  // from. Campaigns are bound to that post, so both ids have to be matched.
  originalMediaId?: string;
  requeueAttempt?: number;
  // Which path enqueued this comment. Recorded in the shared ProcessedComment
  // dedup store so the reconciler can tell webhook- from polling-caught comments.
  source?: CommentSource;
}

// Delivered when a user taps an opening DM's button — carries the reveal target.
export interface ProcessPostbackJob {
  instagramAccountId: string;
  userId: string;
  payload: string;
  mid?: string;
  fallback?: boolean;
}

// Scheduled after the link is delivered, to send the appreciation follow-up.
// Enqueued with a delay (followUpDelayMinutes) so it can fire later, not just
// immediately.
export interface ProcessFollowUpJob {
  instagramAccountId: string;
  userId: string;
  automationId: string;
  commenterName?: string | null;
}

// An inbound DM from a user. Campaigns with `dmTriggerEnabled` whose keywords
// match the text reply to the sender.
export interface ProcessMessageJob {
  instagramAccountId: string;
  messageId: string;
  messageText: string;
  senderId: string;
}

export type DmQueueJob =
  | ProcessCommentJob
  | ProcessPostbackJob
  | ProcessFollowUpJob
  | ProcessMessageJob;

export const POSTBACK_JOB_NAME = "process-postback";
export const FOLLOWUP_JOB_NAME = "process-followup";
export const MESSAGE_JOB_NAME = "process-message";

export interface DmJobOptions {
  // Deterministic id for deduplication: while a job with the same name, data
  // and id is still waiting or running, adding it again is a no-op. Finished
  // jobs do not block a re-add, so a failed comment can be retried by a later
  // reconciler sweep. Failure detail is preserved in DmLog.
  jobId?: string;
  // Milliseconds before the job may run.
  delay?: number;
}

export interface DmQueueCounts {
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
}

export interface DmQueue {
  add(name: string, data: DmQueueJob, opts?: DmJobOptions): Promise<void>;
  getJobCounts(): Promise<DmQueueCounts>;
}

async function add(
  name: string,
  data: DmQueueJob,
  opts: DmJobOptions = {}
): Promise<void> {
  await ensureSidequest();

  const builder = Sidequest.build(DmJob)
    .queue(DM_QUEUE)
    .maxAttempts(DM_JOB_MAX_ATTEMPTS)
    // DmJob returns the exact retry delay from its own ladder; the default
    // exponential strategy would scale and jitter it again.
    .backoffStrategy("fixed")
    .availableAt(new Date(Date.now() + Math.max(0, opts.delay ?? 0)));
  if (opts.jobId) {
    builder.unique({ withArgs: true });
  }

  try {
    await builder.enqueue(name, data, opts.jobId ?? null);
  } catch (error) {
    // Same job still pending: the duplicate is dropped, as BullMQ did.
    if (isDuplicatedJobError(error)) return;
    throw error;
  }
}

// Matched by class name as well as instanceof: the MySQL driver can load its
// own copy of @sidequest/core (CJS next to ESM), whose error class is a
// different object from the one imported here.
function isDuplicatedJobError(error: unknown): boolean {
  return (
    error instanceof DuplicatedJobError ||
    (error instanceof Error && error.constructor.name === "DuplicatedJobError")
  );
}

async function getJobCounts(): Promise<DmQueueCounts> {
  await ensureSidequest();

  // "delayed" is a waiting job whose time has not come yet; Sidequest has no
  // separate state for it. claimed + running together are what BullMQ called
  // active.
  const rows = await prisma.$queryRaw<{ bucket: string; count: bigint }[]>`
    SELECT
      CASE
        WHEN state = 'waiting' AND available_at > UTC_TIMESTAMP(3) THEN 'delayed'
        WHEN state IN ('claimed', 'running') THEN 'active'
        ELSE state
      END AS bucket,
      COUNT(*) AS count
    FROM sidequest_jobs
    WHERE queue = ${DM_QUEUE}
      AND state IN ('waiting', 'claimed', 'running', 'failed')
    GROUP BY bucket
  `;

  const counts: DmQueueCounts = { waiting: 0, active: 0, delayed: 0, failed: 0 };
  for (const row of rows) {
    if (row.bucket in counts) {
      counts[row.bucket as keyof DmQueueCounts] = Number(row.count);
    }
  }
  return counts;
}

const dmQueue: DmQueue = { add, getJobCounts };

export function getDMQueue(): DmQueue {
  return dmQueue;
}
