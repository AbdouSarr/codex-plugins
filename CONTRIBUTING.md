# Contributing

Thanks for helping improve Abdou Sarr Codex Plugins.

## Repository Shape

- Marketplace file: `.agents/plugins/marketplace.json`
- Plugin sources: `plugins/<plugin-name>/`
- Safari plugin: `plugins/safari/`

Keep plugin manifests, marketplace entries, and README instructions aligned. If you change a plugin name, marketplace namespace, source path, or version, verify both the source plugin and the installed cache.

## Safari Plugin Checks

Run these before opening a pull request:

```bash
python3 ~/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/safari
cd plugins/safari/scripts/safari-mcp
node --check index.js
node --check safari.js
node --check mcp-helpers.js
npm run self-test
npm audit --omit=dev
```

On macOS with Xcode installed, also verify the optional Safari extension build:

```bash
cd plugins/safari/scripts/safari-mcp
npm run build-extension
```

## Release Notes

For plugin updates, use the plugin-creator cachebuster helper instead of manually appending version suffixes:

```bash
python3 ~/.codex/skills/.system/plugin-creator/scripts/update_plugin_cachebuster.py plugins/safari
codex plugin add safari@abdousarr
```

Start a new Codex thread after reinstalling.
