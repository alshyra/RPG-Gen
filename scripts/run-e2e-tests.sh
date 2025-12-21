#!/bin/bash

# Script helper pour lancer les tests E2E avec les bons services
# Usage: ./scripts/run-e2e-tests.sh [test-name]

set -e

echo "🚀 Démarrage des services pour tests E2E..."

docker compose -f compose.dev.yml up -d

# Lancer les tests avec reporter=list
TEST_NAME="${1:-}"
if [ -z "$TEST_NAME" ]; then
  npm --workspace packages/e2e run test -- --reporter=list
else
  npm --workspace packages/e2e run test -- "$TEST_NAME" --reporter=list
fi
