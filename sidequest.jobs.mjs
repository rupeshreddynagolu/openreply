// Job classes for Sidequest's runner (manualJobResolution in lib/jobs/sidequest.ts).
//
// The runner always loads job classes by importing a file from disk. The real
// class lives in the app bundle (lib/jobs/dm-job.ts), which publishes it on
// globalThis when loaded; jobs run inline in that same process, so this file
// only hands it back. Must ship next to the app on every deploy.

const jobs = globalThis.__flowlySidequestJobs;

if (!jobs?.DmJob) {
  throw new Error(
    "DmJob is not registered — lib/jobs/dm-job.ts must load before Sidequest runs a job"
  );
}

export const DmJob = jobs.DmJob;
