# RPG-Gen

AI-powered RPG game engine with character management and narrative generation.

## Architecture

- **Frontend**: Vue 3 + TypeScript + Tailwind CSS (Vite)
- **Backend**: NestJS + Google Gemini API + MongoDB
- **Deployment**: Docker + Google Cloud Run

## Quick Start

### Development

1. **Backend**:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run start:dev
```

2. **Frontend**:
```bash
cd frontend
npm install
npm run dev
```

### Production (Docker)

```bash
# Using docker-compose
docker compose up frontend_prod backend mongodb

# Or build individual images
docker build -f Dockerfile.backend -t rpggen-backend .
docker build -f Dockerfile.frontend -t rpggen-frontend .
```

## Frontend Nginx Proxy

The production frontend image includes nginx with API proxy support. Configure the backend URL via environment variable:

```bash
docker run -p 80:80 -e BACKEND_URL=https://your-backend-url.com rpggen-frontend
```

**Supported configurations:**
- **Local development**: `BACKEND_URL=http://backend:3001`
- **Cloud Run production**: `BACKEND_URL=https://rpggen-backend-469869562907.europe-west1.run.app`
- **Custom domain**: `BACKEND_URL=https://api.yourdomain.com`

See [frontend/NGINX_PROXY.md](frontend/NGINX_PROXY.md) for detailed configuration guide.

## Deployment to Google Cloud Run

### Option 1: Using the deployment script

```bash
# Edit deploy-cloud-run.sh with your project ID
./deploy-cloud-run.sh
```

### Option 2: Manual deployment

**Deploy Backend:**
```bash
gcloud run deploy rpggen-backend \
  --image antoinesavajols/rpggen-back:latest \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,MONGODB_URI=your-mongodb-uri
```

**Deploy Frontend:**
```bash
# Get the backend URL first
BACKEND_URL=$(gcloud run services describe rpggen-backend --region europe-west1 --format 'value(status.url)')

# Deploy frontend with backend URL
gcloud run deploy rpggen-frontend \
  --image antoinesavajols/rpggen-front:latest \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars BACKEND_URL=$BACKEND_URL
```

## Environment Variables

### Backend (.env)
```bash
GOOGLE_API_KEY=your-google-api-key
MONGODB_URI=mongodb://...
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
JWT_SECRET=...
FRONTEND_URL=https://your-frontend-url.com
```

### Frontend (Nginx Proxy)
```bash
BACKEND_URL=https://your-backend-url.com
```

## Testing

### Frontend
```bash
cd frontend
npm run test           # Unit tests
npm run test:e2e      # End-to-end tests
npm run lint          # Linting + type check
```

### Backend
```bash
cd backend
npm run test          # Unit tests
npm run lint          # Linting
```

## Project Structure

```
.
├── frontend/           # Vue 3 frontend
│   ├── src/           # Source code
│   ├── nginx.conf.template  # Nginx config for production
│   └── docker-entrypoint.sh # Container startup script
├── backend/           # NestJS backend
│   └── src/          # Source code
├── shared/           # Shared TypeScript types
├── Dockerfile.frontend   # Frontend production image
├── Dockerfile.backend    # Backend production image
└── compose.yml       # Docker Compose configuration
```

## Documentation

- [Frontend Nginx Proxy Configuration](frontend/NGINX_PROXY.md) - Detailed proxy setup guide
- [Copilot Instructions](.github/copilot-instructions.md) - Development guidelines

## License

[Add your license here]
