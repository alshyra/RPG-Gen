# RPG Gemini - MongoDB & OAuth Setup Guide

## Overview

This project has been migrated to use MongoDB for persistence and Google OAuth for authentication. This guide explains how to set up the project locally and deploy it to Heroku.

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for MongoDB)
- Google OAuth credentials (for authentication)
- Google Gemini API key (for AI features)

### Step 1: Clone the Repository

```bash
git clone https://github.com/alshyra/RPG-Gen.git
cd RPG-Gen
```

### Step 2: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen if not already done
6. For application type, select "Web application"
7. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/google/callback` (local development)
   - `https://your-app.herokuapp.com/api/auth/google/callback` (production)
8. Save and note down your Client ID and Client Secret

### Step 3: Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set these variables:

```env
# Google Gemini API (required)
GOOGLE_API_KEY=your_gemini_api_key_here

# MongoDB (already configured for docker-compose)
MONGODB_URI=mongodb://rpgadmin:rpgpass123@localhost:27017/rpggen?authSource=admin

# Google OAuth (required)
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 4: Start MongoDB with Docker Compose

From the project root:

```bash
docker-compose up -d mongodb
```

This will start a MongoDB instance on port 27017.

### Step 5: Install Dependencies and Start Services

**Backend:**

```bash
cd backend
npm install
npm run start:dev
```

Backend will run on http://localhost:3001

**Frontend (in a new terminal):**

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on http://localhost:5173

### Step 6: Access the Application

1. Open http://localhost:5173 in your browser
2. You'll be redirected to the login page
3. Click "Se connecter avec Google"
4. Authorize the application
5. You'll be redirected back and logged in!

## Docker Compose Full Stack (Alternative)

You can also run the entire stack (MongoDB + Backend + Frontend) with Docker Compose:

```bash
# Make sure your backend/.env is configured
docker-compose up --build
```

This will start:
- MongoDB on port 27017
- Backend on port 3001
- Frontend on port 5173

## Heroku Deployment

### Prerequisites

- Heroku CLI installed
- Heroku account
- MongoDB Atlas account (for free MongoDB hosting)

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 Sandbox)
3. Create a database user
4. Whitelist all IPs (0.0.0.0/0) for Heroku access
5. Get your connection string (looks like `mongodb+srv://user:pass@cluster.mongodb.net/rpggen`)

### Step 2: Create Heroku App

```bash
heroku create your-rpg-gen-app
```

### Step 3: Set Heroku Environment Variables

```bash
heroku config:set GOOGLE_API_KEY=your_gemini_api_key
heroku config:set MONGODB_URI=your_mongodb_atlas_connection_string
heroku config:set GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
heroku config:set GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
heroku config:set GOOGLE_OAUTH_CALLBACK_URL=https://your-rpg-gen-app.herokuapp.com/api/auth/google/callback
heroku config:set JWT_SECRET=your-super-secret-jwt-key
heroku config:set FRONTEND_URL=https://your-rpg-gen-app.herokuapp.com
heroku config:set NODE_ENV=production
```

### Step 4: Update Google OAuth Redirect URI

Go back to Google Cloud Console and add your Heroku callback URL to authorized redirect URIs:
- `https://your-rpg-gen-app.herokuapp.com/api/auth/google/callback`

### Step 5: Create Procfile

Create a `Procfile` in the project root:

```
web: cd backend && npm run build && npm start
```

### Step 6: Deploy to Heroku

```bash
git add .
git commit -m "Configure for Heroku deployment"
git push heroku main
```

### Step 7: Open Your App

```bash
heroku open
```

## API Documentation

Once the backend is running, access the Swagger API documentation at:
- Local: http://localhost:3001/docs
- Heroku: https://your-app.herokuapp.com/docs

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running: `docker-compose ps`
- Check logs: `docker-compose logs mongodb`
- Verify connection string in `.env`

### OAuth Not Working

- Verify your Google OAuth credentials
- Check that redirect URIs match exactly in Google Console
- Clear browser cookies and try again

### JWT Token Issues

- Tokens expire after 7 days by default
- If you get 401 errors, log out and log back in
- Check that JWT_SECRET is set consistently

## Migration from Old localStorage System

For users with existing characters in localStorage:

1. Characters will no longer be available after login (they're in localStorage, not the database)
2. You'll need to recreate your characters
3. The old character data can be exported from localStorage before migration:
   - Open browser DevTools → Application → Local Storage
   - Find `rpg-characters` key and copy the JSON
   - Save it as a backup

A future update may include an import tool for old characters.

## Architecture

### Backend Stack
- NestJS (Node.js framework)
- MongoDB with Mongoose ODM
- Passport.js for OAuth
- JWT for session management
- Google Gemini AI for game narration

### Frontend Stack
- Vue 3 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Axios for API communication
- Vue Router with auth guards

### Database Schema

**Users:**
- googleId (unique)
- email
- displayName, firstName, lastName
- picture
- lastLogin

**Characters:**
- userId (ref to User)
- characterId (UUID for client compatibility)
- name, race, class, level, etc.
- isDeceased flag

**ChatHistory:**
- userId (ref to User)
- sessionId (character UUID)
- messages array

## Development Tips

- Backend uses NestJS CLI for code generation
- Frontend uses composables pattern for state management
- All API endpoints require JWT authentication except `/auth/*`
- Character UUID is used as chat session ID for conversation history

## Support

For issues or questions, please open an issue on GitHub.
