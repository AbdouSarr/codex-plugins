# Security

The Safari plugin controls a real local Safari session. Treat browser pages, screenshots, downloads, file uploads, cookies, and logged-in sites as sensitive.

## Reporting

Report security issues through GitHub Security Advisories for `abdousarr/codex-plugins` when available. If that is not available, open a GitHub issue with a minimal description and avoid posting secrets, tokens, private URLs, screenshots, cookies, or personal data.

## Local Safety Defaults

- Cookie, storage, and IndexedDB tools are hidden unless `CODEX_SAFARI_ENABLE_STORAGE_TOOLS=1`.
- Codex-owned tabs are tracked separately from claimed user tabs.
- Claimed tabs are released by cleanup instead of being closed by default.
- The helper is signed with `com.codex.local.safari-helper`.
- Safari and macOS permission prompts remain user-controlled.
