#!/usr/bin/env bash
# ==============================================================================
# SRE Traffic & Alert Verification Generator
# Simulates legitimate traffic, latency spikes, and 5xx errors to test
# Prometheus metric collection, alert rules, and Grafana dashboards.
# Usage: ./scripts/simulate-traffic.sh [TARGET_URL]
# Example: ./scripts/simulate-traffic.sh http://localhost:8082
# ==============================================================================
set -euo pipefail

TARGET="${1:-http://localhost:8082}"
COUNT="${2:-50}"

echo "========================================================"
echo "⚡ DevSecOps SRE Traffic Generator"
echo "Target: $TARGET"
echo "Iterations: $COUNT"
echo "========================================================"

echo "[1/4] Generating healthy HTTP traffic (200 OK)..."
for ((i=1; i<=COUNT; i++)); do
    curl -s -o /dev/null "$TARGET/" || true
    curl -s -o /dev/null "$TARGET/health" || true
    curl -s -o /dev/null "$TARGET/api/v1/info" || true
    curl -s -o /dev/null "$TARGET/api/v1/greet?name=DevSecOpsEngineer" || true
    curl -s -o /dev/null -X POST -H "Content-Type: application/json" -d '{"ip":"8.8.8.8"}' "$TARGET/api/v1/ping" || true
    printf "."
done
echo " Done!"

echo "[2/4] Generating client errors (404 Not Found & 400 Bad Request)..."
for ((i=1; i<=10; i++)); do
    curl -s -o /dev/null "$TARGET/non-existent-page" || true
    curl -s -o /dev/null -X POST -H "Content-Type: application/json" -d '{"ip":"invalid_ip_injection"}' "$TARGET/api/v1/ping" || true
    printf "."
done
echo " Done!"

echo "[3/4] Generating controlled 5xx server errors (to verify SRE Alert)..."
for ((i=1; i<=5; i++)); do
    curl -s -o /dev/null "$TARGET/api/v1/simulate/error" || true
    printf "!"
done
echo " Done!"

echo "[4/4] Simulating latency spikes (> 500ms)..."
for ((i=1; i<=3; i++)); do
    curl -s -o /dev/null "$TARGET/api/v1/simulate/latency?ms=600" || true
    printf "~"
done
echo " Done!"

echo "========================================================"
echo "✅ Telemetry Generation Completed!"
echo "Inspect metrics at: $TARGET/metrics"
echo "Inspect dashboard at: Grafana UI"
echo "========================================================"
