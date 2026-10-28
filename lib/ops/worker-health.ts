import { prisma } from "@/lib/db/client";

const WORKER_ID = "dm";
const WORKER_ALERTS_KEEP = 25;
const WORKER_HEARTBEAT_TTL_SECONDS = 120;

export interface WorkerHeartbeat {
  status: "running";
  worker: "dm";
  pid: number;
  hostname?: string;
  startedAt?: string;
  checkedAt: string;
}

export interface WorkerHealth {
  healthy: boolean;
  heartbeat: WorkerHeartbeat | null;
  ageMs: number | null;
}

export interface WorkerAlert {
  level: "warning" | "error";
  message: string;
  jobId?: string;
  instagramAccountId?: string;
  commentId?: string;
  createdAt: string;
}

export async function recordWorkerHeartbeat(
  heartbeat: Omit<WorkerHeartbeat, "checkedAt" | "status" | "worker">
) {
  const checkedAt = new Date();
  const payload: WorkerHeartbeat = {
    ...heartbeat,
    status: "running",
    worker: "dm",
    checkedAt: checkedAt.toISOString(),
  };

  await prisma.workerHeartbeat.upsert({
    where: { id: WORKER_ID },
    create: { id: WORKER_ID, payload: { ...payload }, checkedAt },
    update: { payload: { ...payload }, checkedAt },
  });
}

export async function getWorkerHealth(): Promise<WorkerHealth> {
  const row = await prisma.workerHeartbeat.findUnique({
    where: { id: WORKER_ID },
  });

  if (!row) {
    return { healthy: false, heartbeat: null, ageMs: null };
  }

  // The row is never deleted, so a stopped worker leaves a stale heartbeat
  // behind; age decides health, as the Redis key's TTL used to.
  const heartbeat = row.payload as unknown as WorkerHeartbeat;
  const ageMs = Date.now() - row.checkedAt.getTime();
  return {
    healthy: ageMs <= WORKER_HEARTBEAT_TTL_SECONDS * 1000,
    heartbeat,
    ageMs,
  };
}

export async function recordWorkerAlert(alert: Omit<WorkerAlert, "createdAt">) {
  const createdAt = new Date();
  const payload: WorkerAlert = {
    ...alert,
    createdAt: createdAt.toISOString(),
  };

  await prisma.workerAlert.create({
    data: { payload: { ...payload }, createdAt },
  });

  // Keep only the newest alerts, like the capped Redis list did.
  const stale = await prisma.workerAlert.findMany({
    orderBy: { createdAt: "desc" },
    skip: WORKER_ALERTS_KEEP,
    select: { id: true },
  });
  if (stale.length > 0) {
    await prisma.workerAlert.deleteMany({
      where: { id: { in: stale.map((row) => row.id) } },
    });
  }
}

export async function getWorkerAlerts(limit = 10): Promise<WorkerAlert[]> {
  const rows = await prisma.workerAlert.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.max(1, limit),
  });

  return rows.map((row) => row.payload as unknown as WorkerAlert);
}
