#!/bin/sh
# Run from any directory. Existing data and .env are never overwritten.
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
command -v docker >/dev/null || { echo 'Install and start Docker first.' >&2; exit 1; }
docker compose version >/dev/null
docker info >/dev/null
case "${1:-help}" in
 init)
  test -f .env || { cp .env.example .env; echo 'Created .env. Set RELAY_DOMAIN to your public DNS name, then rerun init.'; exit 0; }
  docker compose build relay
  printf 'HTTPS origin (must match RELAY_DOMAIN): '; read -r origin
  printf 'Group name: '; read -r group
  printf 'Owner display name: '; read -r owner
  docker compose run --rm relay node src/cli.mjs init --origin "$origin" --name "$group" --owner "$owner"
  echo 'Run: sh scripts/relay.sh start, then scan the private owner QR within 15 minutes.'
  ;;
 start) docker compose up -d ;;
 stop) docker compose stop ;;
 status) docker compose ps ;;
 logs) docker compose logs --tail=80 ;;
 *) echo 'Usage: sh scripts/relay.sh init|start|stop|status|logs'; exit 1 ;;
esac
