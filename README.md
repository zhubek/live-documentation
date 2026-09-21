# Live documentation

Interactive architecture and project documentation, formerly Fieldwork Model Studio. One Next.js application serves the editor and API; SQLite stores the model on a persistent volume.

## What it includes

- C4 canvases with draggable cards, editable connectors, drill-down views, notes, and on-demand module relations.
- Domain/class tables, module APIs, policies, state transitions, database tables, frontend component contracts, and Redis/agent workflow examples.
- JSON editors validated against one shared schema, including nested types and model references. Invalid edits never replace saved data.
- Revision-protected saves, undo/redo, JSON import/export, local recovery drafts, and the latest 50 server revisions.
- A [coding-agent workflow](AI-WORKFLOW.md) for reading, validating, and publishing live documentation. This app does not run an autonomous AI updater.

## Run locally

Use Node 24 or later.

```sh
npm ci
cp .env.example .env.local
# Set STUDIO_PASSWORD and STUDIO_SESSION_SECRET to separate random values.
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env.local`. Open http://localhost:5185. `STUDIO_ORIGIN` must exactly match the browser origin. SQLite defaults to `data/studio.sqlite`.

```sh
npm test
npm run build
npm start
```

Production builds use the bundled example snapshots. No Fieldwork or SB2 checkout, PostgreSQL, Redis, or external AI service is required to run the documentation app.

## Docker

Copy `.env.example` to `.env`, set the password and session secret, and set `STUDIO_ORIGIN` to the actual origin (for local Docker, `http://localhost:8085`). Then run:

```sh
docker compose up -d --build
```

Port 8085 serves Next.js. The `studio-data` volume persists `/data/studio.sqlite`. Keep the volume when recreating the container. For HTTPS, set `STUDIO_COOKIE_SECURE=true`. HTTP does not encrypt passwords or documentation in transit.

## Access and persistence

This version retains the existing shared-password login. It is one trusted shared workspace, without individual accounts or role-based authorization. Model/schema reads require a session; writes also check the request origin. Rotating `STUDIO_SESSION_SECRET` invalidates sessions.

The API validates every write and atomically rejects stale revisions with HTTP 409. The browser serializes autosaves and announces newer server revisions without replacing open drafts. There is no automatic concurrent merge. Models and requests are limited to 5 MB. The server stores the most recent 50 revisions.

Use Export JSON for a model backup. `node backup.mjs /path/to/backup.sqlite` uses SQLite's online backup API; set `STUDIO_DB_PATH` when necessary. Never commit credentials, database files, or private model exports.

## Examples and source snapshots

The initial workspace includes Fieldwork and its smaller Orders Lab comparison. Source links display bundled code excerpts; editing a documentation model never changes or executes application code. The LangGraph workflow is a design example, not a running agent.

A larger source-linked example is available in [examples/sb2/model.json](examples/sb2/model.json); load it with Import JSON. The standalone repository contains checked-in examples, not the deployed Studio database or browser drafts.

To refresh Fieldwork source excerpts from a separate checkout, set `FIELDWORK_SOURCE_ROOT` to that checkout's absolute path and run `npm run snapshots:refresh`. This is optional and is not part of a normal build.

## Origin

Extracted from the Model Studio application at Fieldwork commit `f085972`. The standalone packaging updates the display name and makes builds and tests independent of the parent repository. Existing model IDs, API routes, environment variable names, and browser storage keys are retained for compatibility.
