#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { X509Certificate } from "node:crypto";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const xcodeRoot = join(root, "xcode", "Safari MCP");
const project = join(xcodeRoot, "Safari MCP.xcodeproj");
const scheme = "Codex Safari Bridge (macOS)";
const defaultDerivedData = join(homedir(), ".codex-safari", "extension-build");
const defaultBundleId = "com.codex.local.safari-bridge";
const defaultExtensionBundleId = `${defaultBundleId}.Extension`;

function printHelp() {
  console.log(`Usage: node scripts/build-extension.mjs [options]

Build Codex Safari Bridge, the optional Safari Web Extension app.

Options:
  --team TEAM_ID             Sign with an Apple Development team.
  --team auto                Use a detected Apple Development team when exactly one is available.
  --sign-to-run-locally      Build without a team using Xcode's local signing path.
  --require-team             Fail instead of falling back when no team is configured.
  --bundle-id ID             Override the containing macOS app bundle ID.
  --extension-bundle-id ID   Override the Safari extension bundle ID.
  --configuration NAME       Xcode configuration to build. Defaults to Release.
  --derived-data PATH        Derived data/output directory.
  --open                     Open the built app after a successful build.
  --json                     Print a machine-readable summary after the build.
  --help                     Show this help.

Environment:
  CODEX_SAFARI_DEVELOPMENT_TEAM  Team ID, or "auto".
  DEVELOPMENT_TEAM               Fallback Team ID if CODEX_SAFARI_DEVELOPMENT_TEAM is unset.
  CODEX_SAFARI_BUNDLE_ID         Containing app bundle ID.
  CODEX_SAFARI_EXTENSION_BUNDLE_ID
                                Safari extension bundle ID.
  CODEX_SAFARI_EXTENSION_BUILD_DIR
                                Derived data/output directory.
`);
}

