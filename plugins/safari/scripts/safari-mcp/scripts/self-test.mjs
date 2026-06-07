#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexSource = readFileSync(join(root, "index.js"), "utf8");
const tools = [...indexSource.matchAll(/server\.tool\(\s*["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((tool, index, all) => all.indexOf(tool) === index)
  .sort();

const sensitiveTools = new Set([
  "safari_get_cookies",
  "safari_set_cookie",
  "safari_delete_cookies",
  "safari_local_storage",
  "safari_set_local_storage",
  "safari_delete_local_storage",
  "safari_session_storage",
  "safari_set_session_storage",
  "safari_delete_session_storage",
  "safari_export_storage",
  "safari_import_storage",
  "safari_list_indexed_dbs",
  "safari_get_indexed_db",
]);
const storageToolsEnabled = process.env.CODEX_SAFARI_ENABLE_STORAGE_TOOLS === "1";
const exposedTools = storageToolsEnabled ? tools : tools.filter((tool) => !sensitiveTools.has(tool));

const required = ["safari_setup_status", "safari_claim_tab", "safari_finalize_tabs", "safari_new_tab", "safari_list_tabs"];
const missing = required.filter((tool) => !exposedTools.includes(tool));
if (missing.length > 0) {
  console.error(`Missing required tools: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  storageToolsEnabled,
  toolCount: exposedTools.length,
  tools: exposedTools,
}, null, 2));
