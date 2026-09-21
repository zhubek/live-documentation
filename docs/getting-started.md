# Getting started

Live documentation is a web application for documenting another system. Its bundled diagrams describe sample products; it does not start their APIs, databases, or agent workflows.

## Install

Use Node.js 24 or later. The server uses Node's built-in SQLite module.

```sh
git clone https://github.com/zhubek/live-documentation.git
cd live-documentation
npm ci
cp .env.example .env.local
```

PowerShell: `Copy-Item .env.example .env.local`.

Replace the two placeholder credentials in `.env.local` with separate random values. Generate each value locally with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep the output in local configuration, not Git or a chat. Leave `STUDIO_ORIGIN=http://localhost:5185` for this setup.

```sh
npm run dev
```

Open http://localhost:5185 and enter your shared password. Use that exact origin: `localhost` and `127.0.0.1` are different origins.

## Explore the first example

1. Open **Fieldwork containers** in the directory. Follow **Explore inside** on the API, web application, or database card.
2. Open the Assignments module to inspect domain fields, actions, policies, and state transitions.
3. Open a frontend page to inspect layouts, components, props, and API contracts.
4. Return to the canvas, move a card, and wait for **Saved to server**.

Fieldwork is a learning example. The original Orders Lab remains available for a smaller comparison. Source links display bundled excerpts rather than live files from your machine.

## Document your own project

Use **New view** to choose a template. Inspect the generated JSON before applying it. Add objects on the canvas, connect their handles, and select a card to edit its metadata as JSON. View settings also use JSON.

For a larger initial import, work from an exported model and the schema at `GET /api/schema`, or give a coding agent the [agent workflow](../AI-WORKFLOW.md). There is no automatic repository scanner in this release.

Keep stable IDs when updating a model. An object can appear in several views; its shared definition affects all of them. Positions are stored per view.

## Try Smart Bolashaq

Use **Export JSON** to preserve your current model first. **Import JSON** loads a complete model; it is not a project merge operation.

Import [examples/sb2/model.json](../examples/sb2/model.json). It documents a particular source revision of a separate Next.js/NestJS project. The revision and origin are explained in the [example README](../examples/sb2/README.md).

## Where your work goes

- The server saves the model to `data/studio.sqlite` by default.
- Browser recovery drafts preserve unsaved work when a request fails.
- JSON exports are portable copies of the model.
- The latest 50 saved revisions remain in SQLite. There is no revision-history browser or restore API yet.

Closing the browser does not delete the server model. Recovery drafts are not a substitute for [backups](deployment.md#backups).

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Invalid request origin | Browser URL and `STUDIO_ORIGIN` must match, including port and scheme |
| Server asks you to configure a password | Set `STUDIO_PASSWORD` and restart the server |
| SQLite module is unavailable | Use Node 24+ |
| Older documentation after another editor saves | Use **Load latest documentation** after saving or exporting your own edits |
| Model validation fails | Read the reported JSON path; inspect the schema rather than guessing field names |

[Next: user guide](user-guide.md) · [Deploy a shared instance](deployment.md)
