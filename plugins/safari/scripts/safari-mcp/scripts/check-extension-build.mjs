#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const json = process.argv.includes("--json");
const requireTeam = process.argv.includes("--require-team");
const configurationArg = process.argv.find(arg => arg.startsWith("--configuration="));
const configuration = configurationArg ? configurationArg.slice("--configuration=".length) : process.env.CONFIGURATION || "Release";
const derivedData = process.env.CODEX_SAFARI_EXTENSION_BUILD_DIR || join(homedir(), ".codex-safari", "extension-build");
const appArg = process.argv.find(arg => arg.startsWith("--app="));
const appPath = appArg
  ? resolve(appArg.slice("--app=".length))
  : join(derivedData, "Build", "Products", configuration, "Codex Safari Bridge.app");
const extensionPath = join(appPath, "Contents", "PlugIns", "Codex Safari Bridge Extension.appex");

function output(result) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.ok) {
    const team = result.appSigning?.teamIdentifier;
    console.log(`Codex Safari Bridge is built${team ? ` and signed by team ${team}` : ""}.`);
  } else {
    console.log(result.problem || "Codex Safari Bridge is not built.");
  }
}

function codesignInfo(path) {
  if (!existsSync(path)) return null;
  const display = spawnSync("codesign", ["-dv", "--verbose=4", path], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const text = `${display.stdout || ""}${display.stderr || ""}`;
  const verify = spawnSync("codesign", ["--verify", "--strict", path], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    verified: verify.status === 0,
    identifier: text.match(/Identifier=([^\n]+)/)?.[1] || null,
    teamIdentifier: text.match(/TeamIdentifier=([^\n]+)/)?.[1] || null,
    authority: [...text.matchAll(/Authority=([^\n]+)/g)].map(match => match[1]),
    verifyOutput: `${verify.stdout || ""}${verify.stderr || ""}`.trim() || null,
  };
}

function pluginKitVisible(extensionIdentifier) {
  if (!extensionIdentifier) return { checked: false, visible: false, raw: null };
  const result = spawnSync("pluginkit", ["-mAvvv", "-p", "com.apple.Safari.web-extension"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const raw = `${result.stdout || ""}${result.stderr || ""}`;
  return {
    checked: result.status === 0,
    visible: raw.includes(extensionIdentifier),
    raw: raw.trim().slice(0, 12000) || null,
  };
}

function main() {
  if (process.platform !== "darwin") {
    const result = {
      ok: false,
      platform: process.platform,
      appPath,
      extensionPath,
      problem: "Safari extension build checks only support macOS.",
    };
    output(result);
    process.exit(2);
  }

  const appExists = existsSync(appPath);
  const extensionExists = existsSync(extensionPath);
  const appSigning = codesignInfo(appPath);
  const extensionSigning = codesignInfo(extensionPath);
  const teamSigned = Boolean(appSigning?.teamIdentifier && extensionSigning?.teamIdentifier);
  const pluginKit = pluginKitVisible(extensionSigning?.identifier);
  const ok = appExists && extensionExists && Boolean(appSigning?.verified) && Boolean(extensionSigning?.verified) && (!requireTeam || teamSigned);
  const problem = ok
    ? null
    : !appExists
      ? `Codex Safari Bridge app is missing: ${appPath}`
      : !extensionExists
        ? `Codex Safari Bridge extension is missing: ${extensionPath}`
        : requireTeam && !teamSigned
          ? "Codex Safari Bridge is built, but it is not signed with an Apple Development team."
          : "Codex Safari Bridge exists, but codesign verification failed.";
  const result = {
    ok,
    platform: process.platform,
    configuration,
    derivedData,
    appPath,
    extensionPath,
    appExists,
    extensionExists,
    teamSigned,
    appSigning,
    extensionSigning,
    pluginKit,
    problem,
  };

  output(result);
  process.exit(ok ? 0 : 1);
}

main();
