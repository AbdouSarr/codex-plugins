#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const expectedIdentifier = process.env.CODEX_SAFARI_HELPER_IDENTIFIER || "com.codex.local.safari-helper";
const json = process.argv.includes("--json");
const helperPathArg = process.argv.find(arg => arg.startsWith("--helper="));
const helperPath = helperPathArg ? resolve(helperPathArg.slice("--helper=".length)) : join(root, "safari-helper");

function output(result) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.ok) {
    console.log(`Safari helper is signed as ${result.identifier}.`);
  } else {
    console.log(result.problem || "Safari helper signing is not ready.");
  }
}

function readCodesign(path) {
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
    displayStatus: display.status,
    verifyStatus: verify.status,
    text,
    verifyText: `${verify.stdout || ""}${verify.stderr || ""}`.trim(),
  };
}

function main() {
  if (process.platform !== "darwin") {
    const result = {
      ok: false,
      platform: process.platform,
      helperPath,
      problem: "Safari helper signing checks only support macOS.",
    };
    output(result);
    process.exit(2);
  }

  if (!existsSync(helperPath)) {
    const result = {
      ok: false,
      platform: process.platform,
      helperPath,
      exists: false,
      problem: `Safari helper does not exist: ${helperPath}`,
    };
    output(result);
    process.exit(1);
  }

  const signing = readCodesign(helperPath);
  const identifier = signing.text.match(/Identifier=([^\n]+)/)?.[1] || null;
  const teamIdentifier = signing.text.match(/TeamIdentifier=([^\n]+)/)?.[1] || null;
  const authority = [...signing.text.matchAll(/Authority=([^\n]+)/g)].map(match => match[1]);
  const identifierMatches = identifier === expectedIdentifier;
  const verified = signing.verifyStatus === 0;
  const ok = identifierMatches && verified;
  const result = {
    ok,
    platform: process.platform,
    helperPath,
    exists: true,
    expectedIdentifier,
    identifier,
    identifierMatches,
    verified,
    teamIdentifier,
    authority,
    problem: ok ? null : `Safari helper should be signed as ${expectedIdentifier}. It will be re-signed on runtime startup when possible.`,
    verifyOutput: signing.verifyText || null,
  };

  output(result);
  process.exit(ok ? 0 : 1);
}

main();
