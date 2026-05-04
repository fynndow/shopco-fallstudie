#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-staging}"

echo "[deploy] building image for $ENV"
docker build -t shopco:$ENV .

echo "[deploy] pushing image for $ENV (stub)"
# docker push registry.shopco.de/shopco:$ENV

echo "[deploy] applying kubernetes manifests for $ENV (stub)"
# kubectl apply -f k8s/$ENV/

echo "[deploy] done"
