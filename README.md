# Abdou Sarr Codex Plugins

This repository is a Codex plugin marketplace for plugins published by Abdou Sarr.

The marketplace identifier is `abdousarr`, so installs use commands like:

```bash
codex plugin marketplace add abdousarr/codex-plugins
codex plugin add safari@abdousarr
```

The marketplace display name is `Abdou Sarr`. Codex shows that label in the plugin browser, while the internal name stays short and stable for CLI installs.

## Plugins

| Plugin | Description |
| --- | --- |
| [Safari](plugins/safari/README.md) | Control your real macOS Safari session from Codex. Works through AppleScript/helper fallback by default, with an optional Safari extension for the most Chrome-like behavior. |

## Local Development

From a local clone:

```bash
git clone https://github.com/abdousarr/codex-plugins.git
cd codex-plugins
codex plugin marketplace add .
codex plugin add safari@abdousarr
```

After changing a plugin, bump its Codex cachebuster and reinstall:

```bash
python3 ~/.codex/skills/.system/plugin-creator/scripts/update_plugin_cachebuster.py plugins/safari
codex plugin remove safari@abdousarr
codex plugin add safari@abdousarr
```

Start a new Codex thread after reinstalling so new skills and MCP tools are loaded.

## Individual Plugin Repos

This repository is the marketplace users install. Individual plugin repositories are mirrors of
folders under `plugins/`, generated with `git subtree split`.

For Safari:

```bash
scripts/sync-plugin-repo.sh safari abdousarr/codex-safari
```

Keep marketplace installs pointed at `abdousarr/codex-plugins`; use the individual plugin repos for plugin-specific history, issues, and source browsing.

## Marketplace Layout

Codex resolves plugin paths relative to the marketplace root. This repository uses:

```text
.agents/plugins/marketplace.json
plugins/safari/
```

The marketplace file exposes `plugins/safari` with installation policy `AVAILABLE` and authentication policy `ON_INSTALL`.

## Verification

Useful checks before publishing:

```bash
python3 ~/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/safari
cd plugins/safari/scripts/safari-mcp
node --check index.js
node --check safari.js
npm run self-test
npm run check-setup -- --json
npm audit --omit=dev
```

## License

This repository is MIT licensed. The Safari plugin includes a vendored, adapted copy of SafariMCP; its MIT license is preserved in `plugins/safari/scripts/safari-mcp/LICENSE`.

## Thanks

Thanks to [SafariMCP](https://github.com/achiya-automation/safari-mcp) for the native Safari automation foundation, and to Claude's Chrome plugin patterns for the browser-plugin workflow this Safari plugin is designed to mirror.
