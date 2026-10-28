// Builds the app and packs it for cPanel's "Setup Node.js App".
//
//   npm run package:cpanel
//
// Output: dist/flowly-cpanel.zip — extract it into the Node.js app's root
// folder. It is self-contained (node_modules included), so the app needs no
// "Run NPM Install" and no build on the server, which shared hosts usually
// cannot afford anyway. See docs/deploy-cpanel.md.

import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const distDir = path.join(root, "dist");
const outDir = path.join(distDir, "cpanel");
// The built app goes one level down. CloudLinux's Node.js Selector reserves
// node_modules in the application root for a symlink into its own virtual
// environment, and its module install fails when a real folder is there.
const appDir = path.join(outDir, "app");
const zipPath = path.join(distDir, "flowly-cpanel.zip");

function run(command, args, options = {}) {
  execFileSync(command, args, { cwd: root, stdio: "inherit", ...options });
}

console.log("[package] Building standalone output…");
run("npm", ["run", "build"], {
  env: { ...process.env, NEXT_OUTPUT: "standalone" },
});

console.log("[package] Assembling dist/cpanel…");
rmSync(outDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });
mkdirSync(outDir, { recursive: true });

cpSync(standalone, appDir, { recursive: true, verbatimSymlinks: true });

// Turbopack links external packages into .next/node_modules as symlinks.
// Extracting an archive through cPanel's File Manager does not reliably
// restore those, so each one becomes a real copy of the package it points to.
// (cpSync's own dereference option leaves nested links as absolute paths into
// this machine instead.)
for (const entry of readdirSync(appDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isSymbolicLink()) continue;
  const link = path.join(entry.parentPath, entry.name);
  const target = realpathSync(path.join(standalone, path.relative(appDir, link)));
  unlinkSync(link);
  cpSync(target, link, { recursive: true });
}

// Next copies the build machine's .env files into the standalone folder. Those
// are your local secrets, never something to upload: the server gets its own.
for (const name of readdirSync(appDir)) {
  if (name === ".env" || name.startsWith(".env.")) {
    rmSync(path.join(appDir, name));
  }
}

// The standalone server serves these only if they sit next to it.
cpSync(path.join(root, "public"), path.join(appDir, "public"), {
  recursive: true,
});
cpSync(
  path.join(root, ".next", "static"),
  path.join(appDir, ".next", "static"),
  { recursive: true }
);

cpSync(path.join(root, "cpanel", "app.js"), path.join(outDir, "app.js"));
cpSync(path.join(root, ".env.example"), path.join(outDir, ".env.example"));

// The Selector runs `npm install` against the root package.json (on "Run NPM
// Install", and on some hosts on save or restart). With no dependencies listed
// there is nothing to install, so it succeeds instead of fetching Next and
// Prisma onto a shared host. Everything the app needs is already in app/.
writeFileSync(
  path.join(outDir, "package.json"),
  JSON.stringify(
    {
      name: "flowly",
      private: true,
      description: "Flowly, packaged for cPanel. The app itself is in app/.",
      main: "app.js",
    },
    null,
    2
  ) + "\n"
);

// The job runtime cannot start without these, and nothing fails at build time
// if tracing missed them, so check here rather than on the server.
const required = [
  "app.js",
  "package.json",
  "app/server.js",
  "app/sidequest.jobs.mjs",
  "app/node_modules/@sidequest/mysql-backend/migrations",
  "app/node_modules/mysql2",
  "app/node_modules/knex",
];
const missing = required.filter((p) => !existsSync(path.join(outDir, p)));
if (missing.length > 0) {
  console.error(`[package] Missing from the package: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("[package] Zipping…");
run("zip", ["-qr", zipPath, "."], { cwd: outDir });

console.log(`
[package] Done: ${path.relative(root, zipPath)}

Next: upload it to the Node.js app's root on cPanel, extract it there, set the
startup file to app.js, then restart the app. Full steps: docs/deploy-cpanel.md
`);
