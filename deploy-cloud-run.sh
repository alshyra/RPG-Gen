#!/bin/bash
# Deploy RPG-Gen to Google Cloud Run
# This script demonstrates how to deploy both frontend and backend to Cloud Run

set -e

# Configuration
PROJECT_ID="your-gcp-project-id"
REGION="europe-west1"
FRONTEND_SERVICE="rpggen-frontend"
BACKEND_SERVICE="rpggen-backend"

# Backend URL (will be auto-generated after backend deployment)
BACKEND_URL=""

echo "===== RPG-Gen Cloud Run Deployment ====="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "Setting project to: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"
echo ""

# Deploy Backend first
echo "Step 1: Deploying Backend..."
gcloud run deploy "$BACKEND_SERVICE" \
    --source ./backend \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --set-env-vars "NODE_ENV=production" \
    --quiet

echo "✓ Backend deployed"
echo ""

# Get backend URL
BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" \
    --platform managed \
    --region "$REGION" \
    --format 'value(status.url)')

echo "Backend URL: $BACKEND_URL"
echo ""

# Deploy Frontend with backend URL
echo "Step 2: Deploying Frontend with backend URL..."
gcloud run deploy "$FRONTEND_SERVICE" \
    --source . \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --set-env-vars "BACKEND_URL=$BACKEND_URL" \
    --quiet

echo "✓ Frontend deployed"
echo ""

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" \
    --platform managed \
    --region "$REGION" \
    --format 'value(status.url)')

echo "===== Deployment Complete! ====="
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL:  $BACKEND_URL"
echo ""
echo "You can now access your RPG-Gen application at:"
echo "$FRONTEND_URL"
echo ""
echo "To update the backend URL later, run:"
echo "gcloud run services update $FRONTEND_SERVICE --region $REGION --set-env-vars BACKEND_URL=$BACKEND_URL"
