# Infra & Provisionamento — Hetzner VPS

Runbook para colocar o sistema de catequese de pé num VPS Hetzner único, com Docker
Compose (Caddy + Go API + Postgres) e backup off-site no Hetzner Storage Box.

> Comandos marcados com **[você]** rodam na sua máquina/no painel Hetzner (precisam da
> sua conta). Os demais rodam **no servidor** via SSH. No Claude Code, você pode rodar
> um comando local na conversa prefixando com `!`, ex: `! ssh root@SEU_IP`.

## 0. Pré-requisitos
- Conta na Hetzner Cloud + Hetzner Storage Box.
- Um domínio com acesso ao painel de DNS.
- Uma chave SSH (`ssh-keygen -t ed25519 -C "catequese-deploy"` se não tiver).

## 1. Criar o servidor  **[você]**
1. Hetzner Cloud Console → **Add Server**.
2. Location: Falkenstein/Nuremberg (UE) — mais barato. Image: **Ubuntu 24.04**.
3. Type: **CPX22** (3 vCPU / 4 GB) — ou CX23 para apertar custo.
4. **SSH keys:** selecione sua chave pública (evita senha de root).
5. Crie e anote o **IP público**.

## 2. DNS  **[você]**
- Crie um **A-record**: `catequese.SEU_DOMINIO` → IP do servidor.
- Aguarde propagar (`dig +short catequese.SEU_DOMINIO` deve retornar o IP).
  TLS do Caddy depende disso.

## 3. Hardening + Docker (no servidor)
```bash
ssh root@SEU_IP

# Usuário não-root para deploy
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Firewall (UFW) — só SSH/HTTP/HTTPS
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable

# Endurecer SSH: sem login de root, sem senha
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy

# Atualizações de segurança automáticas
apt-get update && apt-get install -y unattended-upgrades
```
> Reforço opcional: configure também o **Hetzner Cloud Firewall** (no painel) liberando
> apenas 22/80/443 — defesa em camadas além do UFW.

## 4. Clonar o repo e configurar o ambiente (como `deploy`)
```bash
ssh deploy@SEU_IP
sudo mkdir -p /opt/catechism && sudo chown deploy:deploy /opt/catechism
git clone <URL_DO_REPO> /opt/catechism
cd /opt/catechism

cp .env.server.example .env
# Edite .env com valores reais (senhas fortes, DOMAIN, JWT_SECRET, ADMIN_*, Storage Box)
#   JWT_SECRET:   openssl rand -base64 48
#   POSTGRES_PASSWORD: openssl rand -base64 24   (reflita também em DATABASE_URL)
nano .env
```

## 5. Chave SSH para o Storage Box (backup)  **[você + servidor]**
```bash
# No servidor, gere uma chave dedicada ao backup e autorize-a no Storage Box:
ssh-keygen -t ed25519 -f ~/.ssh/storagebox -N ""
# Hetzner Storage Box aceita chaves via painel OU via este comando (porta 23):
cat ~/.ssh/storagebox.pub | ssh -p23 SEU_USER_STORAGEBOX@SEU_HOST_STORAGEBOX install-ssh-key
# Teste:
sftp -i ~/.ssh/storagebox SEU_USER_STORAGEBOX@SEU_HOST_STORAGEBOX
```
> Configure `STORAGEBOX_SSH_KEY=/home/deploy/.ssh/storagebox` no `.env` para forcar
> `backup.sh` e `restore.sh` a usarem a chave dedicada.

## 6. Primeiro deploy
```bash
cd /opt/catechism
docker compose up -d --build
docker compose logs -f api   # veja as migrações goose e o bootstrap do admin
```
- Caddy emite o certificado TLS automaticamente (porta 80/443 + DNS ok).
- Acesse `https://catequese.SEU_DOMINIO` e faça login com `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

## 7. Backup automático
```bash
chmod +x scripts/backup.sh scripts/restore.sh
# Teste manual:
./scripts/backup.sh
# Agende no cron (03:17 diário):
( crontab -l 2>/dev/null; echo "17 3 * * * cd /opt/catechism && ./scripts/backup.sh >> /var/log/catechism-backup.log 2>&1" ) | crontab -
# TESTE A RESTAURAÇÃO (critério de sucesso do PRD):
./scripts/restore.sh <nome-do-arquivo-gerado>
```
> Os dumps sao gerados com `pg_dump --clean --if-exists`, entao a restauracao de
> teste pode recriar os objetos do banco atual. Execute em janela controlada e valide
> a aplicacao logo em seguida.

## 8. CI/CD (deploy automático)  **[você]**
No GitHub do repo → Settings → Secrets and variables → Actions, crie:
- `SSH_HOST` = IP do servidor
- `SSH_USER` = `deploy`
- `SSH_KEY`  = conteúdo da **chave privada** autorizada no servidor
- `DEPLOY_PATH` = `/opt/catechism`

A partir daí, `git push` na `main` builda + faz `docker compose up -d --build` via SSH
(`.github/workflows/deploy.yml`).

## 9. Evidencias finais de producao
Preencha este bloco durante o deploy real. Nao marque a tarefa final como concluida
sem estes sinais.

| Item | Comando / evidencia esperada | Resultado |
|---|---|---|
| DNS aponta para o VPS | `dig +short catequese.SEU_DOMINIO` retorna o IP Hetzner | |
| TLS valido | `curl -Iv https://catequese.SEU_DOMINIO` mostra certificado valido e HTTP 200/3xx | |
| Stack verde | `docker compose ps` mostra `db`, `api` e `caddy` Up/healthy | |
| Healthcheck API | `curl -fsS https://catequese.SEU_DOMINIO/api/health` retorna 200 | |
| Bootstrap admin | Login com `ADMIN_EMAIL` funciona e exige troca de senha quando aplicavel | |
| Perfil admin/coordenador | Criar ano/turma/aluno/catequista, revisar inscricao e baixar relatorio | |
| Perfil catequista | Login, acessar turmas permitidas, registrar chamada e sincronizar fila offline | |
| Perfil publico | Submeter inscricao publica e confirmar entrada para revisao | |
| Backup off-site | `./scripts/backup.sh` gera `catechism-*.sql.gz.gpg` no Storage Box | |
| Restore comprovado | `./scripts/restore.sh <arquivo>` termina sem erro e app segue funcional | |
| Cron ativo | `crontab -l` contem o agendamento noturno e `/var/log/catechism-backup.log` registra sucesso | |
| CI/CD ativo | Push ou `workflow_dispatch` conclui `.github/workflows/deploy.yml` e atualiza o VPS | |
| Sem Vercel/Supabase runtime | Stack publica usa apenas Caddy/API/Postgres; Vercel/Supabase desativados | |
| Custo <= $15/mes | Fatura/plano Hetzner: VPS + Storage Box + dominio amortizado dentro do limite | |

## Operação do dia a dia
| Ação | Comando (no servidor, em /opt/catechism) |
|---|---|
| Ver logs | `docker compose logs -f api` |
| Reiniciar | `docker compose restart api` |
| Atualizar | `git pull && docker compose up -d --build` (ou via CI) |
| Backup manual | `./scripts/backup.sh` |
| Restaurar | `./scripts/restore.sh <arquivo>` |
| Snapshot do servidor | painel Hetzner (recomendado periódico) |

## Custo estimado
| Item | ~Mensal |
|---|---|
| VPS CPX22 | ~€8 |
| Storage Box (1 TB) | ~€3,2 |
| Domínio | ~€1 (amortizado) |
| **Total** | **~€12 (~$13)** |
