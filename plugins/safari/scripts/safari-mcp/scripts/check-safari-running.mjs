#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const json = process.argv.includes("--json");

function output(result) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.running) {
    console.log(`Safari is running${result.pid ? ` (pid ${result.pid})` : ""}.`);
  } else {
    console.log("Safari is not running.");
  }
}

function main() {
  if (process.platform !== "darwin") {
    const result = {
      ok: false,
      running: false,
      platform: process.platform,
      problem: "Safari setup checks only support macOS.",
    };
    output(result);
    process.exit(2);
  }

  const result = spawnSync("pgrep", ["-x", "Safari"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const pids = result.status === 0
    ? result.stdout.split(/\s+/).filter(Boolean).map(pid => Number(pid)).filter(Number.isInteger)
    : [];
  const running = pids.length > 0;
  const payload = {
    ok: running,
    running,
    platform: process.platform,
    pid: pids[0] || null,
    pids,
    problem: running ? null : "Safari is not running.",
  };

  output(payload);
  process.exit(running ? 0 : 1);
}

main();
