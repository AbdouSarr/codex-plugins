#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const json = process.argv.includes("--json");
const openTestTab = process.argv.includes("--open-test-tab");

function output(result) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.enabled) {
    console.log("Safari JavaScript from Apple Events is enabled.");
  } else if (result.status === "no_documents") {
    console.log("Safari is running, but no document is open. Re-run with --open-test-tab for an active check.");
  } else {
    console.log(result.problem || "Safari JavaScript from Apple Events is not enabled.");
  }
}

function safariIsRunning() {
  const result = spawnSync("pgrep", ["-x", "Safari"], { stdio: "ignore" });
  return result.status === 0;
}

function classifyError(text) {
  if (/Allow JavaScript from Apple Events/i.test(text)) {
    return {
      status: "disabled",
      problem: "Enable Safari > Develop > Allow JavaScript from Apple Events.",
    };
  }
  if (/not authorized|not allowed|not permitted|Automation/i.test(text)) {
    return {
      status: "automation_denied",
      problem: "macOS Automation permission is not granted for the process running this check.",
    };
  }
  if (/Can.?t get|Invalid index|missing value|front window|document/i.test(text)) {
    return {
      status: "no_documents",
      problem: "Safari is running, but no document is open.",
    };
  }
  return {
    status: "error",
    problem: text.trim() || "Could not run JavaScript from Apple Events.",
  };
}

function main() {
  if (process.platform !== "darwin") {
    const result = {
      ok: false,
      enabled: false,
      platform: process.platform,
      status: "unsupported_platform",
      problem: "Safari setup checks only support macOS.",
    };
    output(result);
    process.exit(2);
  }

  if (!safariIsRunning()) {
    const result = {
      ok: false,
      enabled: false,
      platform: process.platform,
      status: "safari_not_running",
      problem: "Safari is not running.",
    };
    output(result);
    process.exit(1);
  }

  const script = openTestTab
    ? 'tell application "Safari"\nif (count of documents) = 0 then make new document with properties {URL:"about:blank"}\ndelay 0.2\nreturn do JavaScript "1+1" in current tab of front window\nend tell'
    : 'tell application "Safari"\nif (count of documents) = 0 then return "no-documents"\nreturn do JavaScript "1+1" in current tab of front window\nend tell';
  const result = spawnSync("osascript", ["-e", script], {
    encoding: "utf8",
    timeout: 5000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const text = `${result.stdout || ""}${result.stderr || ""}`.trim();

  if (result.status === 0 && Number(text) === 2) {
    const payload = {
      ok: true,
      enabled: true,
      platform: process.platform,
      status: "enabled",
      problem: null,
    };
    output(payload);
    process.exit(0);
  }

  if (result.status === 0 && text === "no-documents") {
    const payload = {
      ok: false,
      enabled: false,
      platform: process.platform,
      status: "no_documents",
      problem: "Safari is running, but no document is open.",
    };
    output(payload);
    process.exit(1);
  }

  const classified = classifyError(text);
  const payload = {
    ok: false,
    enabled: false,
    platform: process.platform,
    ...classified,
    raw: text || null,
  };
  output(payload);
  process.exit(1);
}

main();
