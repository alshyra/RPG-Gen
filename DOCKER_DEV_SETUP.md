# Docker Development Setup

This document explains how to use the Docker Compose development environment for local development and testing.

## Prerequisites

- Docker Engine 20.10+ and Docker Compose v2+
- Node.js 25.2.0+ (for running tests locally)

## Quick Start

### 1. Start the Docker Stack

```bash
docker compose -f compose.dev.yml up -d
```

This will start three services:

- **MongoDB**: Database (port 27017)
- **Backend**: NestJS API server (port 3001)
- **Frontend**: Vue + Vite dev server (port 5173)

### 2. Wait for Services to Initialize

The first startup may take 2-3 minutes as npm packages are installed in the containers.

Check the status:

```bash
docker compose -f compose.dev.yml ps
```

View logs:

```bash
docker compose -f compose.dev.yml logs -f
```

### 3. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost/docs (Swagger UI)
- **MongoDB**: mongodb://rpgadmin:rpgpass123@localhost:27017/rpggen?authSource=admin

### 4. Run E2E Tests from Host

Once the Docker stack is running, you can run Cypress e2e tests from your local machine:

```bash
cd packages/frontend
npm run test:e2e
```

All 42 tests should pass successfully.

## Architecture

### Services

#### MongoDB

- Image: `mongo:7.0`
- Port: `27017:27017`
- Volumes: `mongodb_data`, `mongodb_config`
- Credentials: `rpgadmin` / `rpgpass123`

#### Backend

- Image: `node:25.2.0-alpine3.22`
- Port: `3001:3001`
- Working Directory: `/app/backend`
- Command: `npm install && npm run start:dev`
- Volumes:
  - `./packages/backend` → `/app/backend` (source code)
  - `./packages/shared` → `/app/shared` (shared types)
  - `backend_node_modules` → `/app/backend/node_modules` (dependencies)

#### Frontend

- Image: `node:25.2.0-alpine3.22`
- Port: `5173:5173`
- Working Directory: `/app/frontend`
- Command: `npm install && npm run dev`
- Volumes:
  - `./packages/frontend` → `/app/frontend` (source code)
  - `./packages/shared` → `/app/shared` (shared types)
  - `frontend_node_modules` → `/app/frontend/node_modules` (dependencies)

### Why Named Volumes for node_modules?

Named volumes for `node_modules` prevent conflicts between host and container dependencies, especially for native modules compiled for different architectures (e.g., ARM vs x86_64).

## Development Workflow

### 1. Code Changes

Make changes to files in `./packages/backend`, `./packages/frontend`, or `./packages/shared` directories. The dev servers will automatically reload.

### 2. Add Dependencies

To add npm packages, exec into the container:

```bash
# Backend
docker exec -it rpg-gen-backend sh
npm install <package-name>

# Frontend
docker exec -it rpg-gen-frontend sh
npm install <package-name>
```

### 3. View Logs

```bash
# All services
docker compose -f compose.dev.yml logs -f

# Specific service
docker compose -f compose.dev.yml logs -f backend
docker compose -f compose.dev.yml logs -f frontend
```

### 4. Restart Services

```bash
docker compose -f compose.dev.yml restart backend
docker compose -f compose.dev.yml restart frontend
```

### 5. Stop Everything

```bash
docker compose -f compose.dev.yml down
```

To also remove volumes:

```bash
docker compose -f compose.dev.yml down -v
```

## Running Tests

### E2E Tests (Cypress)

Tests run from the host machine against the Docker services:

```bash
cd packages/frontend
npm run test:e2e              # Headless mode
npm run test:e2e:open         # Interactive mode
```

### Component Tests (Cypress)

```bash
cd packages/frontend
npm run test:component        # Headless mode
npm run test:component:open   # Interactive mode
```

### Backend Unit Tests

```bash
docker exec rpg-gen-backend npm run test
```

### Frontend Unit Tests

```bash
docker exec rpg-gen-frontend npm run test
```

## Environment Variables

### Backend (.env file)

The backend requires a `.env` file in the `backend/` directory. A default file is created automatically with:

- `GOOGLE_API_KEY`: Replace with your actual Gemini API key
- `MONGODB_URI`: Pre-configured for Docker Compose
- OAuth credentials (optional)
- JWT secret (dev default provided)

### Frontend (vite.config.ts)

The frontend Vite server is configured to:

- Listen on `0.0.0.0:5173` (accessible from host)
- Proxy `/api` requests to `http://localhost:3001` (configurable via `BACKEND_URL` env var)

## Troubleshooting

### Services won't start

```bash
docker compose -f compose.dev.yml down -v
docker compose -f compose.dev.yml up -d
```

### Port already in use

Check if another process is using ports 5173, 3001, or 27017:

```bash
lsof -i :5173
lsof -i :3001
lsof -i :27017
```

### npm install taking too long

First startup installs all dependencies. Subsequent startups are faster because node_modules are persisted in Docker volumes.

### Tests fail with connection errors

Ensure the Docker stack is fully started and services are listening:

```bash
curl http://localhost:3001/docs
curl http://localhost:5173
```

### Cypress can't connect to services

Verify that:

1. Docker services are running: `docker compose -f compose.dev.yml ps`
2. Ports are exposed: `netstat -an | grep LISTEN | grep -E '5173|3001'`
3. Firewall allows connections to localhost ports

## CI/CD

The same Docker Compose setup can be used in CI/CD pipelines:

```yaml
- name: Start Docker services
  run: docker compose -f compose.dev.yml up -d

- name: Wait for services
  run: |
    timeout 120 sh -c 'until curl -s http://localhost:5173 > /dev/null; do sleep 2; done'
    timeout 120 sh -c 'until curl -s http://localhost:3001/docs > /dev/null; do sleep 2; done'

- name: Run e2e tests
  run: |
    cd packages/frontend
    npm run test:e2e
```

## Comparison: compose.dev.yml vs compose.yml

| Feature        | compose.dev.yml               | compose.yml            |
| -------------- | ----------------------------- | ---------------------- |
| Frontend       | Node dev server (Vite)        | Nginx production build |
| Backend        | Node dev server (ts-node-dev) | Production build       |
| Hot Reload     | Yes                           | No                     |
| Source Volumes | Yes                           | No                     |
| Port 5173      | Exposed                       | Not used               |
| Port 80        | Not used                      | Exposed                |
| Use Case       | Local development             | Production deployment  |

## Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Dev Server Configuration](https://vitejs.dev/config/server-options.html)
- [Cypress Configuration](https://docs.cypress.io/guides/references/configuration)
