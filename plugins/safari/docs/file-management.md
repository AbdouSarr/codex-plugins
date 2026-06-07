# File Management

Uploads:
- Prefer `safari_upload_file` with an absolute local path and the relevant file input selector.
- Do not click the file input before calling `safari_upload_file`.
- Verify the upload with `safari_snapshot` or visible page state after the tool returns.

Downloads:
- Ask before downloading files into user-visible or sensitive directories unless the user already requested that download.
- Use absolute output paths for `safari_save_pdf`.

Clipboard:
- Native paste tools save and restore the user's clipboard where the runtime supports it.
- Do not read or write clipboard contents unless it is necessary for the user-requested browser action.
