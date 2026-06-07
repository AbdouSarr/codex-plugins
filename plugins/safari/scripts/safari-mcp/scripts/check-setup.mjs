#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const json = process.argv.includes("--json");
const requireExtensionTeam = process.argv.includes("--require-extension-team");

function runCheck(script, args = []) {
  const result = spawnSync(process.execPath, [join(scriptsDir, script), "--json", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  let data = null;
  try {
    data = JSON.parse(result.stdout || "{}");
  } catch {
    data = {
      ok: false,
      problem: `Could not parse ${script} output.`,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }
  return {
    exitCode: result.status,
    ...data,
  };
}

function output(report) {
  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(`Safari installed: ${report.checks.safariInstalled.installed ? "yes" : "no"}`);
  console.log(`Safari running: ${report.checks.safariRunning.running ? "yes" : "no"}`);
  console.log(`JavaScript from Apple Events: ${report.checks.appleEvents.enabled ? "enabled" : report.checks.appleEvents.status}`);
  console.log(`Helper signing: ${report.checks.helperCodesign.ok ? "ready" : "needs repair"}`);
  console.log(`Bridge extension build: ${report.checks.extensionBuild.ok ? "ready" : "not ready"}`);
  if (report.notes.length > 0) {
    console.log("");
    for (const note of report.notes) console.log(`- ${note}`);
  }
}

function main() {
  const checks = {
    safariInstalled: runCheck("check-safari-installed.mjs"),
    safariRunning: runCheck("check-safari-running.mjs"),
    appleEvents: runCheck("check-apple-events.mjs"),
    helperCodesign: runCheck("check-helper-codesign.mjs"),
    extensionBuild: runCheck("check-extension-build.mjs", requireExtensionTeam ? ["--require-team"] : []),
  };
  const notes = [];
  if (!checks.safariInstalled.installed) notes.push(checks.safariInstalled.problem);
  if (!checks.safariRunning.running) notes.push("Open Safari before using Safari automation.");
  if (!checks.appleEvents.enabled) notes.push(checks.appleEvents.problem);
  if (!checks.helperCodesign.ok) notes.push(checks.helperCodesign.problem);
  if (!checks.extensionBuild.ok) notes.push(checks.extensionBuild.problem);
  if (checks.extensionBuild.ok && !checks.extensionBuild.teamSigned) {
    notes.push("Codex Safari Bridge is locally signed. For normal Safari Extensions visibility, rebuild with CODEX_SAFARI_DEVELOPMENT_TEAM=<TEAM_ID>.");
  }
  if (checks.extensionBuild.ok && checks.extensionBuild.teamSigned && !checks.extensionBuild.pluginKit.visible) {
    notes.push("Open the built Codex Safari Bridge app once, then enable the extension in Safari Settings > Extensions.");
  }

  const ready = Boolean(
    checks.safariInstalled.installed &&
    checks.safariRunning.running &&
    checks.appleEvents.enabled &&
    checks.helperCodesign.ok &&
    (!requireExtensionTeam || (checks.extensionBuild.ok && checks.extensionBuild.teamSigned))
  );
  const report = {
    ok: ready,
    requireExtensionTeam,
    checks,
    notes: notes.filter(Boolean),
  };

  output(report);
  process.exit(ready ? 0 : 1);
}

main();
