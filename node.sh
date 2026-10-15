#!/usr/bin/env bash
# Runs npm/npx inside a container (the server has no Node.js).
docker run --rm ${NODE_DOCKER_ARGS:-} -u "$(id -u):$(id -g)" -e HOME=/tmp -e npm_config_cache=/tmp/.npm \
  -v sitetour-npm:/tmp/.npm -v "$(cd "$(dirname "$0")" && pwd):/app" -w /app node:22-alpine "$@"
