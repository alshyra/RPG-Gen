# RPG-Gen Docker Deployment

This document describes how to use the Docker images published to Docker Hub.

## Available Docker Images

The project publishes two Docker images to Docker Hub under the repository `antoinesavajols/rpggen`:

### Backend Image
- **Repository**: `antoinesavajols/rpggen`
- **Tags**:
  - `backend-latest` - Latest build from main branch
  - `backend-main` - Latest main branch build
  - `backend-develop` - Latest develop branch build
  - `backend-<sha>` - Specific commit (e.g., `backend-abc1234`)
  - `backend-<version>` - Semantic version (e.g., `backend-0.1.0`)

### Frontend Image
- **Repository**: `antoinesavajols/rpggen`
- **Tags**:
  - `frontend-latest` - Latest build from main branch
  - `frontend-main` - Latest main branch build
  - `frontend-develop` - Latest develop branch build
  - `frontend-<sha>` - Specific commit (e.g., `frontend-abc1234`)
  - `frontend-<version>` - Semantic version (e.g., `frontend-0.1.0`)

## Usage

### Using Docker Compose

Update your `compose.yml` to use the published images:

```yaml
services:
  backend:
    image: antoinesavajols/rpggen:backend-latest
    container_name: rpg-gen-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://rpgadmin:rpgpass123@mongodb:27017/rpggen?authSource=admin
    env_file:
      - backend/.env
    ports:
      - "3001:3001"
    depends_on:
      - mongodb

  frontend:
    image: antoinesavajols/rpggen:frontend-latest
    container_name: rpg-gen-frontend
    restart: unless-stopped
    ports:
      - "80:80"
```

### Using Docker CLI

#### Pull and run backend:
```bash
docker pull antoinesavajols/rpggen:backend-latest
docker run -d -p 3001:3001 --env-file backend/.env antoinesavajols/rpggen:backend-latest
```

#### Pull and run frontend:
```bash
docker pull antoinesavajols/rpggen:frontend-latest
docker run -d -p 80:80 antoinesavajols/rpggen:frontend-latest
```

## CI/CD Pipeline

Images are automatically built and pushed to Docker Hub when:
- Code is pushed to `main` or `develop` branches
- A version tag (e.g., `v1.0.0`) is created
- Manual workflow dispatch is triggered

### Required Secrets

The GitHub Actions workflow requires the following secrets to be configured in the repository:
- `DOCKERHUB_USERNAME` - Your Docker Hub username
- `DOCKERHUB_TOKEN` - Your Docker Hub access token (not password)

To create a Docker Hub access token:
1. Log in to [Docker Hub](https://hub.docker.com/)
2. Go to Account Settings → Security → Access Tokens
3. Click "New Access Token"
4. Give it a description (e.g., "GitHub Actions RPG-Gen")
5. Copy the token and add it to GitHub repository secrets

### Workflow Details

The workflow performs the following:
- **On Pull Requests**: Only tests that images build successfully (no push)
- **On Push to main/develop**: Builds and pushes images with appropriate tags
- **On Version Tags**: Builds and pushes with semantic version tags

## Development

### Building Images Locally

#### Backend:
```bash
docker build -f Dockerfile.backend -t antoinesavajols/rpggen:backend-local .
```

#### Frontend:
```bash
docker build -f Dockerfile.frontend -t antoinesavajols/rpggen:frontend-local .
```

### Pushing Images Manually

If you need to push images manually:

```bash
# Log in to Docker Hub
docker login

# Tag your image
docker tag antoinesavajols/rpggen:backend-local antoinesavajols/rpggen:backend-<tagname>

# Push to Docker Hub
docker push antoinesavajols/rpggen:backend-<tagname>
```

## Troubleshooting

### Authentication Issues
If you encounter authentication errors:
1. Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` are correctly set in GitHub Secrets
2. Ensure the access token has write permissions
3. Check that the token hasn't expired

### Build Failures
If builds fail:
1. Check the GitHub Actions logs for specific error messages
2. Verify Dockerfiles are valid
3. Test building locally using the commands above

### Image Size Optimization
The images use:
- Multi-stage builds for the frontend (reduces size)
- Alpine Linux base images (minimal footprint)
- Build caching to speed up subsequent builds
