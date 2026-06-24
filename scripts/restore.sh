#!/usr/bin/env bash
# Restore a Postgres backup produced by scripts/backup.sh.
# Usage:  ./scripts/restore.sh catechism-20260623-031701.sql.gz.gpg
# Downloads from the Storage Box, decrypts, and pipes into psql.
# WARNING: this overwrites the current database contents.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
set -a
# shellcheck disable=SC1091
source ./.env
set +a

FILE="${1:?usage: restore.sh <backup-filename>}"
TMP_DIR="$(mktemp -d)"; trap 'rm -rf "$TMP_DIR"' EXIT
SFTP_TARGET="$STORAGEBOX_USER@$STORAGEBOX_HOST"
SFTP_OPTS=()
if [ -n "${STORAGEBOX_SSH_KEY:-}" ]; then
  SFTP_OPTS=(-i "$STORAGEBOX_SSH_KEY")
fi

echo "[restore] downloading $FILE ..."
echo "get $STORAGEBOX_REMOTE_DIR/$FILE $TMP_DIR/$FILE" \
  | sftp "${SFTP_OPTS[@]}" -b - "$SFTP_TARGET"

echo "[restore] decrypting + restoring into $POSTGRES_DB ..."
gpg --batch --yes --decrypt --passphrase "$BACKUP_PASSPHRASE" "$TMP_DIR/$FILE" \
  | gunzip \
  | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "[restore] done. Verify the app before declaring success."
