# Infra & Provisionamento — Droplet DigitalOcean

Runbook para operar o sistema de catequese num **droplet DigitalOcean** que hospeda
**várias aplicações** atrás de um **Traefik compartilhado**, com Docker Compose
(Caddy + Go API + Postgres por app) e backup off-site no **DigitalOcean Spaces**.

> Comandos marcados com **[você]** rodam na sua máquina/no painel DigitalOcean
> (precisam da sua conta). Os demais rodam **no droplet** via SSH. No Claude Code,
> você pode rodar um comando local na conversa prefixando com `!`, ex: `! ssh renan@SEU_IP`.

## Estrutura no droplet
Cada aplicação é um projeto Docker Compose isolado, e o Traefik roteia por hostname:

```
/opt/apps/
├── proxy/                       # Traefik compartilhado (TLS + roteamento) — rede externa "proxy"
├── databases/postgres/          # (opcional) Postgres compartilhado do host
└── projects/
    ├── sspx-catechism/          # ESTE repo → compose.traefik.yaml (web + api + db próprios)
    └── sspx-donation/           # outra app, mesma convenção
```

## 0. Pré-requisitos
- Conta na DigitalOcean (droplet + Spaces).
- Um domínio com acesso ao painel de DNS.
- Uma chave SSH (`ssh-keygen -t ed25519 -C "catequese-deploy"` se não tiver).
- O **Traefik compartilhado** já rodando no droplet (ver seção 3).

## 1. Droplet  **[você]**
1. DigitalOcean → **Create → Droplets**.
2. Region: a mais próxima dos utilizadores. Image: **Ubuntu 24.04 LTS**.
3. Plano: Basic (2 vCPU / 2–4 GB atende o droplet multi-app). Autenticação: **SSH key**.
4. Crie e anote o **IP público**.

