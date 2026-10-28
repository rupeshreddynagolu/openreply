// Startup file for cPanel's "Setup Node.js App" (Phusion Passenger).
//
// Passenger runs this file and routes the domain's traffic to whatever port it
// listens on, so no PORT setup is needed. It starts the standalone Next server
// next to it, which also loads `.env` from this folder and starts the job
// runtime (see instrumentation.ts).

// Prisma 7 and Next.js 16 need one of these. On an older Node the app dies
// deep inside a dependency, and Passenger only shows a generic error page, so
// fail early with a message that names the fix.
const [major, minor] = process.versions.node.split(".").map(Number);
const supported =
  (major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major >= 24;

if (!supported) {
  console.error(
    `[Flowly] Node ${process.versions.node} is too old. Pick Node 20.19+, ` +
      "22.12+ or 24+ in cPanel's Setup Node.js App, then restart the app."
  );
  process.exit(1);
}

// Passenger loads the startup file with require(), so this stays CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("./server.js");
