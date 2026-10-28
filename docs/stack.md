# Stack

Everything Flowly needs to run, in one place: the application libraries, the
runtime processes, and the specific (free) services this instance is deployed on.
For the step-by-step setup, see [setup.md](setup.md).

## Application

| Layer | Tool |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| Language | TypeScript 5 |
| ORM / DB | Prisma 7 with the `@prisma/adapter-mariadb` driver, MySQL |
| Queue | Sidequest 1 on MySQL (`@sidequest/mysql-backend`) |
| Auth | Auth.js / NextAuth 5 (email magic links) |
| Email | Resend (login links) |
| Validation | Zod 4 |
| Charts | Recharts 3 |
| Styling | Tailwind CSS 4 |
| Tests | Vitest 4 |
| Job runtime | In the Next server via `instrumentation.ts`; standalone via `tsx` (`worker/dm-worker.ts`) |
| Instagram | Official Meta Graph API (Instagram Login) |

## Runtime — one process, one datastore

- **Web app + API + jobs** (`npm run dev` / `npm start`): Next.js. Serves the
  dashboard, the OAuth callback, and the incoming webhook, and — through
  `instrumentation.ts` — runs the job runtime: the Sidequest engine that sends
  the DMs, the polling reconciler, the follow-gate `is_user_follow_business`
  checks, and the worker heartbeat.
- **MySQL**: campaigns, DM logs, accounts, sessions, tracked links, click
  events, the job queue (`sidequest_*` tables, migrated by Sidequest itself),
  and the per-account rate limiter. No Redis.

The job runtime has to stay up, so on a serverless host (Vercel) set
`RUN_JOBS=false` on the web app and run `npm run worker` on an always-on host.
Both then need the same `DATABASE_URL` and `ENCRYPTION_KEY`: the web app stores
the encrypted Instagram token, the worker decrypts it to send. Different keys
mean every send fails to decrypt.

## Reference free deployment

The zero-cost stack this instance runs on. Alternatives (e.g. Railway for the
worker + MySQL) are covered in [setup.md](setup.md).

| Piece | Service | Free tier |
| --- | --- | --- |
| Web app | Vercel (Hobby), with `RUN_JOBS=false` | Free |
| MySQL | Any MySQL 8 reachable from both | — |
| Worker (24/7) | Oracle Cloud "Always Free" VM (VM.Standard.E2.1.Micro, Ubuntu 22.04, kept alive with `pm2`) | Free forever |
| Login email | Resend | Free (3k emails/mo) |
| Instagram API | Meta app with Instagram Login | Free |

## Environment variables

Names only — values live in `.env` (gitignored) or the host's env settings, never
in the repo. Full descriptions are in [setup.md](setup.md#environment-variables).

`NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `ENCRYPTION_KEY`, `DATABASE_URL`,
`RUN_JOBS` (optional), `RESEND_API_KEY`, `EMAIL_FROM`, `META_GRAPH_API_VERSION`,
`INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `FACEBOOK_APP_SECRET`,
`WEBHOOK_VERIFY_TOKEN`.