## 2. DNS  **[você]**
- Crie um **A-record**: `catequese.SEU_DOMINIO` → IP do droplet.
- Aguarde propagar (`dig +short catequese.SEU_DOMINIO` deve retornar o IP).
  O TLS emitido pelo Traefik (Let's Encrypt) depende disso.
- O hostname público da app fica nas **labels do `compose.traefik.yaml`**
  (`traefik.http.routers.catechism.rule=Host(...)`) — ajuste lá se mudar o domínio.

## 3. Hardening + Docker + Traefik (no droplet)
Se o droplet já estiver provisionado (Docker + Traefik rodando), pule para a seção 4.

```bash
ssh root@SEU_IP

# Usuário não-root para deploy (aqui: "renan")
adduser --disabled-password --gecos "" renan
usermod -aG sudo renan
rsync --archive --chown=renan:renan ~/.ssh /home/renan

# Firewall (UFW) — só SSH/HTTP/HTTPS
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable

# Endurecer SSH: sem login de root, sem senha
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# Docker + Compose plugin + AWS CLI (para o backup no Spaces)
curl -fsSL https://get.docker.com | sh
usermod -aG docker renan
apt-get update && apt-get install -y unattended-upgrades awscli
```
> Reforço opcional: configure também o **DigitalOcean Cloud Firewall** (no painel)
> liberando apenas 22/80/443 — defesa em camadas além do UFW.

### Traefik compartilhado (rede `proxy`)
O Traefik é o único a expor 80/443 e termina o TLS de **todas** as apps. Ele vive em
`/opt/apps/proxy/` (compose próprio, fora deste repo). A app só precisa que:

```bash
# a rede externa exista (criada uma vez, compartilhada por todas as apps):
docker network create proxy   # (ignore se já existir)

# e que o Traefik esteja de pé, com um entrypoint "websecure" e um certresolver
# "letsencrypt" (é o que as labels do compose.traefik.yaml esperam):
docker ps | grep -i traefik
docker network ls | grep proxy
```

## 4. Clonar o repo e configurar o ambiente (como `renan`)
```bash
ssh renan@SEU_IP
sudo mkdir -p /opt/apps/projects && sudo chown renan:renan /opt/apps/projects
git clone <URL_DO_REPO> /opt/apps/projects/sspx-catechism
cd /opt/apps/projects/sspx-catechism

cp .env.server.example .env
# Edite .env com valores reais (senhas fortes, JWT_SECRET, ADMIN_*, credenciais do Spaces)
#   JWT_SECRET:        openssl rand -base64 48
#   POSTGRES_PASSWORD: openssl rand -base64 24   (reflita também em DATABASE_URL)
nano .env
```

## 5. DigitalOcean Spaces para backup  **[você + droplet]**  *(opcional)*

> **Backup está desativado neste projeto por ora.** Os scripts e as seções 5 e 7
> ficam prontos para ativar quando/se necessário — pule-as se não for usar backup.

```bash
# [você] No painel DO: Create → Spaces Object Storage. Anote o nome (bucket) e a região
# (ex.: nyc3). Em API → Spaces Keys, gere um par Access Key / Secret Key.

# Preencha no .env: SPACES_BUCKET, SPACES_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
# BACKUP_PASSPHRASE. Teste o acesso a partir do droplet:
set -a; source /opt/apps/projects/sspx-catechism/.env; set +a
aws s3 ls "s3://$SPACES_BUCKET/" --endpoint-url "https://$SPACES_REGION.digitaloceanspaces.com"
```

## 6. Primeiro deploy
```bash
cd /opt/apps/projects/sspx-catechism
docker compose -f compose.traefik.yaml up -d --build
docker compose -f compose.traefik.yaml logs -f api   # veja migrações goose e bootstrap do admin
```
- O Traefik detecta o novo container pelas labels e emite o certificado TLS
  automaticamente (DNS apontado + entrypoint `websecure`).
- Acesse `https://catequese.SEU_DOMINIO` e faça login com `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

## 7. Backup automático (DO Spaces)  *(opcional — desativado por ora)*
```bash
chmod +x scripts/backup.sh scripts/restore.sh
# Teste manual (gera o dump cifrado e envia ao Spaces):
./scripts/backup.sh
# Agende no cron (03:17 diário):
( crontab -l 2>/dev/null; echo "17 3 * * * cd /opt/apps/projects/sspx-catechism && ./scripts/backup.sh >> /var/log/catechism-backup.log 2>&1" ) | crontab -
# TESTE A RESTAURAÇÃO (critério de sucesso do PRD):
./scripts/restore.sh <nome-do-arquivo-gerado>
```
> Os dumps são gerados com `pg_dump --clean --if-exists`, então a restauração de
> teste pode recriar os objetos do banco atual. Execute em janela controlada e valide
> a aplicação logo em seguida. Os scripts usam `-f compose.traefik.yaml` para falar
> com o container `db` correto.

## 8. CI/CD (deploy automático)

> **O GitHub Actions está bloqueado no nível da conta** (`renan-rmsantos-tech`):
> qualquer disparo devolve `422 "Actions has been disabled for this user."`.
> O repo está correto (`actions/permissions` → `enabled: true`, workflow `active`)
> e não há saldo devedor — é restrição administrativa da conta, só o suporte do
> GitHub levanta. O `.github/workflows/deploy.yml` fica no repo para quando voltar.
> **Enquanto isso, o deploy oficial é o push-to-deploy abaixo.**

### Push-to-deploy (via `git push production main`)

O droplet recebe o push direto no clone que já existe. Não há repo bare separado:
`receive.denyCurrentBranch=updateInstead` faz o git atualizar o work-tree no próprio
push, e o hook `post-receive` reconstrói a stack. O `origin` (GitHub) continua
intacto como hospedagem de código e como plano B (`git pull`).

**Instalação no droplet — uma vez:**
```bash
ssh renan@SEU_IP
cd /opt/apps/projects/sspx-catechism
git pull --ff-only                       # traz scripts/post-receive.sh
git config receive.denyCurrentBranch updateInstead
cp scripts/post-receive.sh .git/hooks/post-receive
chmod +x .git/hooks/post-receive
```
> Copie, **não** faça symlink: com `updateInstead` o work-tree é atualizado antes do
> hook rodar, e reescrever o script em execução corrompe o bash. Se
> `scripts/post-receive.sh` mudar, repita o `cp`.

**Na sua máquina — uma vez:**
```bash
git remote add production renan@SEU_IP:/opt/apps/projects/sspx-catechism
```

**No dia a dia:**
```bash
git push origin main       # hospeda o código no GitHub
git push production main   # publica (build + testes + health check, com rollback)
```
O log do build sai no seu terminal durante o push; o histórico fica em
`~/deploy-sspx-catechism.log` no droplet.

### Onde vive o portão de testes

Não no hook — **dentro das imagens**, para que nada quebrado chegue a rodar:

| Imagem | Passo | Efeito da falha |
|---|---|---|
| `backend/Dockerfile` | `RUN go test ./...` | build falha, imagem não é gerada |
| `infra/Caddy.Dockerfile` | `RUN npx vitest run` | build falha, imagem não é gerada |

Como o `compose up -d --build` aborta, o container antigo **continua servindo**.
Os testes de integração dão `t.Skip` sem `TEST_DATABASE_URL` — mesmo escopo que o
CI antigo rodava.

### Rollback automático

O `post-receive` reverte sozinho (`git reset --hard` para a revisão anterior +
rebuild) se o build/testes falharem **ou** se `/api/health` não responder 200
através do Traefik em ~60s. Um deploy ruim volta ao estado anterior sem intervenção.

## 9. Evidências finais de produção
Preencha este bloco durante o deploy real. Não marque a tarefa final como concluída
sem estes sinais.

| Item | Comando / evidência esperada | Resultado |
|---|---|---|
| DNS aponta para o droplet | `dig +short catequese.SEU_DOMINIO` retorna o IP DigitalOcean | |
| Traefik roteando + TLS | `curl -Iv https://catequese.SEU_DOMINIO` mostra certificado válido e HTTP 200/3xx | |
| Rede proxy + Traefik | `docker network ls \| grep proxy` e `docker ps \| grep traefik` | |
| Stack verde | `docker compose -f compose.traefik.yaml ps` mostra `db`, `api` e `web` Up/healthy | |
| Healthcheck API | `curl -fsS https://catequese.SEU_DOMINIO/api/health` retorna 200 | |
| Rate limit no login | ~10 POSTs seguidos em `/api/auth/login` passam a retornar 429 | |
| Bootstrap admin | Login com `ADMIN_EMAIL` funciona e exige troca de senha quando aplicável | |
| Perfil admin/coordenador | Criar ano/turma/aluno/catequista, revisar inscrição e baixar relatório | |
| Perfil catequista | Login, acessar turmas permitidas, registrar chamada e sincronizar fila offline | |
| Perfil público | Submeter inscrição pública e confirmar entrada para revisão | |
| Backup off-site *(opcional)* | `./scripts/backup.sh` envia `catechism-*.sql.gz.gpg` ao DO Spaces | |
| Restore comprovado *(opcional)* | `./scripts/restore.sh <arquivo>` termina sem erro e app segue funcional | |
| Cron ativo *(opcional)* | `crontab -l` contém o agendamento noturno e `/var/log/catechism-backup.log` registra sucesso | |
| Deploy automático | `git push production main` conclui build+testes, health 200 e atualiza o droplet (§8) | |

## Operação do dia a dia
Todos no droplet, em `/opt/apps/projects/sspx-catechism`:

| Ação | Comando |
|---|---|
| Ver logs | `docker compose -f compose.traefik.yaml logs -f api` |
| Reiniciar | `docker compose -f compose.traefik.yaml restart api` |
| Status | `docker compose -f compose.traefik.yaml ps` |
| Atualizar | `git push production main` da sua máquina (§8); no droplet, `git pull && docker compose -f compose.traefik.yaml up -d --build` |
| Log dos deploys | `tail -f ~/deploy-sspx-catechism.log` |
| Backup manual | `./scripts/backup.sh` |
| Restaurar | `./scripts/restore.sh <arquivo>` |
| Snapshot do droplet | painel DigitalOcean (recomendado periódico) |

## Custo estimado
O droplet é **compartilhado entre várias apps**, então o custo por app é amortizado.

| Item | ~Mensal |
|---|---|
| Droplet DigitalOcean (Basic, compartilhado) | ~$12–24 (rateado entre apps) |
| DigitalOcean Spaces (250 GB) | ~$5 |
| Domínio | ~$1 (amortizado) |
