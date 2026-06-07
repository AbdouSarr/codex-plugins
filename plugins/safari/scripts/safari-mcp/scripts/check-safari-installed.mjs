#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const json = process.argv.includes("--json");

function output(result) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.installed) {
    console.log(`Safari is installed${result.bundleId ? ` (${result.bundleId})` : ""}.`);
  } else {
    console.log(result.problem || "Safari is not installed.");
  }
}

function main() {
  if (process.platform !== "darwin") {
    const result = {
      ok: false,
      installed: false,
      platform: process.platform,
      problem: "Safari setup checks only support macOS.",
    };
    output(result);
    process.exit(2);
  }

  const appPaths = ["/Applications/Safari.app", "/System/Applications/Safari.app"];
  const appPath = appPaths.find(path => existsSync(path)) || null;
  const bundleIdResult = spawnSync("osascript", ["-e", 'id of application "Safari"'], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const bundleId = bundleIdResult.status === 0 ? bundleIdResult.stdout.trim() : null;
  const installed = Boolean(appPath || bundleId);
  const result = {
    ok: installed,
    installed,
    platform: process.platform,
    appPath,
    bundleId,
    problem: installed ? null : "Safari.app could not be found.",
  };

  output(result);
  process.exit(installed ? 0 : 1);
}

main();
