# Deployment and operations

Start with one application instance and a persistent local SQLite volume, shared by a trusted team. The app does not provide separate customer accounts, tenant isolation, or granular roles.

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `STUDIO_PASSWORD` | Shared sign-in password | Required |
| `STUDIO_SESSION_SECRET` | Session-signing secret; set separately | Falls back to password in current code |
| `STUDIO_ORIGIN` | Exact browser origin for write checks | Request URL origin if unset; explicitly set in deployment |
| `STUDIO_COOKIE_SECURE` | Set `true` when browsers use HTTPS | `false` |
| `STUDIO_DB_PATH` | SQLite file | `./data/studio.sqlite`; Docker: `/data/studio.sqlite` |
| `STUDIO_URL` | Agent CLI base URL, not server configuration | Required by CLI |

Secrets belong in deployment configuration. `.env.example` contains placeholders, not deployment credentials.

## Docker Compose

Copy `.env.example` to `.env`, set separate password and session-secret values, and set `STUDIO_ORIGIN=http://localhost:8085` for local Docker use.

```sh
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 studio
```

The image builds locally. One container serves Next.js on port 3000, exposed as 8085. The named `studio-data` volume holds SQLite data and survives container replacement. The health check calls `/api/health` and checks database access.

Use `docker compose stop` to preserve data when stopping. Remove the volume only if you intend to discard the workspace.

## HTTPS and access

For a shared deployment, use an HTTPS reverse proxy. Set `STUDIO_ORIGIN` to the public HTTPS origin and `STUDIO_COOKIE_SECURE=true`. Keep the upstream app port private to that proxy or bind the published port to loopback on the same host.

The bundled Compose file publishes port 8085 on all host interfaces. Adjust the binding or network access before running on a publicly reachable host.

Login uses one shared password and a signed, HttpOnly, SameSite=Strict cookie. Sessions expire after seven days. Rotating `STUDIO_SESSION_SECRET` invalidates sessions. Login attempts share a process-local budget of 10 per minute, not a distributed rate limiter.

Everyone who can sign in can edit the workspace. See [Security](../SECURITY.md) for static-source and browser-draft boundaries.

## Backups

JSON export transfers a model. A SQLite backup also retains revision history. Store backups outside the persistent volume and test recovery.

For a local installation:

```sh
node backup.mjs /absolute/path/to/backups/live-documentation.sqlite
```

This uses SQLite's online backup API. Set `STUDIO_DB_PATH` for a non-default database. Use a new backup filename each time.

The standalone Docker image does not include the development backup script. Back up through Node's SQLite API; replace the filename with a unique value:

```sh
docker compose exec studio node -e 'const {DatabaseSync,backup}=require("node:sqlite"); const db=new DatabaseSync("/data/studio.sqlite",{readOnly:true}); backup(db,"/data/backup-YYYYMMDD.sqlite").then(()=>db.close()).catch(e=>{db.close();console.error(e.message);process.exitCode=1})'
docker compose cp studio:/data/backup-YYYYMMDD.sqlite ./backup-YYYYMMDD.sqlite
```

Do not copy only the active main database file while SQLite uses WAL: recent writes may be in companion files.

## Restore

1. Stop the app and back up the current volume before changing it.
2. Restore a verified online-backup file as `studio.sqlite`. Keep the old database and its `-wal`/`-shm` companions together in the backup; do not leave old companions beside the restored file.
3. Ensure the restored database and directory are writable by the container's `node` user, UID 1000.
4. Start the app, check `/api/health`, sign in, and inspect the model and revision.

Browser recovery drafts may refer to the pre-restore revision. Export them before deliberately loading the restored server version.

## Upgrades

Back up first, review the [changelog](../CHANGELOG.md), pull the desired commit or release, and rebuild. Preserve the volume. Keep the prior image and a pre-upgrade database backup for rollback; do not assume old code supports future database formats.

Current limits: 5,000,000-byte serialized models, approximately 5.1 MB HTTP request bodies, and 50 saved revisions. Horizontal scaling and high availability are not supported deployment claims for this preview.
