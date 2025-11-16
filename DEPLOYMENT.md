# Deployment Guide

This document explains how to deploy RPG-Gen to Google Cloud Run.

## Prerequisites

- Google Cloud Project with Cloud Run API enabled
- gcloud CLI installed and authenticated
- Docker Hub account (for CI/CD pipeline)
- GitHub repository with appropriate secrets configured

## GitHub Secrets Configuration

For automated deployment via GitHub Actions, configure the following secrets in your repository settings:

### Required Secrets

1. **`GCP_PROJECT_ID`**: Your Google Cloud Project ID
   - Example: `my-project-12345`

2. **`WIF_PROVIDER`**: Workload Identity Federation provider
   - Format: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_NAME/providers/PROVIDER_NAME`

3. **`WIF_SERVICE_ACCOUNT`**: Service account email for Workload Identity Federation
   - Format: `SERVICE_ACCOUNT_NAME@PROJECT_ID.iam.gserviceaccount.com`

4. **`DOCKERHUB_USERNAME`**: Docker Hub username for image registry

5. **`DOCKERHUB_TOKEN`**: Docker Hub access token

6. **`FRONTEND_URL`**: Production frontend URL (important for OAuth redirects)
   - Example: `https://rpggen-469869562907.europe-west1.run.app`
   - **Note**: This must match your actual Cloud Run service URL to prevent OAuth redirect issues

7. **`MONGODB_URI`**: MongoDB connection string
   - Format: `mongodb://username:password@host:port/database?authSource=admin`

8. **`GOOGLE_API_KEY`**: Google Gemini API key
   - Obtain from: https://makersuite.google.com/app/apikey

9. **`GOOGLE_OAUTH_CLIENT_ID`**: Google OAuth 2.0 Client ID
   - Obtain from: https://console.cloud.google.com/apis/credentials

10. **`GOOGLE_OAUTH_CLIENT_SECRET`**: Google OAuth 2.0 Client Secret

11. **`JWT_SECRET`**: Secret key for JWT token generation
    - Generate a secure random string (e.g., using `openssl rand -base64 32`)

### Google OAuth Configuration

**Important**: After setting up your Google OAuth credentials, you must configure the authorized redirect URIs in the Google Cloud Console:

1. Go to [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add the following to "Authorized redirect URIs":
   - `https://YOUR-CLOUD-RUN-URL/api/auth/google/callback`
   - Example: `https://rpggen-469869562907.europe-west1.run.app/api/auth/google/callback`

**Note**: The `FRONTEND_URL` secret must exactly match the base URL in your authorized redirect URIs to prevent "redirect to localhost" issues in production.

## Manual Deployment Script

For manual deployment, use the provided script:

```bash
./deploy-cloud-run.sh
```

Before running, edit the script to set:
- `PROJECT_ID`: Your GCP project ID
- `REGION`: Deployment region (default: europe-west1)
- `FRONTEND_SERVICE`: Frontend service name (default: rpggen-frontend)
- `BACKEND_SERVICE`: Backend service name (default: rpggen-backend)

The script will:
1. Deploy the backend service with `--allow-unauthenticated`
2. Get the backend URL
3. Deploy the frontend service with backend URL configured
4. Display both service URLs

## Automated Deployment (GitHub Actions)

The repository includes a GitHub Actions workflow (`.github/workflows/build-and-deploy.yml`) that:

1. **On push to main** or **tag creation**:
   - Builds Docker images for frontend and backend
   - Pushes images to Docker Hub with version tags
   - Creates/updates GCP Secrets
   - Deploys to Cloud Run with `--allow-unauthenticated` flag
   - Configures proper ingress policy for public access

2. **On pull requests**:
   - Tests Docker image builds without deploying

## Cloud Run Service Configuration

The service is configured in `k8s/cloud-run-service.yaml` with:

- **Multi-container deployment**: Frontend (nginx) + Backend (Node.js) in one service
- **Auto-scaling**: Min 0, Max 1 instance
- **Public access**: Ingress policy set to "all"
- **Environment variables**: Injected from GitHub Secrets
- **Service account**: Uses github-sa for GCP API access

## Updating the Deployment

### Update Backend URL
```bash
gcloud run services update rpggen-frontend \
  --region europe-west1 \
  --set-env-vars BACKEND_URL=https://new-backend-url \
  --allow-unauthenticated
```

### Update Environment Variables
Edit `k8s/cloud-run-service.yaml` and redeploy:
```bash
gcloud run services replace k8s/cloud-run-service.yaml \
  --region europe-west1 \
  --project YOUR_PROJECT_ID \
  --allow-unauthenticated
```

**Important**: Always include the `--allow-unauthenticated` flag when updating services to maintain public access.

## Troubleshooting

### Issue: Google OAuth redirects to localhost in production

**Cause**: The `FRONTEND_URL` GitHub Secret is not set or doesn't match the actual Cloud Run service URL.

**Solution**:
1. Get your Cloud Run service URL:
   ```bash
   gcloud run services describe rpggen --region europe-west1 --format='value(status.url)'
   ```
2. Update the `FRONTEND_URL` GitHub Secret with this exact URL
3. Update the authorized redirect URI in Google Cloud Console to match
4. Redeploy the application

### Issue: Service requires authentication after deployment

**Cause**: The `--allow-unauthenticated` flag was not used during deployment.

**Solution**:
```bash
gcloud run services update rpggen \
  --region europe-west1 \
  --allow-unauthenticated
```

Or use the IAM policy:
```bash
gcloud run services add-iam-policy-binding rpggen \
  --region europe-west1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### Issue: Service fails to start

Check the logs:
```bash
gcloud run services logs read rpggen --region europe-west1 --limit=50
```

Common issues:
- Missing or incorrect environment variables
- Invalid secrets references
- MongoDB connection failures
- Invalid Google API keys

## Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Workload Identity Federation Setup](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
