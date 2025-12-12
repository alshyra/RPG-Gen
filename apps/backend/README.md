# Backend — Notes

This backend reads configuration from environment variables. To test locally, create a `.env` file inside the `backend/` folder (do not commit it) and set at minimum your Google API key:

```env
# backend/.env
GOOGLE_API_KEY=AIza...your_api_key_here
```

Then install and start in dev:

```bash
cd packages/backend
npm install
npm run start:dev
```

Swagger UI will be available at http://localhost:3001/docs

## Health endpoints (no authentication)

Two lightweight, unauthenticated endpoints are available to check server readiness:

- GET /health → { status: 'ok', pid, uptime, timestamp }

These are suitable for load balancer and Kubernetes readiness/liveness checks.

## Testing notes — mongodb-memory-server cache/lockfile issues

CI environments that run tests in parallel can hit lockfile conflicts when the
default mongodb-memory-server cache directory is shared across runs. To make
tests robust we configure a unique temporary download/cache directory for the
test Mongo instances (see `test/helpers/test-app.ts`). This prevents
UnableToUnlockLockfileError in CI and local parallel test runs.

If you need to customise this behavior in CI, you can set the
MONGOMS_DOWNLOAD_DIR env var to a directory unique for the job or runner.
