# Live documentation for coding agents

The Studio is the shared architecture/documentation model. Read it before product changes and update it after checking the implementation. It documents the product; it does not execute application code or run an AI model. A coding agent uses the authenticated API below. A schema validates structure and types, not whether a statement agrees with source code.

## Connect

Use Node 24+. Provide `STUDIO_URL` and the existing shared `STUDIO_PASSWORD` through the environment. Do not include credentials in a prompt, command-line argument, proposal JSON, source file, or Git commit. There is no new token or public write endpoint.

```sh
mkdir -p .local
node studio-client.mjs pull .local/studio-base.json
node studio-client.mjs schema .local/studio-schema.json
```

On PowerShell, create the folder with `New-Item -ItemType Directory -Force .local`. Keep these private working files out of Git. See the [API reference](docs/api.md) for model structure, errors, and limits.

Pull returns `{model, revision, updatedAt}`. The client refuses to overwrite existing files: use a new filename for each work session. Read the relevant objects, views, component contracts, operations, policies and source references. Check their source revision before relying on them. If implementation and documentation disagree, inspect the source and make the discrepancy explicit.

## Update

Copy the pulled envelope into `.local/studio-proposal.json` and edit its `model`. Preserve `revision`, stable IDs, unrelated projects, human notes, relationships, and canvas positions. Update only the affected documentation. Use `pageSpec` for frontend pages, `moduleSpec` for domain/API documentation, and `databaseSchema` for tables. Inspect the schema for exact fields; unknown properties and incorrect types are rejected. `moduleSpec` overrides the built-in Fieldwork module example when supplied; `documentation` can replace a built-in example with documented sections.

Link claims to the reviewed source revision. Keep policies, guards, permissions and state rules distinct. Do not invent APIs, state transitions, permissions or runtime guarantees from names alone. Preserve the Orders Lab comparison example.

```sh
node studio-client.mjs validate .local/studio-proposal.json
node studio-client.mjs push .local/studio-proposal.json
node studio-client.mjs pull .local/studio-verified.json
```

Validate is read-only. Push validates again and writes atomically using the base revision. A 409 means someone changed the model: pull a fresh file, reapply only your intended changes, inspect the diff, and validate again. Never bypass a conflict by substituting a revision onto an old whole-model proposal. Verify the saved model and report the resulting revision. The browser announces newer revisions; loading them is explicit so open drafts are not overwritten.

## API contract

| Endpoint | Purpose |
| --- | --- |
| `POST /api/session` | Sign in with `{password}`; returns an HttpOnly session cookie |
| `GET /api/model` | Current model, revision, timestamp |
| `GET /api/model?revisionOnly=true` | Revision and timestamp only |
| `GET /api/schema` | JSON Schema for all editable model types |
| `POST /api/model/validate` | Validate `{model}` without saving |
| `PUT /api/model` | Save `{model, revision}`; rejects invalid data or stale revisions |

All model/schema endpoints require the existing session. POST/PUT require the Studio Origin. The command-line client handles both. Wrong types return HTTP 400 with an error path; conflicts return 409. There is no coercion from strings to booleans or numbers. Saves retain the most recent 50 revisions. The 5 MB limit remains.
