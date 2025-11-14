# Docker Hub Setup Instructions

This document explains how to configure GitHub secrets for automatic Docker Hub image publishing.

## Prerequisites

1. A Docker Hub account
2. GitHub repository admin access

## Step 1: Create Docker Hub Access Token

1. Log in to [Docker Hub](https://hub.docker.com/)
2. Click on your username in the top right corner
3. Select **Account Settings**
4. Navigate to **Security** tab
5. Click **New Access Token**
6. Provide a description: `GitHub Actions RPG-Gen`
7. Select **Read, Write, Delete** permissions
8. Click **Generate**
9. **Important**: Copy the token immediately - you won't be able to see it again!

## Step 2: Create GitHub Secrets

1. Go to your GitHub repository: `https://github.com/alshyra/RPG-Gen`
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Add DOCKERHUB_USERNAME:
- Name: `DOCKERHUB_USERNAME`
- Value: Your Docker Hub username (e.g., `antoinesavajols`)
- Click **Add secret**

### Add DOCKERHUB_TOKEN:
- Click **New repository secret** again
- Name: `DOCKERHUB_TOKEN`
- Value: Paste the access token you copied from Docker Hub
- Click **Add secret**

## Step 3: Create Docker Hub Repositories (Optional)

Docker Hub will automatically create repositories when you first push, but you can create them manually:

1. Go to [Docker Hub](https://hub.docker.com/)
2. Click **Create Repository**
3. Create two repositories:
   - Repository name: `rpggen-back`
   - Repository name: `rpggen-front`
4. Set visibility (Public or Private) as desired

## Step 4: Verify Setup

Once the secrets are configured:

1. Push this branch to trigger the workflow
2. Go to **Actions** tab in GitHub
3. Watch the "Build and Push Docker Images" workflow run
4. After successful completion, images will be available at:
   - `antoinesavajols/rpggen-back:latest`
   - `antoinesavajols/rpggen-front:latest`

## Triggering Image Builds

Images are automatically built and pushed when:

- **Push to `main` branch**: Creates `latest` tag
- **Push to `develop` branch**: Creates `develop` tag
- **Create version tag** (e.g., `v1.0.0`): Creates version tags (`1.0.0`, `1.0`)
- **Manual trigger**: Use "Run workflow" button in Actions tab

## Testing Without Pushing

Pull requests will test Docker builds without pushing to Docker Hub, ensuring images build successfully before merging.

## Troubleshooting

### Authentication Failed
- Verify `DOCKERHUB_USERNAME` matches your exact Docker Hub username
- Ensure `DOCKERHUB_TOKEN` is a valid access token (not your password)
- Check if the token has expired or been revoked

### Build Failed
- Check the GitHub Actions logs for specific errors
- Verify Dockerfiles are valid by building locally
- Ensure all dependencies are properly defined in package.json

### Rate Limit Errors
- Docker Hub has pull rate limits for anonymous users
- Authenticated users have higher limits (200 pulls per 6 hours for free accounts)
- Consider upgrading to Docker Hub Pro for unlimited pulls

## Image Tags Reference

### Backend Image: `antoinesavajols/rpggen-back`
| Tag | When Created | Example |
|-----|--------------|---------|
| `latest` | Push to main | `antoinesavajols/rpggen-back:latest` |
| `<branch>` | Push to any branch | `antoinesavajols/rpggen-back:develop` |
| `<sha>` | Every push | `antoinesavajols/rpggen-back:abc1234` |
| `<version>` | Version tag (v1.0.0) | `antoinesavajols/rpggen-back:1.0.0` |
| `<major>.<minor>` | Version tag | `antoinesavajols/rpggen-back:1.0` |

### Frontend Image: `antoinesavajols/rpggen-front`
| Tag | When Created | Example |
|-----|--------------|---------|
| `latest` | Push to main | `antoinesavajols/rpggen-front:latest` |
| `<branch>` | Push to any branch | `antoinesavajols/rpggen-front:develop` |
| `<sha>` | Every push | `antoinesavajols/rpggen-front:abc1234` |
| `<version>` | Version tag (v1.0.0) | `antoinesavajols/rpggen-front:1.0.0` |
| `<major>.<minor>` | Version tag | `antoinesavajols/rpggen-front:1.0` |

## Security Best Practices

1. **Never commit Docker Hub credentials** to the repository
2. **Use access tokens** instead of passwords
3. **Rotate tokens periodically** for enhanced security
4. **Limit token permissions** to only what's needed (Read, Write, Delete)
5. **Revoke tokens** that are no longer in use
6. **Monitor Docker Hub activity** for unauthorized access

## Additional Resources

- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
