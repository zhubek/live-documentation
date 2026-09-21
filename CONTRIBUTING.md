# Contributing

Start with the [README](README.md), [architecture](docs/architecture.md), and [AGENTS.md](AGENTS.md). For substantial changes, open an issue describing the user problem before implementing a subsystem.

## Development

Use Node 24+, `npm ci`, and the [local setup](docs/getting-started.md).

```sh
npm test
npm run build
```

Run these for application changes. For documentation-only changes, check links, commands, examples, and screenshots. Never commit credentials, private exports, SQLite files, or browser recovery drafts.

## Review expectations

- Preserve model IDs and existing exports.
- Update schema and semantic validation together when the contract changes.
- Preserve revision conflicts; do not introduce silent last-write-wins saves.
- Keep canvas interactions usable alongside JSON editing.
- Link claims to source; distinguish implementation from design examples.
- Explain the problem, resulting behavior, and validation in a pull request.

Add focused tests when behavior or data integrity changes. Avoid tests that repeat implementation. UI changes should include screenshots using example data.

## Bugs and security

Include version/commit, browser, reproduction steps, and expected/actual results. Use a small sanitized model where needed. Follow [SECURITY.md](SECURITY.md) for vulnerabilities, not public issues.

## License

Contributions are accepted under [MIT](LICENSE). Submit material you have the right to contribute and retain required third-party attribution.
