# Vendored SafariMCP

This runtime is vendored from `achiya-automation/safari-mcp`.

- Upstream repository: https://github.com/achiya-automation/safari-mcp
- Upstream tag: `v2.12.0`
- Upstream commit: `2b14b14f2b9ce76fea9f52491d782ae11a36bbd7`
- License: MIT, preserved in `LICENSE`

Codex-specific changes:
- Plugin-local MCP launch through `plugins/safari/.mcp.json`.
- Default state directory changed to `~/.codex-safari`.
- Default bridge ports changed to `9323` and `9324`.
- Helper signing identifier changed to `com.codex.local.safari-helper`.
- Added `safari_setup_status`, `safari_claim_tab`, and `safari_finalize_tabs`.
- Cookie, storage, and IndexedDB tools are hidden unless `CODEX_SAFARI_ENABLE_STORAGE_TOOLS=1`.
- Optional Safari extension is renamed to Codex Safari Bridge and uses the Codex bridge port.
- Extension signing is controlled by build-time settings instead of a committed Xcode development team.
