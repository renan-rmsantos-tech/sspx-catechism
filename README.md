# Catechism — gestão de presença para catecismo

Aplicação web/PWA para **uma paróquia** gerenciar **cadastro de alunos** de catecismo e **chamada de presença** por turma. O foco é substituir listas em papel, centralizar dados pessoais, pastorais e de contato dos responsáveis, e permitir que **catequistas** registrem a chamada no celular — inclusive **offline**, com sincronização automática quando a conexão voltar. **Coordenadores** usam um painel para turmas, alunos e relatórios.

Documentação de produto e arquitetura (fonte da verdade para escopo e stack):

- [PRD](.compozy/tasks/migration-go/_prd.md) — visão, personas, funcionalidades e fases
- [TechSpec](.compozy/tasks/migration-go/_techspec.md) — arquitetura, modelo de dados, APIs e decisões técnicas
- [ADRs](.compozy/tasks/migration-go/adrs/) — decisões de arquitetura (VPS/Docker, SPA Vite, stack Go, JWT/authz, deploy/backup)
- [Runbook de infraestrutura](infra/README.md) — provisionamento do Hetzner, deploy e operação

---

## Stack

| Camada          | Tecnologia                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------- |
| Frontend        | [Vite](https://vitejs.dev) + React 19 + [React Router](https://reactrouter.com), TypeScript  |
| UI              | Tailwind CSS, [shadcn/ui](https://ui.shadcn.com), [Base UI](https://base-ui.com)             |
| Backend / API   | **Go** — [chi](https://github.com/go-chi/chi) (router), [pgx](https://github.com/jackc/pgx) + [sqlc](https://sqlc.dev) (dados), [goose](https://github.com/pressly/goose) (migrações) |
| Banco de dados  | **PostgreSQL 16** (auto-hospedado em container)                                              |
| Autenticação    | JWT em cookie httpOnly + bcrypt; autorização na camada de aplicação (substitui o RLS)        |
| Offline         | PWA ([vite-plugin-pwa](https://vite-pwa-org.netlify.app)), [Dexie](https://dexie.org) (IndexedDB) |
| Relatórios      | Geração de PDF/XLSX no backend Go                                                             |
| Edge / TLS      | [Caddy](https://caddyserver.com) (HTTPS automático + serve a SPA + proxy `/api`)             |
| Empacotamento   | Docker Compose                                                                               |
| Deploy          | VPS [Hetzner](https://www.hetzner.com/cloud) + GitHub Actions → SSH; backup no Hetzner Storage Box |

---

## Arquitetura

Tudo roda num único VPS via Docker Compose:

```
Internet (HTTPS)
      │
   ┌──▼───┐  caddy: TLS automático (Let's Encrypt)
   │ Caddy│  serve a SPA estática + proxy de /api/*
   └──┬───┘
  /         /api/*
   │           │
┌──▼────┐  ┌───▼──────┐  api: Go (chi)
│ SPA   │  │  Go API  │  JWT httpOnly, autorização na app
│ (Vite)│  └───┬──────┘
└───────┘      │ pgx
          ┌────▼─────┐  db: Postgres 16 (rede interna, sem porta exposta)
          │ Postgres │  └─ pg_dump noturno → Hetzner Storage Box
          └──────────┘
```

### Layout do monorepo

```
backend/      API em Go (cmd/api, internal/*, db/migrations, db/queries, sqlc.yaml)
frontend/     SPA Vite + React (src/, vite.config.ts)
infra/        Caddy.Dockerfile + runbook de provisionamento (README.md)
scripts/      backup.sh / restore.sh (pg_dump cifrado ↔ Storage Box)
docker-compose.yml   orquestração (caddy + api + db)
Caddyfile     config do edge (TLS + SPA + proxy)
.github/workflows/deploy.yml   CI: testa e faz deploy via SSH
```

---

## Regras e princípios principais

- **Papéis:** **admin** — acesso total, gestão de catequistas e anos letivos; **coordenador** — turmas, alunos, catequistas, relatórios; **catequista** — apenas turmas às quais está vinculado, chamada e histórico. O acesso é reforçado **na camada de aplicação (API Go)** — as regras que antes eram RLS no Supabase agora vivem no backend (`internal/authz`).
- **Offline-first na chamada:** a fila fica no dispositivo (IndexedDB/Dexie) e tenta enviar ao servidor ao voltar online; em Safari/iOS o **Background Sync** pode ser limitado — há fallback com o evento `online`. A sincronização é **idempotente** (reenviar o mesmo lote não duplica presenças).
- **LGPD:** dados de menores e responsáveis são sensíveis; apenas usuários autorizados devem acessar o sistema. Tráfego sob HTTPS, senhas com hash bcrypt e backups cifrados.
- **Escopo do MVP:** uma paróquia, sem portal para pais, sem notificações automáticas de falta, sem multi-paróquia (detalhes em *Non-Goals* do PRD).
- **Linguagem da UI:** português brasileiro, vocabulário paroquial (turma, catequista, aluno).
- **Segredos:** apenas no servidor (`.env` ao lado do `docker-compose.yml`) — `JWT_SECRET`, credenciais do Postgres, `ADMIN_EMAIL`/`ADMIN_PASSWORD`, credenciais do Storage Box. Nunca commitados.

---

## Desenvolvimento local

Pré-requisitos: **Go 1.23+**, **Node 20+**, **Docker** (para um Postgres local).

### 1. Banco de dados (Postgres em container)

```bash
docker run -d --name catechism-db \
  -e POSTGRES_USER=cat -e POSTGRES_PASSWORD=cat -e POSTGRES_DB=cat \
  -p 5432:5432 postgres:16-alpine
```

### 2. Backend (API Go)

```bash
cd backend
cp .env.example .env   # ajuste se precisar; o `.env` não é versionado
go run ./cmd/api       # aplica migrações (goose), semeia o admin e sobe em :8080
```

O backend carrega automaticamente `backend/.env` no startup (variáveis já definidas no shell ou no Docker têm prioridade).

As migrações em `backend/db/migrations/` são aplicadas automaticamente no startup. Para regenerar o acesso a dados após alterar SQL: `sqlc generate` (em `backend/`).

### 3. Frontend (SPA Vite)

```bash
cd frontend
npm install
npm run dev           # Vite em :5173, chamando a API em /api
```

---

## Build e testes

| Onde       | Comando                       | Descrição                                  |
| ---------- | ----------------------------- | ------------------------------------------ |
| `backend/` | `go build ./...`              | Compila a API                              |
| `backend/` | `go vet ./...`                | Análise estática                           |
| `backend/` | `go test ./...`               | Testes (unitários + integração)            |
| `frontend/`| `npm run build`               | Type-check + build de produção             |
| `frontend/`| `npm run lint`                | Type-check (`tsc -b`)                       |
| `frontend/`| `npm test`                    | Testes Vitest                              |
| `frontend/`| `npm run test:coverage`       | Vitest com cobertura                       |

Os testes de integração do backend sobem um Postgres real (via container/`testcontainers`) — Docker precisa estar disponível.

---

## Variáveis de ambiente

No servidor, copie [`.env.server.example`](.env.server.example) para `.env` (ao lado do `docker-compose.yml`) e preencha:

```bash
DOMAIN=catequese.exemplo.org            # DNS A-record apontando para o VPS
POSTGRES_USER=catechism
POSTGRES_PASSWORD=<senha forte>
POSTGRES_DB=catechism
DATABASE_URL=postgres://catechism:<senha>@db:5432/catechism?sslmode=disable
JWT_SECRET=<openssl rand -base64 48>
ADMIN_EMAIL=<email do admin>
ADMIN_PASSWORD=<senha do admin>
# Backup → Hetzner Storage Box
STORAGEBOX_USER=...  STORAGEBOX_HOST=...  STORAGEBOX_REMOTE_DIR=catechism-backups
BACKUP_PASSPHRASE=<passphrase de cifragem>
```

O **admin** é provisionado de forma idempotente ao iniciar a API (lendo `ADMIN_EMAIL`/`ADMIN_PASSWORD`). Os demais usuários são criados pelo admin/coordenador no painel.

---

## Deploy (Hetzner)

Passo a passo completo em [`infra/README.md`](infra/README.md). Resumo:

1. Criar VPS Hetzner (CPX22, Ubuntu), firewall liberando só 22/80/443.
2. Apontar o **DNS** do domínio para o IP (pré-requisito do TLS).
3. Instalar Docker, clonar o repo em `/opt/catechism`, preencher `.env`.
4. `docker compose up -d --build` → Caddy emite TLS, goose migra, admin é semeado.
5. Agendar o backup noturno (`scripts/backup.sh` via cron) e **testar a restauração** (`scripts/restore.sh`).
6. CI: cadastrar os secrets SSH no GitHub → `git push` na `main` faz deploy automático.

**Custo estimado:** ~€12/mês (VPS + Storage Box + domínio).

---

## Passo a passo: usar no celular (PWA)

A app é instalável como **PWA**. Use a **URL HTTPS** de produção para testar offline e instalação como os utilizadores finais.

**Antes da primeira vez:** com internet, abra o site, faça login e navegue um pouco para o browser cachear o necessário ao modo offline na chamada.

### iPhone e iPad (Safari)

1. Abra a URL da app **no Safari**. No iOS, a instalação na tela inicial costuma funcionar melhor pelo Safari.
2. Toque em **Partilhar** (quadrado com seta para cima).
3. Escolha **Adicionar à Tela de Início** → confirme o nome → **Adicionar**.
4. Abra pelo **ícone** — abre em ecrã quase inteiro.

Para **desinstalar**, mantenha o dedo no ícone → **Remover App**.

### Android (Chrome)

1. Abra a URL no **Chrome**.
2. Use o banner **Instalar app** ou o menu **⋮** → **Instalar app**.
3. Confirme e abra pelo **ícone**.

### Uso no dia a dia (catequista)

1. **Com rede:** abra a app, inicie a chamada e registe presenças normalmente.
2. **Sem rede:** se já usou a app online neste telemóvel, continue a marcar presenças; os dados ficam na fila local até haver rede.
3. **Quando a internet voltar:** mantenha a app aberta um momento — a sincronização corre automaticamente (idempotente). No **Safari/iOS** o Background Sync pode ser limitado; abrir a app quando houver rede costuma bastar.

---

## Contribuindo e agentes (IA)

O repositório inclui orientações para desenvolvimento com assistentes — ver [`AGENTS.md`](AGENTS.md) e [`CLAUDE.md`](CLAUDE.md). O planejamento da migração (PRD, TechSpec, ADRs e tasks) está em [`.compozy/tasks/migration-go/`](.compozy/tasks/migration-go/).

---

## Licença e privacidade

Trate dados de alunos e responsáveis conforme a **LGPD** e políticas da instituição. O PRD lista riscos e mitigações; o TechSpec detalha modelo de dados, autenticação e autorização.
