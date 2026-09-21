# User guide

## Navigate a connected model

The directory and breadcrumbs move between views. **Explore inside** opens a view linked to an object. A view is a perspective on shared objects, not an independent copy.

Drag the directory's right edge to resize it. Search the directory when the model contains many views.

## Architecture canvases

- Drag cards to arrange them. Completed moves are saved with the view.
- Drag between handles to connect objects. Cards provide attachment points on all four sides.
- Select a relationship to edit endpoints, label, sides, shape, arrows, and appearance as JSON.
- Use canvas controls to zoom or fit the view, and Auto layout to rearrange cards.
- Add notes to an object's JSON. Expand **Notes** on the card to read them.

Module canvases hide relationship lines until they are useful. Hover a relation row for one connection, or its **Relations** header for all connected lines. Click to pin the selection and edit. Click the background or press Escape to clear it. The + control proposes a new relationship as JSON.

Removing an object from a view does not delete its shared definition. Inspect a whole-model JSON edit carefully if removing the object itself and its references.

## JSON editing

Select an object, relationship, page, or view to edit its relevant JSON. **Edit JSON** in the header edits the complete model.

1. Change the draft.
2. Read validation errors next to the editor.
3. Apply the draft when it is valid.
4. Wait for **Saved to server**.

Parsing, types, supported fields, and references are checked before saving. The server repeats the checks. A string such as `"false"` is not accepted where a boolean is required. Unknown fields are rejected rather than silently discarded.

Applying a draft and completing a server save are separate steps. If saving fails, the error banner explains recovery options. If the underlying value changes while a JSON draft is open, reload that value before applying.

The schema checks structure. It cannot prove that a described policy or API matches code.

## Domain and API documentation

Domain cards show fields and actions. Related table fields navigate to the table; enum links reveal their options. Policies, capabilities, and state transitions open linked details.

The **Module API** tab indexes documented operations, including operations without a single domain owner. Avoid inventing a class just to hold an unrelated endpoint.

Document a policy as the decision rule, a guard as an enforcement point, and a state rule as a business-state constraint. A frontend permission is a derived decision; it does not replace backend enforcement.

## Pages, databases, and workflows

- Frontend views describe shared layouts, nested components, props, permissions, API calls, and UI state.
- Database views group tables into domains. A domain's **Expand all** control reveals its tables.
- Redis examples describe key patterns, expiry, payloads, and channel consumers.
- Agent examples use a graph canvas for branching, retries, and approvals. Select a line for connector properties; click its label for routing details.

These are documentation surfaces. They do not execute database operations, enforce documented permissions, or run LangGraph.

## Concurrent work and recovery

Each successful save advances the server revision. If two editors save from the same revision, the later stale write is rejected instead of silently overwriting the first.

On conflict, export your local edits, load the newer model, and reapply your intended changes. Retrying an unchanged stale proposal will not resolve it.

The browser checks for newer revisions while visible and on focus. Loading is explicit because it resets open JSON drafts. Undo and redo are local editing tools, not a server-wide audit log.

Export before replacing a workspace with **Import JSON**. Keep private exports outside this public repository.
