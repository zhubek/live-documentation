# Live documentation conventions

- Read README.md and AI-WORKFLOW.md before changing the app.
- Use Node 24 or later. Run npm test and npm run build for relevant changes.
- Preserve canvas editing, stable model IDs, storage compatibility, and JSON import/export.
- All model updates must pass the shared schema and reference validation and preserve revision conflict checks.
- Keep policies, guards, permissions, and state rules distinct in documentation.
- Preserve the Fieldwork and Orders Lab examples. Example documentation does not execute the documented business application.
- Never commit credentials, .env files, database files, or private live-model exports.
- Read current live documentation before product changes when credentials are available; update only affected documentation after verification and report the resulting revision. Never silently overwrite user edits or canvas positions.
