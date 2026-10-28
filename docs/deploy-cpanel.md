# Deploying on cPanel

This guide runs Flowly on a cPanel host with **Setup Node.js App** (CloudLinux's
Node.js Selector, served by Phusion Passenger). One Node app and one MySQL
database are the whole deployment: the job runtime that sends the DMs starts
inside the web app, and the queue lives in MySQL, so there is no Redis and no
second process to keep alive.

You build a self-contained zip on your own machine and upload it. Nothing is
built or installed on the server, which shared hosts rarely have the memory for.

## What you need

- cPanel with **Setup Node.js App**, offering **Node 20.19+, 22.12+ or 24+**.
  Prisma 7 and Next.js 16 refuse anything older. If the list stops at 18 or an
  early 20.x, ask your host for a newer Node; there is no workaround.
- **MySQL Databases** in cPanel, on MySQL 8. MariaDB is untested with the job
  queue's tables; if your host only offers MariaDB, check `/api/health` and a
  test DM carefully after setup.
- **Cron Jobs** in cPanel.
- A way to run migrations from your machine against the cPanel database:
  **Remote MySQL** in cPanel, or **SSH** access (step 2).
- Node and this repo on your own machine, to build the package.

## 1. Create the database

In cPanel, open **MySQL Databases**:

1. Create a database, for example `flowly`. cPanel prefixes it with your
   account name, so it becomes something like `cpuser_flowly`.
2. Create a user with a strong password, for example `cpuser_flowly`.
3. Add the user to the database with **ALL PRIVILEGES**. The job queue creates
   and migrates its own tables on first start, so it needs `CREATE` and
   `ALTER`, not just read and write.

The app connects over localhost, so its connection string is:

```
DATABASE_URL=mysql://cpuser_flowly:PASSWORD@localhost:3306/cpuser_flowly
```

URL-encode special characters in the password (`@` becomes `%40`, `#` becomes
`%23`, `/` becomes `%2F`).

## 2. Migrations run themselves

There is nothing to run. The package starts with `MIGRATE_ON_START=true`, so
every time the app starts it applies any pending migrations from
`app/prisma/migrations` before serving (`lib/db/migrate-on-start.ts`). It
records them in Prisma's own `_prisma_migrations` table under Prisma's lock, so
`prisma migrate deploy` from your machine stays compatible if you ever use it.
The log shows `[Migrate] Applied N migration(s)` or `[Migrate] Database is up
to date`.

The job queue's own tables (`sidequest_*`) are created by the app as well.

## 3. Build the package

On your machine, in the repo:

```bash
npm ci
npm run package:cpanel
```

This writes `dist/flowly-cpanel.zip` (about 21 MB). Its layout:

```
app.js          startup file Passenger runs
package.json    no dependencies, so cPanel's npm install has nothing to do
.env.example
app/            the built app, with only the node_modules it needs
```

The built app sits in `app/` because CloudLinux's Node.js Selector reserves
`node_modules` in the application root for a symlink into its own virtual
environment, and its module install fails if a real folder is there. Your local
`.env` is stripped out of the zip; the server gets its own settings in step 5.

## 4. Create the Node.js app

In cPanel, open **Setup Node.js App** and click **Create Application**:

| Field | Value |
| --- | --- |
| Node.js version | 20.19+, 22.12+ or 24+ |
| Application mode | Production |
| Application root | a folder in your home directory, for example `flowly` |
| Application URL | the domain or subdomain to serve Flowly on |
| Application startup file | `app.js` |

Click **Create**. You don't need **Run NPM Install**: the package already
contains its dependencies. Clicking it is harmless — the root `package.json`
lists none, so it finishes with nothing installed.

## 5. Upload and configure

1. Open **File Manager**, go to the application root (for example
   `/home/cpuser/flowly`). If cPanel put a placeholder `app.js` there, delete it.
   Upload `flowly-cpanel.zip`, **Extract** it there, then delete the zip. You
   should see `app.js`, `package.json` and an `app` folder. Leave alone any
   `node_modules` link cPanel created; the app does not use it.
