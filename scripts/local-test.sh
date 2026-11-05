#!/usr/bin/env bash
# ==============================================================================
# Local DevSecOps Pipeline Simulation Script
# Validates Linting, Unit Tests, Code Coverage, and Docker Build locally
# ==============================================================================
set -euo pipefail

echo "========================================================"
echo "🛡️  Local DevSecOps Pipeline Verification"
echo "========================================================"

echo "--> Step 1: Running ESLint..."
npm run lint

echo "--> Step 2: Running Automated Tests & Code Coverage..."
npm run test:coverage

echo "--> Step 3: Verifying Coverage Artifacts..."
if [ -f "coverage/lcov.info" ]; then
    echo "✅ Coverage report lcov.info verified ($(wc -l < coverage/lcov.info) lines)."
else
    echo "❌ Error: coverage/lcov.info missing!"
    exit 1
fi

echo "--> Step 4: Building Hardened Multi-Stage Docker Image..."
docker build -t cloud-native-devsecops-app:local-test .

echo "--> Step 5: Testing Container Spin-up & Healthcheck..."
CONTAINER_ID=$(docker run -d -p 8099:3000 cloud-native-devsecops-app:local-test)

# Cleanup trap
trap 'docker rm -f $CONTAINER_ID >/dev/null 2>&1 || true' EXIT

echo "Waiting for container to initialize..."
sleep 3

echo "--> Step 6: Testing /health endpoint..."
curl -s -f http://127.0.0.1:8099/health > /dev/null
echo "✅ /health returned 200 OK"

echo "--> Step 7: Testing /metrics endpoint..."
curl -s -f http://127.0.0.1:8099/metrics | grep "nodejs_" > /dev/null
echo "✅ /metrics returned valid Prometheus telemetry"

echo "========================================================"
echo "🎉 All local DevSecOps pipeline stages passed successfully!"
echo "========================================================"
