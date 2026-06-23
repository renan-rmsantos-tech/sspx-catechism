#!/usr/bin/env bash
# Nightly encrypted Postgres backup → Hetzner Storage Box (SFTP/SSH).
# Run on the VPS via cron. Reads config from the .env next to docker-compose.yml.
#
# Requires: docker, gpg, ssh/sftp, an SSH key authorized on the Storage Box.
# Cron example (daily 03:17):
#   17 3 * * * cd /opt/catechism && ./scripts/backup.sh >> /var/log/catechism-backup.log 2>&1

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Load env (POSTGRES_*, STORAGEBOX_*, BACKUP_*)
set -a
# shellcheck disable=SC1091
source ./.env
set +a

: "${POSTGRES_USER:?}" "${POSTGRES_DB:?}" "${BACKUP_PASSPHRASE:?}"
: "${STORAGEBOX_USER:?}" "${STORAGEBOX_HOST:?}" "${STORAGEBOX_REMOTE_DIR:?}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

STAMP="$(date +%Y%m%d-%H%M%S)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
DUMP_FILE="$TMP_DIR/catechism-$STAMP.sql.gz.gpg"

echo "[backup] dumping database $POSTGRES_DB ..."
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip \
  | gpg --batch --yes --symmetric --cipher-algo AES256 \
        --passphrase "$BACKUP_PASSPHRASE" -o "$DUMP_FILE"

SIZE="$(du -h "$DUMP_FILE" | cut -f1)"
echo "[backup] encrypted dump ready ($SIZE): $(basename "$DUMP_FILE")"

echo "[backup] uploading to Storage Box ..."
# Ensure remote dir exists, then upload (batch SFTP).
sftp -b - "$STORAGEBOX_USER@$STORAGEBOX_HOST" <<EOF
-mkdir $STORAGEBOX_REMOTE_DIR
put $DUMP_FILE $STORAGEBOX_REMOTE_DIR/$(basename "$DUMP_FILE")
EOF

echo "[backup] pruning remote backups older than $RETENTION_DAYS days ..."
# List remote files and delete ones older than retention (by embedded date in name).
CUTOFF="$(date -d "-$RETENTION_DAYS days" +%Y%m%d)"
REMOTE_LIST="$(echo "ls -1 $STORAGEBOX_REMOTE_DIR" | sftp -b - "$STORAGEBOX_USER@$STORAGEBOX_HOST" 2>/dev/null | grep -E 'catechism-[0-9]{8}-' || true)"
while IFS= read -r f; do
  [ -z "$f" ] && continue
  fdate="$(echo "$f" | sed -E 's/.*catechism-([0-9]{8})-.*/\1/')"
  if [ -n "$fdate" ] && [ "$fdate" -lt "$CUTOFF" ]; then
    echo "[backup]   deleting old $f"
    echo "rm $STORAGEBOX_REMOTE_DIR/$(basename "$f")" | sftp -b - "$STORAGEBOX_USER@$STORAGEBOX_HOST" >/dev/null 2>&1 || true
  fi
done <<< "$REMOTE_LIST"

echo "[backup] done."
