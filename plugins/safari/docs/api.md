# Safari API

The MCP server is named `safari` and exposes `safari_*` tools.

Recommended workflow:
1. `safari_setup_status`
2. `safari_list_tabs`
3. `safari_new_tab` for new work, or `safari_claim_tab` for an existing user tab
4. `safari_snapshot` or `safari_read_page`
5. Interact with `safari_click`, `safari_fill`, `safari_type_text`, `safari_press_key`, or native variants when needed
6. `safari_finalize_tabs`

Useful tools:
- Setup: `safari_setup_status`
- Tab control: `safari_list_tabs`, `safari_new_tab`, `safari_claim_tab`, `safari_switch_tab`, `safari_close_tab`, `safari_finalize_tabs`
- Navigation: `safari_navigate`, `safari_go_back`, `safari_go_forward`, `safari_reload`, `safari_navigate_and_read`
- Page reading: `safari_read_page`, `safari_snapshot`, `safari_get_source`, `safari_accessibility_snapshot`
- Interaction: `safari_click`, `safari_fill`, `safari_type_text`, `safari_press_key`, `safari_select_option`
- Native interaction: `safari_native_click`, `safari_native_keyboard`, `safari_native_type`, `safari_native_hover`
- Visuals and files: `safari_screenshot`, `safari_screenshot_element`, `safari_upload_file`, `safari_save_pdf`
- Diagnostics: `safari_start_console`, `safari_get_console`, `safari_network`, `safari_performance_metrics`

Storage, cookie, and IndexedDB tools are intentionally not exposed unless `CODEX_SAFARI_ENABLE_STORAGE_TOOLS=1` is set in `.mcp.json`.
