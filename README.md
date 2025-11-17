# RPG-Gen

A role-playing game generator and interactive game master powered by Google Gemini AI.

## Features

- **Character Creation**: Create D&D 5e characters with race, class, ability scores, and skills
- **AI Game Master**: Interactive storytelling powered by Google Gemini
- **User Authentication**: Google OAuth 2.0 login
- **Character Management**: Save, load, and manage multiple characters
- **Dice Rolling**: Integrated dice rolling system with skill modifiers

## Project Structure

- **Frontend**: Vue 3 + TypeScript + Tailwind CSS (Vite dev server)
- **Backend**: NestJS + MongoDB + Google Gemini SDK
- **Shared**: Shared TypeScript types for frontend/backend

## Quick Start

### Local Development (Docker Compose)

See [DOCKER_DEV_SETUP.md](./DOCKER_DEV_SETUP.md) for detailed instructions.

```bash
# Start all services (MongoDB + Backend + Frontend)
docker compose -f compose.dev.yml up -d

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3001/docs
```

### Manual Setup

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Google Cloud Run.

**Key Points**:
- Configure all required GitHub Secrets (see DEPLOYMENT.md)
- Set `FRONTEND_URL` secret to your actual Cloud Run URL to prevent OAuth redirect issues


## Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Cloud Run deployment and GitHub Secrets configuration
- [Docker Development Setup](./DOCKER_DEV_SETUP.md) - Local development with Docker Compose
- [Copilot Instructions](./.github/copilot-instructions.md) - Development guidelines for contributors

## License

[Add your license here]