2. Set the environment variables. Either add them under **Environment
   variables** on the app's page in **Setup Node.js App**, or create a `.env`
   file in the application root (copy `.env.example`, which is in the package).
   The full list is in [setup.md](setup.md#environment-variables). On cPanel:
   - `NEXTAUTH_URL`: `https://` plus the Application URL from step 4.
   - `DATABASE_URL`: the `localhost` URL from step 1.
   - Leave `RUN_JOBS` unset. The jobs run inside this app.
3. Back in **Setup Node.js App**, click **Restart**.

Open `https://yourdomain.com/api/health`. It should report `"status":"ok"`,
with `worker.healthy: true`. The first request after a start or restart takes
a few seconds while Passenger boots the app.

## 6. Add the cron jobs

In cPanel, open **Cron Jobs** and add these three, with your domain and your
`CRON_SECRET`:

```
*/5 * * * *  curl -fsS -m 180 -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/attach-next-reel > /dev/null
0 5 * * *    curl -fsS -m 180 -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/refresh-tokens > /dev/null
10 5 * * *   curl -fsS -m 180 -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/snapshot-followers > /dev/null
```

They do the scheduled work Vercel's crons do elsewhere. `refresh-tokens` is the
one that matters most: without it the Instagram token expires and every
automation stops without an error. `-f` makes curl fail on an error response,
so cPanel emails you the failure (set the cron email at the top of the page)
while successful runs stay quiet.

The five-minute job has a second purpose. Passenger shuts an app down after a
few idle minutes and starts it again on the next request. While it is down,
due jobs (delayed follow-ups, retries) wait in MySQL — nothing is lost — and
run as soon as it starts. A request every five minutes keeps that wait under
five minutes. Incoming webhooks wake the app too.

## 7. Point Meta at your domain

The Meta app setup is the same as in [setup.md](setup.md), with your cPanel
domain in place of the Vercel one: the OAuth redirect URL and the webhook
callback URL both use `https://yourdomain.com`.

## Updating

1. `git pull`. New migrations are applied by the app when it restarts.
2. `npm run package:cpanel`.
3. In File Manager, delete the application root's `app` folder (old build
   files otherwise linger next to the new ones), then upload and extract the
   new zip. Your `.env` is not in the zip, so it survives.
4. **Restart** the app in **Setup Node.js App**.

## Troubleshooting

**`/api/health` says a table "does not exist".** The startup migrations did not
run or failed. The log shows `[Migrate] Failed` with the reason — usually a
database user without `CREATE`/`ALTER` rights (step 1). Fix it and restart.

**"An error occured during installation of modules. Web application is
inaccessible".** The application root holds a real `node_modules` folder,
which the Node.js Selector refuses. That happens with a zip built before the
`app/` layout, or after extracting the zip somewhere other than its root.
Delete everything in the application root except `.env`, extract a freshly
built zip, and restart.

**The site shows a generic Passenger or 503 error.** Look at the app's log. On
most CloudLinux hosts that is `stderr.log` in the application root; otherwise
your host can tell you where Passenger writes it. A Node version that is too old
logs `[Flowly] Node X is too old` there.

**`worker.healthy` is false in `/api/health`.** The job runtime is not running.
The log shows `[DM Worker] Started` on a good start, or `Failed to start job
runtime` with the reason. The usual reasons are a wrong `DATABASE_URL` or a
database user without `CREATE`/`ALTER` (step 1). Webhooks are still accepted
and queued meanwhile; the queued DMs go out once the runtime starts.

**The app keeps restarting or gets killed.** Shared plans cap memory per
account (CloudLinux LVE limits). Flowly settled around 270 MB of memory in
testing, so allow at least 512 MB. If the limit is lower, ask your host to raise it, or move to a plan that allows it.

**Duplicate DMs or the reconciler running twice.** Something else is running
the job runtime against the same database (an old worker, or a second copy of
the app). Stop it, or set `RUN_JOBS=false` on every copy but one.
