#!/usr/bin/env bash
# ==============================================================================
# DevSecOps Continuous Deployment & Zero-Downtime Rollout Script
# Usage: ./scripts/deploy.sh [IMAGE_TAG]
# ==============================================================================
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/devsecops}"
IMAGE_TAG="${1:-latest}"
APP_PORT="${APP_PORT:-3000}"

echo "========================================================"
echo "🚀 Starting DevSecOps Deployment (Image Tag: $IMAGE_TAG)"
echo "========================================================"

cd "$DEPLOY_DIR"

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found in $DEPLOY_DIR"
    exit 1
fi

echo "[INFO] Pulling updated container images..."
docker compose pull app || true

echo "[INFO] Executing rolling restart with Docker Compose..."
docker compose up -d --remove-orphans

echo "[INFO] Running SRE Post-Deployment Health Verification..."
HEALTH_CHECK_URL="http://127.0.0.1:${APP_PORT}/health/live"
MAX_RETRIES=12
RETRY_DELAY=5

for ((i=1; i<=MAX_RETRIES; i++)); do
    echo "[CHECK] Attempt $i/$MAX_RETRIES: Checking $HEALTH_CHECK_URL..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" || echo "000")

    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo "========================================================"
        echo "✅ Deployment Succeeded! Application is healthy (HTTP 200)."
        echo "========================================================"
        docker compose ps
        exit 0
    fi

    echo "[WARN] Status code: $HTTP_STATUS. Waiting $RETRY_DELAY seconds..."
    sleep $RETRY_DELAY
done

echo "========================================================"
echo "❌ Deployment Health Check FAILED!"
echo "Initiating automatic rollback or inspection..."
echo "========================================================"
docker compose logs --tail 50 app
exit 1
