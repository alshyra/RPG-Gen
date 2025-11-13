# Quick Reference Guide

## Local Development Commands

### MongoDB
```bash
# Start MongoDB
docker-compose up -d mongodb

# Stop MongoDB
docker-compose down

# View MongoDB logs
docker-compose logs mongodb

# Connect to MongoDB shell
docker exec -it rpg-gen-mongodb mongosh -u rpgadmin -p rpgpass123 --authenticationDatabase admin
```

### Backend
```bash
cd backend

# Install dependencies
npm install

# Development mode (hot reload)
npm run start:dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Run Cypress E2E tests
npm run test:e2e

# Open Cypress UI
npm run test:e2e:open
```

### Full Stack with Docker Compose

**Development Mode (with hot-reload):**
```bash
# Start everything (MongoDB + Backend + Frontend with hot-reload)
docker-compose -f docker-compose.dev.yml up --build

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# Stop all services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Rebuild and restart
docker-compose -f docker-compose.dev.yml up --build --force-recreate
```

**Production Mode (with nginx):**
```bash
# Start everything (MongoDB + Backend + Frontend with nginx)
docker-compose up --build

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose up --build --force-recreate
```

## Environment Setup

### Required Environment Variables

Create `backend/.env`:
```env
GOOGLE_API_KEY=your_gemini_api_key
MONGODB_URI=mongodb://rpgadmin:rpgpass123@localhost:27017/rpggen?authSource=admin
GOOGLE_OAUTH_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/profile` - Get user profile (requires auth)
- `GET /api/auth/logout` - Logout

### Characters (All require authentication)
- `GET /api/characters` - List all characters
- `GET /api/characters/:id` - Get character by ID
- `POST /api/characters` - Create character
- `PUT /api/characters/:id` - Update character
- `DELETE /api/characters/:id` - Delete character
- `POST /api/characters/:id/kill` - Mark as deceased
- `GET /api/characters/deceased` - List deceased characters

### Chat (Requires authentication)
- `POST /api/chat` - Send message
- `GET /api/chat/history?sessionId=:id` - Get conversation history

### Other
- `GET /api/docs` - Swagger API documentation

## Heroku Commands

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set GOOGLE_API_KEY=your_key
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set GOOGLE_OAUTH_CLIENT_ID=your_client_id
heroku config:set GOOGLE_OAUTH_CLIENT_SECRET=your_secret
heroku config:set JWT_SECRET=your_secret
heroku config:set FRONTEND_URL=https://your-app.herokuapp.com
heroku config:set NODE_ENV=production

# View config
heroku config

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Open app
heroku open

# Restart app
heroku restart
```

## MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com/
2. Create account / Sign in
3. Create new cluster (M0 Free tier)
4. Database Access → Add user
5. Network Access → Add IP (0.0.0.0/0 for Heroku)
6. Connect → Connect your application
7. Copy connection string
8. Replace `<password>` with your password

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/rpggen?retryWrites=true&w=majority
```

## Google OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create project or select existing
3. APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/google/callback` (local)
   - `https://your-app.herokuapp.com/api/auth/google/callback` (production)
6. Copy Client ID and Client Secret

## Troubleshooting

### MongoDB won't start
```bash
# Check if port 27017 is in use
lsof -i :27017

# Remove old containers
docker-compose down -v

# Restart
docker-compose up -d mongodb
```

### Backend won't connect to MongoDB
- Check MONGODB_URI in `.env`
- Ensure MongoDB is running: `docker-compose ps`
- Check backend logs for connection errors

### Frontend can't reach backend
- Check backend is running on port 3001
- Verify CORS settings in `backend/src/main.ts`
- Check browser console for CORS errors

### OAuth not working
- Verify redirect URI matches exactly in Google Console
- Check callback URL in `.env`
- Clear browser cookies and try again

### JWT token expired
- Default expiry is 7 days
- Logout and login again to get new token

## Useful MongoDB Queries

```javascript
// Connect to MongoDB shell
docker exec -it rpg-gen-mongodb mongosh -u rpgadmin -p rpgpass123 --authenticationDatabase admin

// Switch to database
use rpggen

// List all users
db.users.find().pretty()

// List all characters
db.characters.find().pretty()

// List all chat histories
db.chathistories.find().pretty()

// Count documents
db.users.countDocuments()
db.characters.countDocuments()

// Find character by name
db.characters.find({ name: "Hero" })

// Delete test data
db.characters.deleteMany({})
db.chathistories.deleteMany({})
```

## Port Usage

**Development Mode:**
- Frontend: http://localhost:5173 (Vite dev server)
- Backend API: http://localhost:3001/api
- Swagger Docs: http://localhost:3001/docs
- MongoDB: localhost:27017

**Production Mode (Docker):**
- Frontend: http://localhost:80 (nginx)
- Backend API: http://localhost:3001/api
- Swagger Docs: http://localhost:3001/docs
- MongoDB: localhost:27017

## Common Issues

**"Cannot find module"**
→ Run `npm install` in the appropriate directory

**"Port already in use"**
→ Kill the process using the port or change port in config

**"Unauthorized"**
→ Check JWT token, logout and login again

**"MongoDB connection failed"**
→ Ensure MongoDB is running with `docker-compose ps`

**"Google OAuth error"**
→ Check redirect URI matches in Google Console

## Best Practices

- Never commit `.env` files
- Use strong JWT secrets in production
- Keep dependencies updated
- Run tests before committing
- Use meaningful commit messages
- Follow TypeScript strict mode

## Support

- Documentation: See `SETUP.md` and `MIGRATION_SUMMARY.md`
- API Docs: http://localhost:3001/docs
- Issues: https://github.com/alshyra/RPG-Gen/issues
