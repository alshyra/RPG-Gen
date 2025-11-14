# Quick Start Guide - Docker Hub Integration

## Overview
This repository now automatically builds and pushes Docker images to Docker Hub.

## Docker Images
- **Backend**: `antoinesavajols/rpggen-back`
- **Frontend**: `antoinesavajols/rpggen-front`

## Quick Commands

### Pull and Run Latest Images
```bash
# Backend
docker pull antoinesavajols/rpggen-back:latest
docker run -d -p 3001:3001 --env-file backend/.env antoinesavajols/rpggen-back:latest

# Frontend
docker run -d -p 80:80 antoinesavajols/rpggen-front:latest
```

### Using Docker Compose
```bash
# Update compose.yml to use published images
docker compose up -d
```

## Setup Required

Before images can be pushed, configure GitHub secrets:

1. **DOCKERHUB_USERNAME** - Your Docker Hub username
2. **DOCKERHUB_TOKEN** - Docker Hub access token

📖 See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed setup instructions.

## When Images Are Built

✅ **Push to main** → Creates `latest` tag  
✅ **Push to develop** → Creates `develop` tag  
✅ **Version tag** (v1.0.0) → Creates `1.0.0`, `1.0` tags  
✅ **Any push** → Creates `<sha>` tag  
✅ **Manual trigger** → Via GitHub Actions UI  

❌ **Pull requests** → Only test build (no push)

## Available Tags

| Event | Backend Tag | Frontend Tag |
|-------|-------------|--------------|
| Push to main | `rpggen-back:latest` | `rpggen-front:latest` |
| Push to develop | `rpggen-back:develop` | `rpggen-front:develop` |
| Tag v1.2.3 | `rpggen-back:1.2.3` | `rpggen-front:1.2.3` |
| Any commit | `rpggen-back:abc1234` | `rpggen-front:abc1234` |

## Dockerfile Changes

Both Dockerfiles have been optimized:
- ✅ Multi-stage builds for smaller images
- ✅ Node 20 Alpine (stable, minimal)
- ✅ Production dependencies only in final image
- ✅ Layer caching for faster builds
- ✅ Build cache persisted in Docker Hub

## Documentation

- [DOCKER.md](DOCKER.md) - Complete usage guide
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Setup instructions
- [.github/workflows/docker-publish.yml](.github/workflows/docker-publish.yml) - CI/CD workflow

## Monitoring

Check build status:
1. Go to **Actions** tab in GitHub
2. Look for "Build and Push Docker Images" workflow
3. View logs for any failures

## Next Steps

1. ✅ Configure GitHub secrets (DOCKERHUB_USERNAME, DOCKERHUB_TOKEN)
2. ✅ Push this branch to trigger first build
3. ✅ Verify images on Docker Hub
4. ✅ Update production deployments to use new images

---

**Need Help?** See [DOCKER_SETUP.md](DOCKER_SETUP.md) for troubleshooting.
