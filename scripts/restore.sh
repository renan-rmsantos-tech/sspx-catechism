#!/usr/bin/env bash
# Restore a Postgres backup produced by scripts/backup.sh.
# Usage:  ./scripts/restore.sh catechism-20260623-031701.sql.gz.gpg
# Downloads from the Storage Box, decrypts, and pipes into psql.
# WARNING: this overwrites the current database contents.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
set -a; source ./.env; set +a

FILE="${1:?usage: restore.sh <backup-filename>}"
TMP_DIR="$(mktemp -d)"; trap 'rm -rf "$TMP_DIR"' EXIT

echo "[restore] downloading $FILE ..."
echo "get $STORAGEBOX_REMOTE_DIR/$FILE $TMP_DIR/$FILE" \
  | sftp -b - "$STORAGEBOX_USER@$STORAGEBOX_HOST"

echo "[restore] decrypting + restoring into $POSTGRES_DB ..."
gpg --batch --yes --decrypt --passphrase "$BACKUP_PASSPHRASE" "$TMP_DIR/$FILE" \
  | gunzip \
  | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "[restore] done. Verify the app before declaring success."
