/**
 * Rate Limiter
 *
 * MySQL-backed rate limiter for Instagram private replies.
 *
 * The cap matches Meta's documented limit for this exact call: 750 private
 * replies per hour per Instagram professional account, for comments on posts
 * and reels. Exceeding it risks 429s and app-level restrictions, so the worker
 * requeues rather than pushing through.
 * https://developers.facebook.com/docs/graph-api/overview/rate-limiting/
 *
 * Note this is a hard ceiling with no headroom. If Meta throttles before the
 * documented limit, or other calls on the same account share the bucket, lower
 * this value.
 */

import { prisma } from "@/lib/db/client";

const RATE_LIMIT_MAX = 750; // private replies per hour, per Meta's documented cap
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
const REQUEUE_DELAY_MS = 30 * 60 * 1000; // 30 minutes
const MAX_REQUEUE_ATTEMPTS = 3;

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  remainingDMs: number;
  shouldRequeue: boolean;
  requeueDelayMs: number;
  shouldSkip: boolean;
  reserved: boolean;
}

function rateLimitKey(instagramAccountId: string): string {
  return `rate:dm:${instagramAccountId}`;
}

// A row past its window counts as zero; it is reset on the next reservation
// instead of being deleted, so the key never has to be re-created under load.
function liveCount(
  row: { count: number; expiresAt: Date } | null,
  now: number
): number {
  if (!row || row.expiresAt.getTime() <= now) return 0;
  return Number(row.count);
}

function blockedResult(
  count: number,
  requeueAttempt: number
): RateLimitResult {
  if (requeueAttempt >= MAX_REQUEUE_ATTEMPTS) {
    return {
      allowed: false,
      currentCount: count,
      remainingDMs: 0,
      shouldRequeue: false,
      requeueDelayMs: 0,
      shouldSkip: true,
      reserved: false,
    };
  }

  return {
    allowed: false,
    currentCount: count,
    remainingDMs: 0,
    shouldRequeue: true,
    requeueDelayMs: REQUEUE_DELAY_MS,
    shouldSkip: false,
    reserved: false,
  };
}

/**
 * Check if an Instagram account is within its DM rate limit.
 *
 * Uses a fixed one-hour window per account.
 * Key pattern: `rate:dm:{instagramAccountId}`
 *
 * @param instagramAccountId - The Instagram account ID to check
 * @param requeueAttempt - How many times this job has been requeued (0 = first attempt)
 * @returns Rate limit result with action recommendations
 */
export async function checkRateLimit(
  instagramAccountId: string,
  requeueAttempt: number = 0
): Promise<RateLimitResult> {
  const row = await prisma.rateLimitCounter.findUnique({
    where: { key: rateLimitKey(instagramAccountId) },
  });
  const count = liveCount(row, Date.now());

  if (count >= RATE_LIMIT_MAX) {
    return blockedResult(count, requeueAttempt);
  }

  return {
    allowed: true,
    currentCount: count,
    remainingDMs: RATE_LIMIT_MAX - count,
    shouldRequeue: false,
    requeueDelayMs: 0,
    shouldSkip: false,
    reserved: false,
  };
}

/**
 * Atomically reserve a DM send slot for an Instagram account.
 * This is the worker-safe path: the row is locked (SELECT ... FOR UPDATE) for
 * the check-and-increment, so concurrent jobs cannot all pass the check before
 * any of them increments the counter.
 */
export async function reserveDMSlot(
  instagramAccountId: string,
  requeueAttempt: number = 0
): Promise<RateLimitResult> {
  const key = rateLimitKey(instagramAccountId);

  // Make sure there is a row to lock. An expired placeholder reads as zero.
  // This runs on its own, outside the transaction: INSERT IGNORE takes a
  // shared lock on an existing row, and upgrading that to FOR UPDATE inside
  // one transaction deadlocks concurrent reservations against each other.
  await prisma.$executeRaw`
    INSERT IGNORE INTO RateLimitCounter (\`key\`, \`count\`, \`expiresAt\`)
    VALUES (${key}, 0, ${new Date(0)})
  `;

  const { allowed, count } = await prisma.$transaction(async (tx) => {
    const [row] = await tx.$queryRaw<{ count: number; expiresAt: Date }[]>`
      SELECT \`count\`, \`expiresAt\` FROM RateLimitCounter
      WHERE \`key\` = ${key} FOR UPDATE
    `;

    const now = Date.now();
    const current = liveCount(row ?? null, now);
    if (current >= RATE_LIMIT_MAX) {
      return { allowed: false, count: current };
    }

    // The first send after the window lapsed opens a new hour; later sends in
    // the same hour keep its original expiry, as the Redis TTL did.
    const windowOpen = row && row.expiresAt.getTime() > now;
    await tx.rateLimitCounter.update({
      where: { key },
      data: {
        count: current + 1,
        expiresAt: windowOpen
          ? row.expiresAt
          : new Date(now + RATE_LIMIT_WINDOW * 1000),
      },
    });
    return { allowed: true, count: current + 1 };
  });

  if (!allowed) {
    return blockedResult(count, requeueAttempt);
  }

  return {
    allowed: true,
    currentCount: count,
    remainingDMs: RATE_LIMIT_MAX - count,
    shouldRequeue: false,
    requeueDelayMs: 0,
    shouldSkip: false,
    reserved: true,
  };
}

/**
 * Backwards-compatible helper for tests and admin scripts.
 * Prefer reserveDMSlot in workers.
 */
export async function incrementDMCounter(
  instagramAccountId: string
): Promise<number> {
  const result = await reserveDMSlot(instagramAccountId, MAX_REQUEUE_ATTEMPTS);
  return result.currentCount;
}

/**
 * Get the current DM count for an Instagram account.
 */
export async function getCurrentDMCount(
  instagramAccountId: string
): Promise<number> {
  const row = await prisma.rateLimitCounter.findUnique({
    where: { key: rateLimitKey(instagramAccountId) },
  });
  return liveCount(row, Date.now());
}

/**
 * Reset the rate limiter for an account (useful for testing).
 */
export async function resetRateLimit(
  instagramAccountId: string
): Promise<void> {
  await prisma.rateLimitCounter.deleteMany({
    where: { key: rateLimitKey(instagramAccountId) },
  });
}

// Export constants for use in tests
export { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW, REQUEUE_DELAY_MS, MAX_REQUEUE_ATTEMPTS };
