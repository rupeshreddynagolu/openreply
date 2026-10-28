/**
 * Rate Limiter — Unit Tests
 *
 * Tests the hourly private-reply cap enforcement using a mocked Prisma client.
 * Assertions derive from RATE_LIMIT_MAX so they survive a change to the cap.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindUnique, mockTx, mockPrisma } = vi.hoisted(() => {
  const mockTx = {
    $queryRaw: vi.fn(),
    rateLimitCounter: { update: vi.fn() },
  };
  const mockFindUnique = vi.fn();
  return {
    mockFindUnique,
    mockTx,
    mockPrisma: {
      rateLimitCounter: { findUnique: mockFindUnique, deleteMany: vi.fn() },
      $executeRaw: vi.fn(),
      $transaction: vi.fn(
        async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)
      ),
    },
  };
});

vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }));

import {
  checkRateLimit,
  incrementDMCounter,
  reserveDMSlot,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW,
} from "../lib/utils/rate-limiter";

const inAnHour = () => new Date(Date.now() + 60 * 60 * 1000);
const anHourAgo = () => new Date(Date.now() - 60 * 60 * 1000);

// The row the locked SELECT returns inside the reservation transaction.
function lockedRow(count: number, expiresAt: Date) {
  mockTx.$queryRaw.mockResolvedValue([{ count, expiresAt }]);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkRateLimit", () => {
  it("should allow when count is below limit", async () => {
    mockFindUnique.mockResolvedValue({ count: 50, expiresAt: inAnHour() });

    const result = await checkRateLimit("account_123");

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { key: "rate:dm:account_123" },
    });
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(50);
    expect(result.remainingDMs).toBe(RATE_LIMIT_MAX - 50);
    expect(result.shouldRequeue).toBe(false);
    expect(result.shouldSkip).toBe(false);
    expect(result.reserved).toBe(false);
  });

  it("should allow when no previous count exists", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await checkRateLimit("account_123");

    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(0);
    expect(result.remainingDMs).toBe(RATE_LIMIT_MAX);
  });

  it("should treat an expired window as empty", async () => {
    mockFindUnique.mockResolvedValue({
      count: RATE_LIMIT_MAX,
      expiresAt: anHourAgo(),
    });

    const result = await checkRateLimit("account_123");

    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(0);
  });

  it("should deny when count reaches the limit", async () => {
    mockFindUnique.mockResolvedValue({
      count: RATE_LIMIT_MAX,
      expiresAt: inAnHour(),
    });

    const result = await checkRateLimit("account_123");

    expect(result.allowed).toBe(false);
    expect(result.shouldRequeue).toBe(true);
    expect(result.shouldSkip).toBe(false);
  });

  it("should skip after max requeue attempts", async () => {
    mockFindUnique.mockResolvedValue({
      count: RATE_LIMIT_MAX,
      expiresAt: inAnHour(),
    });

    const result = await checkRateLimit("account_123", 3);

    expect(result.allowed).toBe(false);
    expect(result.shouldRequeue).toBe(false);
    expect(result.shouldSkip).toBe(true);
  });
});

describe("reserveDMSlot", () => {
  it("should reserve a slot inside the current window when below the cap", async () => {
    const expiresAt = inAnHour();
    lockedRow(50, expiresAt);

    const result = await reserveDMSlot("account_123");

    expect(mockTx.rateLimitCounter.update).toHaveBeenCalledWith({
      where: { key: "rate:dm:account_123" },
      data: { count: 51, expiresAt },
    });
    expect(result.allowed).toBe(true);
    expect(result.reserved).toBe(true);
    expect(result.currentCount).toBe(51);
    expect(result.remainingDMs).toBe(RATE_LIMIT_MAX - 51);
  });

  it("should open a fresh one-hour window when the previous one expired", async () => {
    lockedRow(RATE_LIMIT_MAX, anHourAgo());
    const before = Date.now();

    const result = await reserveDMSlot("account_123");

    const { data } = mockTx.rateLimitCounter.update.mock.calls[0][0];
    expect(data.count).toBe(1);
    expect(data.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + RATE_LIMIT_WINDOW * 1000
    );
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(1);
  });

  it("should recommend requeue when the cap is reached", async () => {
    lockedRow(RATE_LIMIT_MAX, inAnHour());

    const result = await reserveDMSlot("account_123", 0);

    expect(mockTx.rateLimitCounter.update).not.toHaveBeenCalled();
    expect(result.allowed).toBe(false);
    expect(result.reserved).toBe(false);
    expect(result.shouldRequeue).toBe(true);
    expect(result.shouldSkip).toBe(false);
  });

  it("should skip after max requeue attempts", async () => {
    lockedRow(RATE_LIMIT_MAX, inAnHour());

    const result = await reserveDMSlot("account_123", 3);

    expect(result.allowed).toBe(false);
    expect(result.shouldRequeue).toBe(false);
    expect(result.shouldSkip).toBe(true);
  });
});

describe("incrementDMCounter", () => {
  it("should use the atomic reservation path", async () => {
    lockedRow(50, inAnHour());

    const count = await incrementDMCounter("account_123");

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(count).toBe(51);
  });
});
