# Safari Troubleshooting

Start troubleshooting with `safari_setup_status`.

For a full local setup report, run from `plugins/safari/scripts/safari-mcp`:

```bash
npm run check-setup -- --json
```

Common states:
- Safari is not running: ask the user before launching Safari.
- JavaScript from Apple Events is disabled: tell the user to enable Safari > Develop > Allow JavaScript from Apple Events.
- Automation permission is missing: macOS System Settings > Privacy & Security > Automation must allow Codex to control Safari.
- Native click or keyboard fails: macOS System Settings > Privacy & Security > Accessibility must allow the bundled `safari-helper` or Codex.
- Screenshots fail or return permission errors: macOS System Settings > Privacy & Security > Screen Recording must allow Codex.
- Extension is disconnected: continue with AppleScript fallback unless the task needs extension-only behavior. To repair the extension path, build and enable Codex Safari Bridge from `scripts/safari-mcp`.
- Extension is built but not visible in Safari Settings > Extensions: rebuild with an Apple Development team using `CODEX_SAFARI_DEVELOPMENT_TEAM=TEAM_ID npm run build-extension`, open the built app once, then check Safari Settings > Extensions again.
- Extension is locally signed without a team: enable Safari Settings > Developer > Allow unsigned extensions, or rebuild with a development team for normal visibility.
- Multiple Apple Development teams are detected: pass the exact certificate `OU` team ID with `CODEX_SAFARI_DEVELOPMENT_TEAM=TEAM_ID`.

Setup scripts:
- `scripts/check-safari-installed.mjs --json`
- `scripts/check-safari-running.mjs --json`
- `scripts/check-apple-events.mjs --json`
- `scripts/check-helper-codesign.mjs --json`
- `scripts/check-extension-build.mjs --json`
- `scripts/check-setup.mjs --json`

Do not inspect Safari profile databases, cookies, local storage, passwords, or session files while troubleshooting.
