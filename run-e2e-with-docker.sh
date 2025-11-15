#!/bin/bash
set -e

echo "===== Running E2E Tests with Production Docker Images ====="
echo ""

# Create a minimal backend .env file for testing
echo "Creating backend .env file for testing..."
cat > backend/.env << 'EOF'
# Test environment configuration
GOOGLE_API_KEY=${GOOGLE_API_KEY:-test-key-will-be-mocked}
MONGODB_URI=mongodb://rpgadmin:rpgpass123@mongodb:27017/rpggen?authSource=admin
NODE_ENV=production
GOOGLE_OAUTH_CLIENT_ID=test-client-id
GOOGLE_OAUTH_CLIENT_SECRET=test-client-secret
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:3001/auth/google/callback
JWT_SECRET=test-jwt-secret-for-e2e-tests
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost
EOF
echo "✓ Backend .env created"
echo ""

# Start production containers
echo "Starting production Docker containers..."
docker compose up -d mongodb backend_prod frontend_prod
echo "✓ Containers started"
echo ""

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker compose ps mongodb | grep -q "Up"; then
    echo "✓ MongoDB is running"
else
    echo "✗ MongoDB failed to start"
    docker compose logs mongodb
    docker compose down
    exit 1
fi

if docker compose ps backend_prod | grep -q "Up"; then
    echo "✓ Backend is running"
else
    echo "✗ Backend failed to start"
    docker compose logs backend_prod
    docker compose down
    exit 1
fi

if docker compose ps frontend_prod | grep -q "Up"; then
    echo "✓ Frontend (production) is running"
else
    echo "✗ Frontend failed to start"
    docker compose logs frontend_prod
    docker compose down
    exit 1
fi
echo ""

# Wait a bit more for services to be fully ready
echo "Waiting for services to fully initialize..."
sleep 5
echo ""

# Test that frontend is accessible
echo "Testing frontend accessibility..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Frontend is accessible (HTTP $HTTP_CODE)"
else
    echo "⚠ Frontend returned HTTP $HTTP_CODE"
    echo "  Continuing with tests..."
fi
echo ""

# Test that API proxy is working
echo "Testing API proxy..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null || echo "000")
echo "  API proxy status: HTTP $HTTP_CODE"
echo ""

# Run Cypress e2e tests
echo "Running Cypress E2E tests..."
echo ""
cd frontend
export CYPRESS_BASE_URL=http://localhost
npm run test:e2e

# Capture test exit code
TEST_EXIT_CODE=$?

# Go back to root
cd ..

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✓ E2E tests passed!"
else
    echo "✗ E2E tests failed with exit code $TEST_EXIT_CODE"
fi
echo ""

# Show container logs for debugging
echo "Container logs (last 20 lines):"
echo ""
echo "=== Frontend logs ==="
docker compose logs --tail=20 frontend_prod
echo ""
echo "=== Backend logs ==="
docker compose logs --tail=20 backend_prod
echo ""

# Cleanup
echo "Cleaning up containers..."
docker compose down
echo "✓ Cleanup complete"
echo ""

# Remove test .env file
rm -f backend/.env
echo "✓ Test .env removed"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "===== E2E Tests with Production Docker: SUCCESS ====="
else
    echo "===== E2E Tests with Production Docker: FAILED ====="
fi
echo ""

exit $TEST_EXIT_CODE
