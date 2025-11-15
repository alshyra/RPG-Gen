#!/bin/bash

# POC Setup Script for AdonisJS Migration
# This script demonstrates the commands needed to setup a minimal POC

set -e

echo "========================================"
echo "AdonisJS + Inertia POC Setup"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Create AdonisJS project${NC}"
echo "Command: npm init adonisjs@latest adonis-rpg-poc -- --kit=web --auth-guard=session"
echo ""

echo -e "${BLUE}Step 2: Install dependencies${NC}"
echo "cd adonis-rpg-poc"
echo "npm install @adonisjs/inertia @adonisjs/lucid @adonisjs/ally"
echo "npm install vue@3 @vitejs/plugin-vue @inertiajs/vue3"
echo ""

echo -e "${BLUE}Step 3: Configure packages${NC}"
echo "node ace configure @adonisjs/inertia"
echo "node ace configure @adonisjs/lucid"
echo "node ace configure @adonisjs/ally"
echo ""

echo -e "${BLUE}Step 4: Setup PostgreSQL (Docker)${NC}"
echo "docker run -d -p 5432:5432 --name rpg-poc-db \\"
echo "  -e POSTGRES_USER=postgres \\"
echo "  -e POSTGRES_PASSWORD=secret \\"
echo "  -e POSTGRES_DB=rpg_poc \\"
echo "  postgres:16"
echo ""

echo -e "${BLUE}Step 5: Create .env file${NC}"
echo "Copy .env.example to .env and configure:"
echo "  DB_CONNECTION=postgres"
echo "  DB_HOST=127.0.0.1"
echo "  DB_PORT=5432"
echo "  DB_USER=postgres"
echo "  DB_PASSWORD=secret"
echo "  DB_DATABASE=rpg_poc"
echo ""
echo "  GOOGLE_CLIENT_ID=your-client-id"
echo "  GOOGLE_CLIENT_SECRET=your-client-secret"
echo ""

echo -e "${BLUE}Step 6: Run migrations${NC}"
echo "node ace migration:run"
echo ""

echo -e "${BLUE}Step 7: Start dev server${NC}"
echo "npm run dev"
echo "Server will be available at http://localhost:3333"
echo ""

echo -e "${GREEN}========================================"
echo "POC Setup Commands Ready!"
echo "========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Copy examples from poc-adonis/examples/ to your AdonisJS project"
echo "2. Adapt imports and paths"
echo "3. Test authentication flow"
echo "4. Validate Inertia + Vue 3 compatibility"
echo ""
echo "Estimated time: 3-5 days"
