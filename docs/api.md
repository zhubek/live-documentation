# Model and API reference

All endpoints are served by Next.js. Prefer [studio-client.mjs](../studio-client.mjs) for agent updates: it handles session, Origin, validation, and base revision.

## Endpoints

| Method and path | Session | Body / result |
| --- | --- | --- |
| `GET /api/health` | No | Database health; no model content |
| `GET /api/session` | No | `{authenticated, configured}` |
| `POST /api/session` | No | `{password}` → session cookie; requires matching Origin |
| `DELETE /api/session` | No | Expires cookie; requires matching Origin |
| `GET /api/model` | Yes | `{model, revision, updatedAt}` |
| `GET /api/model?revisionOnly=true` | Yes | `{revision, updatedAt}` |
| `GET /api/schema` | Yes | Complete JSON Schema |
| `POST /api/model/validate` | Yes | `{model}` → `{valid:true}`; no write |
| `PUT /api/model` | Yes | `{model, revision}` → new `{revision, updatedAt}` |

POST/PUT model requests require `Content-Type: application/json` and an Origin matching `STUDIO_ORIGIN`. Responses use `Cache-Control: no-store`.

An empty server returns `{model:null, revision:0, updatedAt:null}`. The browser initializes its examples separately. Writes replace the complete model; there is no PATCH or automatic merge endpoint.

## Minimal model

```json
{
  "version": 1,
  "name": "Example product",
  "objects": [
    {"id": "api", "kind": "service", "name": "Application API"}
  ],
  "relations": [],
  "views": [
    {
      "id": "containers",
      "name": "Containers",
      "template": "C2",
      "objectIds": ["api"],
      "positions": {"api": {"x": 120, "y": 100}}
    }
  ]
}
```

The browser can enrich older or minimal models with compatibility migrations. To update an existing workspace predictably, pull and modify it instead of rebuilding it from this example.

## Model building blocks

| Field | Purpose |
| --- | --- |
| `objects` | Shared objects, descriptions, technologies, notes, and links |
| `relations` | Endpoints, labels, attachment sides, and appearance |
| `views` | Templates, object IDs, positions, and hierarchy |
| `layouts` | Shared frontend layout/component contracts |
| `projectState` | Cross-view state and storage documentation |
| `sourceRepository`, `sourceRevision`, `sourceProjects` | Source provenance |

View payloads include `pageSpec`, `moduleSpec`, `databaseSchema`, `documentation`, and `agentCanvas`. Get the schema for their exact fields and enums. Unknown properties are rejected. Semantic checks cover IDs, references, hierarchy, coordinates, and supported appearance.

## JavaScript example

Run from this repository with `STUDIO_URL` and `STUDIO_PASSWORD` provided through the environment:

```js
import {studioClient} from './studio-client.mjs';

const request = await studioClient({
  url: process.env.STUDIO_URL,
  password: process.env.STUDIO_PASSWORD,
});
const base = await request('/api/model');
if (!base.model) throw new Error('Initialize the workspace first.');

const model = structuredClone(base.model);
// Apply only the intended documentation changes to model here.
await request('/api/model/validate', 'POST', {model});
const saved = await request('/api/model', 'PUT', {
  model,
  revision: base.revision,
});
console.log({revision: saved.revision});
```

## Errors and concurrency

| Status | Meaning | Action |
| --- | --- | --- |
| 400 | Invalid JSON, types, references, revision value, or size | Fix proposal; inspect reported path |
| 401 | Missing or invalid session | Sign in again |
| 403 | Origin mismatch | Use configured origin |
| 409 | Stale base revision | Pull again; reapply intended changes |
| 429 | Login budget exhausted | Wait before retrying |
| 503 | Unconfigured sign-in or unavailable storage | Check server configuration/storage |

Type failures may include `errors`, an array of `{path, message}` entries. Other failures may only include `error`. There is no string-to-number/boolean coercion.

Never fix a 409 by attaching a newer revision number to an old whole-model proposal: that discards intervening edits. Preserve IDs, unrelated projects, notes, and positions when updating the newly pulled model.

## Limits

- Model: 5,000,000 bytes; HTTP envelope: 5,100,000 bytes.
- Login body: 4,096 bytes.
- History: latest 50 revisions in SQLite; no public history endpoint.
- No per-user API keys, webhooks, repository subscriptions, or streaming collaboration API.

This API uses a shared session cookie, not the GitHub token used to publish the repository.
