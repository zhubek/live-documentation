# Security

## Report a vulnerability

Use GitHub's [private vulnerability reporting](https://github.com/zhubek/live-documentation/security/advisories/new). Include affected commit, reproduction steps, and impact. Use synthetic data and redact credentials. Do not post exploitable details or private models in public issues.

The latest `main` is the current preview. There is no published response-time SLA or long-term support policy yet.

## Access boundary

The app has one shared-password workspace. Everyone who signs in can edit it. There are no individual users, read-only roles, tenant isolation, or per-user audit trails.

Model/schema API access requires a signed session. Writes also check Origin. Validation protects structure and references, not the truth of documentation or the security of the documented application.

Use HTTPS and a separately generated session secret. Keep SQLite and backups outside public directories. Browser recovery drafts remain in local storage; signing out does not promise to erase them. Use trusted devices for private documentation.

## Static assets and examples

Files under `public/`, including the source map and example database schema, are served without the model API's session check. They contain sample material. Do not add private code, secrets, or customer data to those assets on a publicly reachable instance. Protect the whole deployment externally if static assets must also be private.

This repository includes source snapshots and examples, not a live deployment database. Source links can navigate to external repositories. Review content and links before sharing models.

See [deployment](docs/deployment.md) for operations and [product direction](docs/roadmap.md) for capabilities not yet provided.