function parseArgs(argv) {
  const options = {
    team: process.env.CODEX_SAFARI_DEVELOPMENT_TEAM || process.env.DEVELOPMENT_TEAM || null,
    signToRunLocally: false,
    requireTeam: false,
    bundleId: process.env.CODEX_SAFARI_BUNDLE_ID || defaultBundleId,
    extensionBundleId: process.env.CODEX_SAFARI_EXTENSION_BUNDLE_ID || defaultExtensionBundleId,
    configuration: process.env.CONFIGURATION || "Release",
    derivedData: process.env.CODEX_SAFARI_EXTENSION_BUILD_DIR || defaultDerivedData,
    open: false,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value.`);
      i += 1;
      return value;
    };

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg === "--team") {
      options.team = next();
    } else if (arg.startsWith("--team=")) {
      options.team = arg.slice("--team=".length);
    } else if (arg === "--sign-to-run-locally") {
      options.signToRunLocally = true;
      options.team = null;
    } else if (arg === "--require-team") {
      options.requireTeam = true;
    } else if (arg === "--bundle-id") {
      options.bundleId = next();
    } else if (arg.startsWith("--bundle-id=")) {
      options.bundleId = arg.slice("--bundle-id=".length);
    } else if (arg === "--extension-bundle-id") {
      options.extensionBundleId = next();
    } else if (arg.startsWith("--extension-bundle-id=")) {
      options.extensionBundleId = arg.slice("--extension-bundle-id=".length);
    } else if (arg === "--configuration") {
      options.configuration = next();
    } else if (arg.startsWith("--configuration=")) {
      options.configuration = arg.slice("--configuration=".length);
    } else if (arg === "--derived-data") {
      options.derivedData = next();
    } else if (arg.startsWith("--derived-data=")) {
      options.derivedData = arg.slice("--derived-data=".length);
    } else if (arg === "--open") {
      options.open = true;
    } else if (arg === "--json") {
      options.json = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });
}

function detectAppleDevelopmentTeams() {
  const result = run("security", ["find-certificate", "-a", "-p", "-c", "Apple Development"]);
  if (result.status !== 0) return [];

  const teams = new Map();
  const certificates = result.stdout.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
  for (const pem of certificates) {
    try {
      const certificate = new X509Certificate(pem);
      const fields = Object.fromEntries(
        certificate.subject.split(/\r?\n/).map((field) => {
          const separator = field.indexOf("=");
          return separator === -1
            ? [field, ""]
            : [field.slice(0, separator), field.slice(separator + 1)];
        }),
      );
      const teamId = fields.OU;
      const commonName = fields.CN;
      if (teamId && commonName?.startsWith("Apple Development: ")) {
        teams.set(teamId, {
          id: teamId,
          name: commonName.replace(/^Apple Development: /, ""),
          organization: fields.O || null,
        });
      }
    } catch {
      // Ignore malformed keychain output and continue with any readable certificates.
    }
  }
  return [...teams.values()];
}

function resolveSigning(options) {
  if (options.signToRunLocally) return { mode: "local", team: null, detectedTeams: [] };

  if (options.team === "auto") {
    const detectedTeams = detectAppleDevelopmentTeams();
    if (detectedTeams.length === 1) {
      return { mode: "team", team: detectedTeams[0].id, detectedTeams };
    }
    const detail = detectedTeams.length === 0
      ? "No Apple Development signing identities were found."
      : `Multiple Apple Development teams were found: ${detectedTeams.map(t => `${t.id} (${t.name}${t.organization ? `, ${t.organization}` : ""})`).join(", ")}.`;
    throw new Error(`${detail} Set CODEX_SAFARI_DEVELOPMENT_TEAM=<TEAM_ID> or pass --team <TEAM_ID>.`);
  }

  if (options.team) return { mode: "team", team: options.team, detectedTeams: [] };
  if (options.requireTeam) {
    throw new Error("No development team configured. Set CODEX_SAFARI_DEVELOPMENT_TEAM=<TEAM_ID> or pass --team <TEAM_ID>.");
  }

  return { mode: "local", team: null, detectedTeams: [] };
}

function codesignInfo(appPath) {
  if (!existsSync(appPath)) return null;
  const result = run("codesign", ["-dv", "--verbose=4", appPath], { stdio: ["ignore", "pipe", "pipe"] });
  const text = `${result.stdout || ""}${result.stderr || ""}`;
  return {
    identifier: text.match(/Identifier=([^\n]+)/)?.[1] || null,
    teamIdentifier: text.match(/TeamIdentifier=([^\n]+)/)?.[1] || null,
    authority: [...text.matchAll(/Authority=([^\n]+)/g)].map(match => match[1]),
  };
}

function buildArgs(options, signing) {
  const args = [
    "-project", project,
    "-scheme", scheme,
    "-configuration", options.configuration,
    "-derivedDataPath", options.derivedData,
    `CODEX_SAFARI_BUNDLE_ID=${options.bundleId}`,
    `CODEX_SAFARI_EXTENSION_BUNDLE_ID=${options.extensionBundleId}`,
    "CODE_SIGNING_ALLOWED=YES",
  ];

  if (signing.mode === "team") {
    args.push(
      "CODE_SIGN_STYLE=Automatic",
      "CODE_SIGN_IDENTITY=Apple Development",
      `DEVELOPMENT_TEAM=${signing.team}`,
    );
  } else {
    args.push(
      "CODE_SIGN_IDENTITY=-",
      "DEVELOPMENT_TEAM=",
    );
  }

  args.push("build");
  return args;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error("Run with --help for usage.");
    process.exit(2);
  }

  if (process.platform !== "darwin") {
    console.error("The Codex Safari Bridge extension can only be built on macOS.");
    process.exit(1);
  }
  if (!existsSync(project)) {
    console.error(`Missing Xcode project: ${project}`);
    process.exit(1);
  }

  let signing;
  try {
    signing = resolveSigning(options);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }

  if (signing.mode === "local") {
    console.error("Building without a development team. Safari may require Developer > Allow unsigned extensions for this build.");
  } else {
    console.error(`Building with Apple Development team ${signing.team}.`);
  }

  const args = buildArgs(options, signing);
  const result = spawnSync("xcodebuild", args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);

  const appPath = join(options.derivedData, "Build", "Products", options.configuration, "Codex Safari Bridge.app");
  const extensionPath = join(appPath, "Contents", "PlugIns", "Codex Safari Bridge Extension.appex");
  const appSigning = codesignInfo(appPath);
  const extensionSigning = codesignInfo(extensionPath);
  const summary = {
    ok: true,
    signingMode: signing.mode,
    team: signing.team,
    bundleId: options.bundleId,
    extensionBundleId: options.extensionBundleId,
    derivedData: options.derivedData,
    appPath,
    extensionPath,
    appSigning,
    extensionSigning,
  };

  if (options.open) {
    spawnSync("open", [appPath], { stdio: "inherit" });
  }

  console.log("");
  console.log("Built Codex Safari Bridge.");
  console.log(`Signing mode: ${signing.mode}${signing.team ? ` (${signing.team})` : ""}`);
  console.log(`App: ${appPath}`);
  console.log(`Extension: ${extensionPath}`);
  if (appSigning?.teamIdentifier) console.log(`App TeamIdentifier: ${appSigning.teamIdentifier}`);
  console.log("Open the built macOS app once, then enable Codex Safari Bridge in Safari Settings > Extensions.");
  if (options.json) console.log(JSON.stringify(summary, null, 2));
}

main();
