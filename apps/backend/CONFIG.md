# Configuration d'environnement

Ce projet utilise `node-config` pour gérer les configurations par environnement.

## Structure

```
config/
├── default.json      # Configuration de base (valeurs par défaut)
├── development.json  # Config pour npm start local
├── docker.json       # Config pour Docker Compose
.env.local           # Variables d'env locales (npm start) - GIT IGNORED
.env.docker          # Variables d'env Docker - GIT IGNORED
```

## Configuration locale (npm start)

1. **Copie le fichier exemple:**
```bash
cp apps/backend/.env.local.example apps/backend/.env.local
```

2. **Remplir les variables Google API:**
```env
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
GOOGLE_OAUTH_CLIENT_ID=YOUR_OAUTH_CLIENT_ID_HERE
GOOGLE_OAUTH_CLIENT_SECRET=YOUR_OAUTH_CLIENT_SECRET_HERE
DISABLE_AUTH_FOR_E2E=true
```

3. **Démarrer le backend avec MongoDB en Docker:**
```bash
# Terminal 1: MongoDB en Docker
docker compose -f compose.dev.yml up mongodb

# Terminal 2: Backend
cd apps/backend && npm start

# Terminal 3: Frontend
cd apps/frontend && npm run dev
```

## Configuration Docker Compose

1. **Copie le fichier exemple:**
```bash
cp apps/backend/.env.docker.example apps/backend/.env.docker
```

2. **Remplir les variables Google API:**
```env
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
GOOGLE_OAUTH_CLIENT_ID=YOUR_OAUTH_CLIENT_ID_HERE
GOOGLE_OAUTH_CLIENT_SECRET=YOUR_OAUTH_CLIENT_SECRET_HERE
DISABLE_AUTH_FOR_E2E=true
```

3. **Démarrer tout avec Docker Compose:**
```bash
docker compose -f compose.dev.yml up
```

## Hiérarchie des configurations

node-config charge les configurations dans cet ordre (dernière win):

1. `config/default.json` (base)
2. `config/{NODE_ENV}.json` (surcharge selon l'environnement)
3. Variables d'environnement depuis `.env.local` ou `.env.docker` (surcharge finale)

### NODE_ENV

- **`development`** (par défaut pour npm start) → charge `config/development.json`
  - MongoDB: `localhost:27017` (Docker)
  - Frontend: `http://localhost:5173`
  
- **`docker`** (pour Docker Compose) → charge `config/docker.json`
  - MongoDB: service `mongodb` via Docker network
  - Frontend: `http://localhost` (nginx)

## Variables sensibles (.gitignore)

Les fichiers suivants sont ignorés par Git (données sensibles):
- `.env.local` - Pour développement local
- `.env.docker` - Pour Docker Compose

Utilise les fichiers `.example` comme templates!

## Validation

Au démarrage, les configurations sont validées avec Joi. Si une variable requise manque, l'app refuse de démarrer avec un message d'erreur clair.
