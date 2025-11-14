# Frontend Nginx Proxy Configuration

## Overview

The frontend production Docker image includes an nginx reverse proxy that routes `/api/*` requests to the backend service. The backend URL is configurable via environment variable.

## Environment Variable

- **`BACKEND_URL`**: The full URL of the backend service (including protocol and port)
  - Default: `http://backend:3001`
  - Examples:
    - Local development: `http://backend:3001`
    - Cloud Run production: `https://rpggen-backend-469869562907.europe-west1.run.app`
    - Custom domain: `https://api.example.com`

## Configuration Examples

### Docker Compose (Local Development)

```yaml
services:
  frontend_prod:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    environment:
      - BACKEND_URL=http://backend:3001
    networks:
      - rpg-network
```

### Docker Run

```bash
docker run -d -p 80:80 \
  -e BACKEND_URL=https://rpggen-backend-469869562907.europe-west1.run.app \
  antoinesavajols/rpggen-front:latest
```

### Google Cloud Run

When deploying to Cloud Run, set the environment variable in the Cloud Run service configuration:

```bash
gcloud run deploy rpggen-frontend \
  --image antoinesavajols/rpggen-front:latest \
  --platform managed \
  --region europe-west1 \
  --set-env-vars BACKEND_URL=https://rpggen-backend-469869562907.europe-west1.run.app
```

Or via Cloud Console:
1. Go to Cloud Run service
2. Click "Edit & Deploy New Revision"
3. Go to "Variables & Secrets" tab
4. Add environment variable:
   - Name: `BACKEND_URL`
   - Value: `https://rpggen-backend-469869562907.europe-west1.run.app`

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rpggen-frontend
spec:
  template:
    spec:
      containers:
      - name: frontend
        image: antoinesavajols/rpggen-front:latest
        env:
        - name: BACKEND_URL
          value: "https://rpggen-backend-469869562907.europe-west1.run.app"
        ports:
        - containerPort: 80
```

## How It Works

1. The Dockerfile copies an nginx configuration template (`nginx.conf.template`)
2. At container startup, the `docker-entrypoint.sh` script:
   - Reads the `BACKEND_URL` environment variable
   - Substitutes it into the nginx template using `envsubst`
   - Generates the final `/etc/nginx/conf.d/default.conf`
   - Starts nginx

3. Nginx proxies requests:
   - `http://frontend/api/*` → `${BACKEND_URL}/*`
   - Example: `http://localhost/api/chat` → `http://backend:3001/chat`

## Proxy Features

- **Dynamic DNS resolution**: Uses DNS resolver to support dynamic backend URLs
- **WebSocket support**: Includes upgrade headers for WebSocket connections
- **Proper headers**: Forwards X-Real-IP, X-Forwarded-For, X-Forwarded-Proto
- **Timeouts**: 60-second timeouts for long-running requests
- **Security headers**: Includes SAMEORIGIN, nosniff, XSS protection

## Troubleshooting

### Check the generated nginx config

```bash
docker run --rm -e BACKEND_URL=http://your-backend:3001 \
  antoinesavajols/rpggen-front:latest
```

The startup logs will show the generated nginx configuration.

### Test the proxy

```bash
# Start container
docker run -d -p 8080:80 -e BACKEND_URL=http://backend:3001 --name test-frontend \
  antoinesavajols/rpggen-front:latest

# Test static files
curl http://localhost:8080/

# Test API proxy (will 502 if backend is not running, but proves proxy works)
curl -v http://localhost:8080/api/health

# Check logs
docker logs test-frontend

# Cleanup
docker stop test-frontend && docker rm test-frontend
```

## Development vs Production

- **Development** (Vite dev server):
  - Vite's built-in proxy handles `/api` → `http://backend:3001`
  - Configured in `frontend/vite.config.ts`
  - No nginx involved

- **Production** (nginx):
  - nginx reverse proxy handles `/api` → `${BACKEND_URL}`
  - Configured via environment variable
  - Docker image includes nginx + built static files
