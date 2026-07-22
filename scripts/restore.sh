#!/usr/bin/env bash
# Restore a Postgres backup produced by scripts/backup.sh.
# Usage:  ./scripts/restore.sh catechism-20260623-031701.sql.gz.gpg
# Downloads from DigitalOcean Spaces, decrypts, and pipes into psql.
# WARNING: this overwrites the current database contents.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
set -a
# shellcheck disable=SC1091
source ./.env
set +a

: "${POSTGRES_USER:?}" "${POSTGRES_DB:?}" "${BACKUP_PASSPHRASE:?}"
: "${SPACES_BUCKET:?}" "${SPACES_REGION:?}"
: "${AWS_ACCESS_KEY_ID:?}" "${AWS_SECRET_ACCESS_KEY:?}"
SPACES_PREFIX="${SPACES_PREFIX:-catechism-backups}"
SPACES_ENDPOINT="${SPACES_ENDPOINT:-https://${SPACES_REGION}.digitaloceanspaces.com}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.traefik.yaml}"

FILE="${1:?usage: restore.sh <backup-filename>}"
TMP_DIR="$(mktemp -d)"; trap 'rm -rf "$TMP_DIR"' EXIT

echo "[restore] downloading $FILE ..."
aws s3 cp "s3://$SPACES_BUCKET/$SPACES_PREFIX/$FILE" "$TMP_DIR/$FILE" \
  --endpoint-url "$SPACES_ENDPOINT"

echo "[restore] decrypting + restoring into $POSTGRES_DB ..."
gpg --batch --yes --decrypt --passphrase "$BACKUP_PASSPHRASE" "$TMP_DIR/$FILE" \
  | gunzip \
  | docker compose -f "$COMPOSE_FILE" exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "[restore] done. Verify the app before declaring success."
