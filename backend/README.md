# Backend — Notes

This backend reads configuration from environment variables. To test locally, create a `.env` file inside the `backend/` folder (do not commit it) and set at minimum your Google API key:

```env
# backend/.env
GOOGLE_API_KEY=AIza...your_api_key_here
```

Then install and start in dev:

```bash
cd backend
npm install
npm run start:dev
```

Swagger UI will be available at http://localhost:3001/docs

## Health endpoints (no authentication)

Two lightweight, unauthenticated endpoints are available to check server readiness:

- GET /health → { status: 'ok', pid, uptime, timestamp }

These are suitable for load balancer and Kubernetes readiness/liveness checks.
