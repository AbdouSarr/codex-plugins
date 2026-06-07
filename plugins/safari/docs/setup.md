# Safari Setup

The Safari plugin runs locally on macOS and uses the user's real Safari session.

The extension is optional. The plugin can run through AppleScript and the signed Swift helper, then use the Codex Safari Bridge extension when the user has enabled it.

Required first-run settings for the fallback path:
- Safari must be installed and running.
- Safari > Develop > Allow JavaScript from Apple Events must be enabled.
- macOS may ask for Automation permission when Codex controls Safari.
- OS-level native click, keyboard, and screenshot workflows may require Accessibility and Screen Recording permissions for the Codex app or the bundled `safari-helper`.

Run the setup report from the Safari runtime directory:

```bash
cd plugins/safari/scripts/safari-mcp
npm run check-setup
npm run check-setup -- --json
```

## Codex Safari Bridge Extension

The optional Codex Safari Bridge extension improves speed, page access, and Chrome-like browser automation behavior. Safari requires each user to enable extensions manually.

For normal Safari Extensions visibility from a source checkout, build the containing macOS app with an Apple Development team:

```bash
cd plugins/safari/scripts/safari-mcp
CODEX_SAFARI_DEVELOPMENT_TEAM=TEAM_ID npm run build-extension
open "$HOME/.codex-safari/extension-build/Build/Products/Release/Codex Safari Bridge.app"
```

If the machine has exactly one Apple Development identity, use:

```bash
cd plugins/safari/scripts/safari-mcp
npm run build-extension:auto-team
```

`TEAM_ID` is the `OU` value in the Apple Development certificate. When multiple teams are present, list the certificate subjects and copy the `OU` for the account you want:

```bash
security find-certificate -a -p -c "Apple Development" \
  | awk 'BEGIN{n=0} /BEGIN CERTIFICATE/{n++; f="/tmp/codex-safari-cert-" n ".pem"} {if(f) print > f} END{for(i=1;i<=n;i++) print "/tmp/codex-safari-cert-" i ".pem"}' \
  | xargs -I{} sh -c 'openssl x509 -in "{}" -noout -subject'
```

Do not commit a development team ID to the Xcode project. The project intentionally leaves `DEVELOPMENT_TEAM` blank so each developer can provide their own team at build time.

For contributors without a development team:

```bash
cd plugins/safari/scripts/safari-mcp
npm run build-extension:local
```

Local signing may require Safari Settings > Developer > Allow unsigned extensions, and Safari may reset that setting when it quits. A temporary raw extension load is also possible from Safari Settings > Developer > Add Temporary Extension.

After building, open the macOS app once and enable Codex Safari Bridge in Safari Settings > Extensions. If Safari profiles are enabled, also enable it for the target Safari profile. The plugin still works through AppleScript fallback when the extension is not connected.

Useful setup scripts:

```bash
npm run check-safari-installed -- --json
npm run check-safari-running -- --json
npm run check-apple-events -- --json
npm run check-helper-codesign -- --json
npm run check-extension-build -- --json
npm run check-extension-build -- --require-team --json
```

Run `safari_setup_status` before browser work to see current readiness and exact missing permissions.
