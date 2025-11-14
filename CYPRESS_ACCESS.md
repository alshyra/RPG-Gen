# Cypress E2E Testing Access Guide

## Overview

This project uses Cypress for end-to-end testing. Due to network restrictions that prevent downloading the Cypress binary directly, we use Docker to run the tests.

## Prerequisites

- Docker installed and running
- Node.js and npm installed
- Frontend dependencies installed (`cd frontend && npm install`)

## Test Status

✅ **42/42 tests passing (100%)**

All e2e tests are working successfully!

## Running Tests

### Option 1: Using Docker (Recommended)

This is the recommended approach when the Cypress binary cannot be downloaded.

#### Run All Tests

```bash
# Terminal 1: Start the dev server
cd frontend
npm run dev

# Terminal 2: Run all e2e tests
cd /path/to/RPG-Gen
docker run --rm --network host \
  -v $(pwd)/frontend:/e2e \
  -w /e2e \
  cypress/included:15.6.0 \
  --config baseUrl=http://localhost:5173
```

#### Run Specific Test File

```bash
docker run --rm --network host \
  -v $(pwd)/frontend:/e2e \
  -w /e2e \
  cypress/included:15.6.0 \
  --config baseUrl=http://localhost:5173 \
  --spec "cypress/e2e/smoke.cy.ts"
```

#### Available Test Files

- `api-integration.cy.ts` - API endpoint integration tests (3 tests)
- `authentication.cy.ts` - Authentication flow tests (16 tests)
- `character-creation.cy.ts` - Character creation wizard tests (6 tests)
- `home.cy.ts` - Home page tests (4 tests)
- `navigation.cy.ts` - Route navigation tests (4 tests)
- `smoke.cy.ts` - Basic smoke tests (3 tests)
- `world-selection.cy.ts` - World selection tests (6 tests)

### Option 2: Using npm Scripts (Requires Cypress Binary)

If you have the Cypress binary installed (via `npm install` without restrictions):

```bash
cd frontend

# Run all e2e tests (headless)
npm run test:e2e

# Open Cypress UI
npm run test:e2e:open

# Run component tests
npm run test:component
npm run test:component:open
```

### Option 3: GitHub Actions (CI/CD)

Tests run automatically in GitHub Actions on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The workflow uses `cypress-io/github-action@v6` which automatically handles Cypress installation and caching.

## Docker Image Details

- **Image**: `cypress/included:15.6.0`
- **Contents**: Cypress binary pre-installed with all dependencies
- **Browser**: Chrome (headless by default)
- **Node**: v24.11.1

## Troubleshooting

### Cannot Access Cypress Binary

**Error**: `getaddrinfo ENOTFOUND download.cypress.io`

**Solution**: Use Docker approach (Option 1) or whitelist `download.cypress.io` in your firewall.

### Dev Server Not Accessible

**Error**: Tests fail to connect to `http://localhost:5173`

**Solution**: 
1. Make sure dev server is running: `cd frontend && npm run dev`
2. Check that port 5173 is not blocked
3. Verify with: `curl http://localhost:5173`

### Docker Network Issues

**Error**: Tests cannot connect to localhost

**Solution**: Use `--network host` flag in Docker command (already included in examples above)

### Tests Fail on CI but Pass Locally

**Solution**: Check GitHub Actions logs for specific errors. The CI workflow is configured to upload screenshots and videos on failure.

## Test Configuration

Test configuration is in `frontend/cypress.config.ts`:

- **Base URL**: `http://localhost:5173` (dev server)
- **Spec Pattern**: `cypress/e2e/**/*.cy.{js,jsx,ts,tsx}`
- **Support File**: `cypress/support/e2e.ts`
- **Timeouts**:
  - Default command: 6000ms
  - Page load: 20000ms
  - Request/Response: 10000ms
- **Retries**: 1 attempt in run mode, 0 in open mode

## Custom Commands

The test suite includes custom Cypress commands:

- `cy.mockAuth()` - Mock authentication for protected routes
- `cy.clearAuth()` - Clear authentication tokens
- `cy.setupApiMocks()` - Setup API mocks to prevent timeouts

These are defined in `frontend/cypress/support/e2e.ts`.

## Video and Screenshots

When tests run via Docker:
- Videos are saved to `frontend/cypress/videos/`
- Screenshots (on failure) are saved to `frontend/cypress/screenshots/`

These files are gitignored and not committed to the repository.

## Contributing

When adding new e2e tests:

1. Create test file in `frontend/cypress/e2e/`
2. Use `.cy.ts` extension for TypeScript
3. Call `cy.mockAuth()` and `cy.setupApiMocks()` in `beforeEach`
4. Run tests with Docker to verify
5. Ensure tests pass before committing

## References

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Docker Images](https://hub.docker.com/r/cypress/included)
- [Cypress GitHub Action](https://github.com/cypress-io/github-action)
