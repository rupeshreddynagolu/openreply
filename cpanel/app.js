// Startup file for cPanel's "Setup Node.js App" (Phusion Passenger).
//
// Passenger runs this file and routes the domain's traffic to whatever port it
// listens on, so no PORT setup is needed. The built app sits in ./app, with
// its own node_modules: CloudLinux's Node.js Selector owns the node_modules
// name in the application root (it must be a symlink into its virtual
// environment) and fails its module install if a real folder is there.
//
// Passenger loads the startup file with require(), so this file is CommonJS.
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs");
const path = require("node:path");

// Prisma 7 needs Node 20.19+, 22.12+ or 24+, and Sidequest needs 22.6+, so
// 22.12+ or 24+ covers both. On an older Node the app dies deep inside a
// dependency, and Passenger only shows a generic error page, so fail early
// with a message that names the fix.
const [major, minor] = process.versions.node.split(".").map(Number);
const supported = (major === 22 && minor >= 12) || major >= 24;

if (!supported) {
  console.error(
    `[Flowly] Node ${process.versions.node} is too old. Pick Node 22.12+ ` +
      "or 24+ in cPanel's Setup Node.js App, then restart the app."
  );
  process.exit(1);
}

// Settings can live in a .env next to this file, as an alternative to the
// app's Environment variables in cPanel. Those win: loadEnvFile never
// overrides a variable that is already set.
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

// Apply pending database migrations at startup (app/prisma/migrations). A
// shared host has no way to run `prisma migrate deploy` for us.
process.env.MIGRATE_ON_START ??= "true";

require("./app/server.js");
