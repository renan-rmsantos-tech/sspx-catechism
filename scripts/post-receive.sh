#!/usr/bin/env bash
#
# Hook de deploy — roda NO DROPLET, disparado por `git push production main`.
#
# Substitui o .github/workflows/deploy.yml enquanto o GitHub Actions está
# bloqueado no nível da conta (ver infra/README.md §8). O portão de testes NÃO
# vive aqui: ele está dentro dos Dockerfiles (backend/Dockerfile roda
# `go test ./...`, infra/Caddy.Dockerfile roda `npx vitest run`). Se um teste
# quebra, a imagem não constrói, o `compose up` falha e este script reverte.
#
# Instalação (ver infra/README.md §8):
#   git config receive.denyCurrentBranch updateInstead
#   cp scripts/post-receive.sh .git/hooks/post-receive && chmod +x .git/hooks/post-receive
#
# Copie, não faça symlink: com `updateInstead` o work-tree é atualizado ANTES do
# post-receive rodar, e reescrever o próprio script em execução corrompe o bash.
set -uo pipefail

# O git exporta estas variáveis para o hook; elas apontam para o repo/índice do
# push e quebrariam qualquer comando git executado no work-tree abaixo.
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_QUARANTINE_PATH

APP_DIR=${APP_DIR:-/opt/apps/projects/sspx-catechism}
COMPOSE_FILE=${COMPOSE_FILE:-compose.traefik.yaml}
HEALTH_URL=${HEALTH_URL:-https://catequese.apps.rmsantos.tech/api/health}
LOG_FILE=${LOG_FILE:-$HOME/deploy-sspx-catechism.log}

log() { printf '%s  %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" | tee -a "$LOG_FILE"; }

# Espera o /api/health responder 200 através do Traefik — valida o caminho
# inteiro (Traefik -> Caddy -> API), não só "o container subiu".
wait_healthy() {
  local i code
  for i in $(seq 1 20); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$HEALTH_URL" || echo 000)
    if [ "$code" = "200" ]; then
      log "health OK ($HEALTH_URL -> 200, tentativa $i)"
      return 0
    fi
    sleep 3
  done
  log "health FALHOU ($HEALTH_URL -> $code após 20 tentativas)"
  return 1
}

rollback() {
  local oldrev=$1
  if [ -z "$oldrev" ] || [ "$oldrev" = "0000000000000000000000000000000000000000" ]; then
    log "sem revisão anterior para reverter — deixando como está"
    return 1
  fi
  log "REVERTENDO para $(git -C "$APP_DIR" rev-parse --short "$oldrev")"
  git -C "$APP_DIR" reset --hard "$oldrev" >>"$LOG_FILE" 2>&1
  if docker compose -f "$COMPOSE_FILE" up -d --build >>"$LOG_FILE" 2>&1; then
    log "rollback concluído — versão anterior no ar"
  else
    log "ROLLBACK FALHOU — intervenção manual necessária (log: $LOG_FILE)"
  fi
  return 1
}

deploy() {
  local oldrev=$1 newrev=$2
  cd "$APP_DIR" || { log "não consegui entrar em $APP_DIR"; return 1; }

  log "deploy $(git rev-parse --short "$newrev") — $(git log -1 --format=%s "$newrev")"

  # --build roda os testes dentro das imagens; falha aqui = teste ou build quebrado.
  if ! docker compose -f "$COMPOSE_FILE" up -d --build 2>&1 | tee -a "$LOG_FILE"; then
    log "BUILD/TESTES FALHARAM — nada foi publicado"
    rollback "$oldrev"
    return 1
  fi

  if ! wait_healthy; then
    rollback "$oldrev"
    return 1
  fi

  docker image prune -f >>"$LOG_FILE" 2>&1
  log "deploy OK — $(git rev-parse --short HEAD) no ar"
}

status=0
while read -r oldrev newrev ref; do
  if [ "$ref" != "refs/heads/main" ]; then
    log "ignorando $ref (só main deploya)"
    continue
  fi
  deploy "$oldrev" "$newrev" || status=1
done

exit $status
