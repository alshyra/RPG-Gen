# E2E Tests

End-to-end tests for RPG-Gen using Playwright.

## Prerequisites

Tests require Docker Compose services to be running:

- MongoDB (port 27017)
- Backend (port 3001)
- Frontend (port 80)

## Running Tests Locally

1. **Start services** (uses production Docker images):

   ```bash
   # From project root
   docker compose up --build -d
   ```

2. **Wait for services to be ready** (backend takes ~10-15s for seed):

   ```bash
   # Check backend health
   curl http://localhost:3001/api/health

   # Check frontend
   curl http://localhost/
   ```

3. **Prepare test database**:

   ```bash
   npm run e2e:prepare-db -- --count 2
   ```

4. **Run tests**:

   ```bash
   # All tests
   npm run test:e2e

   # With UI
   npm run test:e2e:ui

   # Debug mode
   npm run test:e2e:debug
   ```

5. **Cleanup** (optional):
   ```bash
   npm run e2e:cleanup-db
   docker compose down -v
   ```

## CI Behavior

In CI, the workflow automatically:

- Builds and starts Docker containers
- Waits for health checks
- Prepares test database
- Runs tests with 2 retries
- Uploads artifacts on failure

## Test Structure

- `tests/` - Test specs organized by feature
- `helpers/` - Shared utilities (auth, API calls)
- `playwright.config.ts` - Playwright configuration

All tests use `http://localhost` (port 80) as base URL.
