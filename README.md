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
cd packages/backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run start:dev
```

**Frontend:**

```bash
cd packages/frontend
npm install
npm run dev
```

## Monorepo (NPM Workspaces)

This repository uses NPM workspaces at the root. You can install and manage dependencies for all packages (backend, frontend, shared) from the root and run scripts across workspaces.

Install dependencies for all workspaces:

```bash
npm install
```

Run backend and frontend concurrently (requires `concurrently`):

```bash
npm run start:dev
```

Run tests for backend and frontend from root:

```bash
npm test
```

If you only need to operate within a single package, navigate to its folder and run the usual commands (for example `cd packages/backend` and `npm run start:dev`).

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
