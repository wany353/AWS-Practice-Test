#!/usr/bin/env bash
# Runs ON the EC2 box, piped in over SSH by .github/workflows/deploy.yml.
# Expects TAG (the image tag to run) in the environment.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/AWS-Practice-Test}"
TAG="${TAG:?TAG is required}"
export TAG

cd "$APP_DIR"
compose() { docker compose -f docker-compose.prod.yml "$@"; }

echo "Deploying tag ${TAG}"
compose pull
compose up -d --remove-orphans

# nginx serves the site and proxies /api to the backend, so one request checks
# both containers. The backend only answers once its migrations have run.
for attempt in $(seq 1 20); do
  if curl -fsS http://localhost/api/health >/dev/null 2>&1; then
    echo "Health check passed (attempt ${attempt})"
    compose ps
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 3
done

echo "Health check failed after 60s. Recent logs:" >&2
compose logs --tail=50 >&2
exit 1
