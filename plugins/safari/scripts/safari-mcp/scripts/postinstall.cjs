#!/usr/bin/env node
// Codex Safari — postinstall: codesign helper + welcome message
// Skipped silently in CI and when stdout is not a TTY (npm install in scripts).

const path = require("path");
const { execSync } = require("child_process");
const fs = require("fs");

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  green: "\x1b[32m",
  red: "\x1b[31m",
};

// Re-sign safari-helper with a stable identifier so macOS Accessibility approval persists.
// The package ships with an adhoc-signed binary whose codesign Identifier is a one-off hash
// (e.g. `safari-helper-555549441c166aa237e130ddbe3d95629266ecaf`). macOS TCC keys grants by
// that identifier, so a fresh npm install or rebuild silently invalidates any previously-granted
// Accessibility approval — the helper keeps running but CGEvent injections to non-frontmost Safari
// windows stop reaching WebKit content (no isTrusted click events fire on the page).
// Re-signing here with the fixed identifier `com.codex.local.safari-helper` keeps the grant
// stable across installs.
function ensureCodesign() {
  if (process.platform !== "darwin") return;
  const helper = path.join(__dirname, "..", "safari-helper");
  if (!fs.existsSync(helper)) return;
  const identifier = (process.env.CODEX_SAFARI_HELPER_IDENTIFIER || "com.codex.local.safari-helper").replace(/[^A-Za-z0-9._-]/g, "");
  try {
    // Check current identifier; only re-sign if it doesn't already match.
    const current = execSync(`codesign -d -- "${helper}" 2>&1 | grep ^Identifier=`, { encoding: "utf8" }).trim();
    if (current.includes(identifier)) return;
    const entitlements = path.join(__dirname, "..", "safari-helper.entitlements");
    const entFlag = fs.existsSync(entitlements) ? `--entitlements "${entitlements}"` : "";
    execSync(`codesign -s - -f --identifier ${identifier} ${entFlag} "${helper}" 2>/dev/null`);
  } catch (_e) {
    // codesign may fail in environments without the toolchain; binary still works adhoc-signed.
  }
}
ensureCodesign();

if (process.env.CI || process.env.SAFARI_MCP_SILENT_INSTALL === "1") process.exit(0);

const msg = `
${c.bold}${c.cyan}Codex Safari runtime installed${c.reset} ${c.dim}— local Safari automation for Codex${c.reset}

${c.bold}Next steps:${c.reset}
  1. Enable Safari → Develop → ${c.yellow}Allow JavaScript from Apple Events${c.reset}
  2. Add to your MCP client config:
     ${c.dim}{ "mcpServers": { "safari": { "command": "node", "args": ["scripts/safari-mcp/index.js"] } } }${c.reset}
  3. ${c.bold}For native_click / native_keyboard${c.reset} (no focus stealing):
     System Settings → Privacy & Security → ${c.yellow}Accessibility${c.reset} → add
     ${c.dim}plugins/safari/scripts/safari-mcp/safari-helper${c.reset}

${c.dim}Upstream runtime adapted from github.com/achiya-automation/safari-mcp${c.reset}
`;

try { process.stdout.write(msg); } catch { /* ignore */ }
