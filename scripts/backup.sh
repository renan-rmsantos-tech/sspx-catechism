#!/usr/bin/env bash
# Nightly encrypted Postgres backup → DigitalOcean Spaces (S3-compatible).
# Run on the droplet via cron. Reads config from the .env next to
# compose.traefik.yaml.
#
# NOTE: backup is currently DISABLED for this project (no cron scheduled, no
# Spaces configured). This script is kept ready — see infra/README.md §5/§7 to
# enable it.
#
# Requires: docker, gpg, and the AWS CLI v2 (`aws`) — DO Spaces speaks S3.
# Cron example (daily 03:17):
#   17 3 * * * cd /opt/apps/projects/sspx-catechism && ./scripts/backup.sh >> /var/log/catechism-backup.log 2>&1

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Load env (POSTGRES_*, SPACES_*, AWS_*, BACKUP_*)
set -a
# shellcheck disable=SC1091
source ./.env
set +a

: "${POSTGRES_USER:?}" "${POSTGRES_DB:?}" "${BACKUP_PASSPHRASE:?}"
: "${SPACES_BUCKET:?}" "${SPACES_REGION:?}"
: "${AWS_ACCESS_KEY_ID:?}" "${AWS_SECRET_ACCESS_KEY:?}"
SPACES_PREFIX="${SPACES_PREFIX:-catechism-backups}"
SPACES_ENDPOINT="${SPACES_ENDPOINT:-https://${SPACES_REGION}.digitaloceanspaces.com}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.traefik.yaml}"

STAMP="$(date +%Y%m%d-%H%M%S)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
DUMP_NAME="catechism-$STAMP.sql.gz.gpg"
DUMP_FILE="$TMP_DIR/$DUMP_NAME"

echo "[backup] dumping database $POSTGRES_DB ..."
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump --clean --if-exists --no-owner --no-privileges -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip \
  | gpg --batch --yes --symmetric --cipher-algo AES256 \
        --passphrase "$BACKUP_PASSPHRASE" -o "$DUMP_FILE"

SIZE="$(du -h "$DUMP_FILE" | cut -f1)"
echo "[backup] encrypted dump ready ($SIZE): $DUMP_NAME"

echo "[backup] uploading to s3://$SPACES_BUCKET/$SPACES_PREFIX/ ..."
aws s3 cp "$DUMP_FILE" "s3://$SPACES_BUCKET/$SPACES_PREFIX/$DUMP_NAME" \
  --endpoint-url "$SPACES_ENDPOINT"

echo "[backup] pruning backups older than $RETENTION_DAYS days ..."
CUTOFF="$(date -d "-$RETENTION_DAYS days" +%Y%m%d)"
REMOTE_LIST="$(aws s3 ls "s3://$SPACES_BUCKET/$SPACES_PREFIX/" --endpoint-url "$SPACES_ENDPOINT" 2>/dev/null \
  | awk '{print $4}' | grep -E '^catechism-[0-9]{8}-' || true)"
while IFS= read -r f; do
  [ -z "$f" ] && continue
  fdate="$(echo "$f" | sed -E 's/^catechism-([0-9]{8})-.*/\1/')"
  if [ -n "$fdate" ] && [ "$fdate" -lt "$CUTOFF" ]; then
    echo "[backup]   deleting old $f"
    aws s3 rm "s3://$SPACES_BUCKET/$SPACES_PREFIX/$f" --endpoint-url "$SPACES_ENDPOINT" >/dev/null || true
  fi
done <<< "$REMOTE_LIST"

echo "[backup] done."
