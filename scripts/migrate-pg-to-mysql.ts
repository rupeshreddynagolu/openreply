/**
 * One-off script: copies every row from the (still-running) Postgres
 * database into the new MySQL database, in FK-dependency order, converting
 * Automation.keywords / Automation.publicReplyMessages from Postgres text[]
 * to plain JS arrays (which Prisma's Json field accepts directly) along the
 * way. Safe to run against an empty MySQL database only — it does not
 * upsert or dedupe.
 *
 * Usage: PG_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/openreply" \
 *        npx tsx --env-file=.env scripts/migrate-pg-to-mysql.ts
 *
 * .env must already point DATABASE_URL at the target MySQL database — that
 * is what `prisma` (imported below) connects to.
 */

import { Client as PgClient } from "pg";
import { prisma } from "../lib/db/client";

const PG_DATABASE_URL = process.env.PG_DATABASE_URL;
if (!PG_DATABASE_URL) {
  throw new Error("PG_DATABASE_URL environment variable is required");
}

async function main() {
  const pg = new PgClient({ connectionString: PG_DATABASE_URL });
  await pg.connect();

  async function copyTable<T>(
    label: string,
    pgTable: string,
    insertMany: (rows: T[]) => Promise<unknown>
  ) {
    const { rows } = await pg.query<T>(`SELECT * FROM "${pgTable}"`);
    if (rows.length > 0) {
      await insertMany(rows);
    }
    console.log(`${label}: copied ${rows.length} rows`);
  }

  await copyTable("User", "User", (rows) =>
    prisma.user.createMany({ data: rows as never })
  );
  await copyTable("Account", "Account", (rows) =>
    prisma.account.createMany({ data: rows as never })
  );
  await copyTable("Session", "Session", (rows) =>
    prisma.session.createMany({ data: rows as never })
  );
  await copyTable("VerificationToken", "VerificationToken", (rows) =>
    prisma.verificationToken.createMany({ data: rows as never })
  );
  await copyTable("Workspace", "Workspace", (rows) =>
    prisma.workspace.createMany({ data: rows as never })
  );
  await copyTable("WorkspaceMember", "WorkspaceMember", (rows) =>
    prisma.workspaceMember.createMany({ data: rows as never })
  );
  await copyTable("WorkspaceInvitation", "WorkspaceInvitation", (rows) =>
    prisma.workspaceInvitation.createMany({ data: rows as never })
  );
  await copyTable("InstagramAccount", "InstagramAccount", (rows) =>
    prisma.instagramAccount.createMany({ data: rows as never })
  );
  await copyTable("FollowerSnapshot", "FollowerSnapshot", (rows) =>
    prisma.followerSnapshot.createMany({ data: rows as never })
  );
  await copyTable(
    "Automation",
    "Automation",
    (rows: Array<Record<string, unknown>>) =>
      prisma.automation.createMany({
        data: rows.map((r) => ({
          ...r,
          keywords: Array.isArray(r.keywords) ? r.keywords : [],
          publicReplyMessages: Array.isArray(r.publicReplyMessages)
            ? r.publicReplyMessages
            : [],
        })) as never,
      })
  );
  await copyTable("DmLog", "DmLog", (rows) =>
    prisma.dmLog.createMany({ data: rows as never })
  );
  await copyTable("ProcessedComment", "ProcessedComment", (rows) =>
    prisma.processedComment.createMany({ data: rows as never })
  );
  await copyTable("TrackedLink", "TrackedLink", (rows) =>
    prisma.trackedLink.createMany({ data: rows as never })
  );
  await copyTable("LinkClick", "LinkClick", (rows) =>
    prisma.linkClick.createMany({ data: rows as never })
  );
  await copyTable("WebhookEvent", "WebhookEvent", (rows) =>
    prisma.webhookEvent.createMany({ data: rows as never })
  );
  await copyTable("OperationalEvent", "OperationalEvent", (rows) =>
    prisma.operationalEvent.createMany({ data: rows as never })
  );

  await pg.end();
  await prisma.$disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
