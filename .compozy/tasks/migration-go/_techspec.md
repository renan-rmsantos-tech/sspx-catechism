# TechSpec: Migração para VPS/Docker com Backend em Go

**Slug:** migration-go
**Data:** 2026-06-23
**PRD:** [`_prd.md`](./_prd.md)

## Executive Summary

Migração do sistema de catequese de **Vercel + Supabase** para **infraestrutura própria de baixo custo** (VPS Hetzner único, ~$10–15/mês), reescrevendo o backend em **Go** e o frontend como **SPA Vite/React**. O Go passa a ser a única fonte de dados e de autorização, falando com um **Postgres auto-hospedado**; o frontend vira conteúdo estático servido pelo **Caddy** (TLS automático). Toda a stack roda em **Docker Compose** num único servidor.

Decisões-chave: **chi + pgx + sqlc** no backend (SQL explícito e type-safe), **goose** para migrações, **JWT em cookie httpOnly** para autenticação e **autorização na camada de aplicação** (reimplementando a matriz de políticas RLS do Supabase). Deploy via **GitHub Actions → SSH**; backup `pg_dump` noturno cifrado no **Hetzner Storage Box**. Como o sistema **ainda não está em produção**, não há migração de dados — o schema é baselinado do zero sem os artefatos Supabase. Principal trade-off: aceitamos um ponto único de falha (mitigado por backups off-site) em troca de custo mínimo e previsível; e assumimos a reimplementação fiel da autorização (antes RLS) em Go, coberta por testes.

## System Architecture

### Component Overview

Topologia em um VPS Hetzner via Docker Compose:

```
Internet (HTTPS) → Caddy (80/443, TLS Let's Encrypt)
   ├── /        → SPA estática (Vite/React) servida pelo Caddy
   └── /api/*   → Go API (chi) ──pgx──> Postgres 16 (rede interna, sem porta exposta)
                                          └── pg_dump noturno → Hetzner Storage Box (SFTP)
```

- **Caddy** — único exposto à internet; serve os estáticos da SPA e faz proxy de `/api/*` para o Go; emite/renova TLS automaticamente. Garante mesma origem (sem CORS).
- **Frontend (Vite + React + React Router + Tailwind/shadcn + vite-plugin-pwa)** — SPA estática; consome `/api` via `fetch` com `credentials: 'include'`. Reaproveita componentes e o offline-first (Dexie + background sync).
- **Go API (chi + pgx + sqlc)** — autenticação (JWT httpOnly), autorização na app, regras de negócio, geração de relatórios (PDF/XLSX), migrações (goose) e bootstrap do admin no startup. Única a tocar o Postgres.
- **Postgres 16** — container com volume nomeado, acessível só pela rede interna do Compose.
- **Backup** — cron `pg_dump` cifrado → Hetzner Storage Box.

**Fluxo:** navegador → Caddy → SPA (estático) ou Go (`/api`) → Postgres. O JWT viaja em cookie httpOnly anexado automaticamente às chamadas same-origin.

## Implementation Design

### Core Interfaces

**Autenticação (claims + middlewares):**
```go
type Claims struct {
    UserID string `json:"sub"`
    Role   string `json:"role"` // admin | coordinator | catechist
    jwt.RegisteredClaims
}
func RequireAuth(next http.Handler) http.Handler
func RequireCoordinator(next http.Handler) http.Handler // 403 se não coord/admin
func CurrentUser(ctx context.Context) Claims
```

**Autorização (substitui RLS):**
```go
type Authorizer interface {
    IsCoordinator(c Claims) bool
    CanAccessClass(ctx context.Context, c Claims, classID string) (bool, error) // catequista da turma OU coordenador
}
```

**Repositório de presença (sync idempotente):**
```go
type AttendanceRepo interface {
    // INSERT ... ON CONFLICT (class_id,date) DO NOTHING RETURNING id
    UpsertSession(ctx context.Context, in SessionInput) (id string, created bool, err error)
    // INSERT ... ON CONFLICT (session_id,student_id) DO NOTHING
    UpsertRecords(ctx context.Context, sessionID string, recs []RecordInput) error
    IsScheduledDate(ctx context.Context, classID, date string) (bool, error)
}
```

**Serviço de auth:**
```go
type AuthService interface {
    Login(ctx context.Context, email, password string) (token string, mustChange bool, role string, err error)
    ChangePassword(ctx context.Context, userID, newPassword string) error
    CreateCatechist(ctx context.Context, email, fullName string) (plaintextPwd string, err error)
    BootstrapAdmin(ctx context.Context, email, password string) error // idempotente, no startup
}
```

**Convenção de erros:** JSON `{"error": "..."}`; validação→400, sem auth→401, sem permissão→403, não encontrado→404, conflito FK `23503`/unique `23505`→409. Validação preserva a leniência de UUID (hex não-RFC4122) do `zPgUuid` atual.

### Data Models

Schema Postgres reaproveitado do atual, **sem os artefatos Supabase**. Mudança central: `profiles` absorve `auth.users`.

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,   -- NOVO (vinha de auth.users)
  password_hash TEXT NOT NULL,          -- NOVO (bcrypt)
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('coordinator','catechist','admin')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Preservadas (estrutura inalterada):** `academic_years`, `classes`, `class_catechists`, `students`, `attendance_sessions` (`UNIQUE(class_id,date)` — chave de idempotência), `attendance_records` (`UNIQUE(session_id,student_id)`), `class_dates` (`UNIQUE(academic_year_id,date)`), `enrollments`. Mesmos campos, tipos, FKs e índices.

**Removido (era Supabase):** FK `profiles.id→auth.users`; todas as policies RLS; schema `private` e funções `is_coordinator`/`is_class_catechist`; trigger/função `handle_new_user`; GRANTs por role Supabase.

**Mantido no banco (puro Postgres):** trigger `validate_class_date_day` em `class_dates` (defesa em profundidade, também validado em Go); extensão `pgcrypto` (`gen_random_uuid()`).

**Migrações:** reescritas como migrações **goose** sequenciais em `backend/db/migrations/`, partindo do schema consolidado. Sem dados a migrar → baseline do zero (sem replicar o histórico 0001–0004).

**DTOs:** structs Go espelhando os schemas Zod atuais (`submitAttendanceSchema`, `createStudentSchema`, etc.), com validação equivalente.

### API Endpoints

Acesso: `[pub]` público, `[auth]` logado, `[coord]` coordenador/admin.

**Auth:** `POST /api/auth/login` [pub] · `POST /api/auth/logout` [auth] · `POST /api/auth/change-password` [auth] · `GET /api/auth/me` [auth].

**Inscrições:** `POST /api/enrollments` [pub] (valida janela do ano ativo) · `GET /api/enrollments` [coord] · `POST /api/enrollments/:id/approve` [coord] · `POST /api/enrollments/:id/reject` [coord].

**Gestão acadêmica:** `GET|POST /api/academic-years` [auth|coord] · `PATCH|DELETE /api/academic-years/:id` [coord] · `GET|PUT /api/class-dates` [auth|coord] · `GET|POST /api/classes` [auth|coord] · `PATCH /api/classes/:id` [coord] · `GET /api/classes/:id/students` [auth] · `GET|POST /api/students` [coord] · `GET|PATCH /api/students/:id` [coord].

**Catequistas:** `GET /api/catechists` [coord] · `POST /api/catechists` [coord] (senha gerada, texto puro 1×) · `PATCH /api/catechists/:id` [coord] (papel / is_active) · `DELETE /api/catechists/:id` [coord] (bloqueia admin e se houver sessões).

**Presença:** `POST /api/attendance` [auth] (sync idempotente: por sessão valida data agendada, `INSERT ON CONFLICT (class_id,date) DO NOTHING`, records `ON CONFLICT (session_id,student_id)`; `catechist_id` = usuário do token; retorna `{synced, skipped}`) · `GET /api/attendance` [auth] (filtros classId/from/to).

**Relatórios:** `GET /api/reports/attendance` [coord] (params `classId/from/to/format` → json/pdf/xlsx).

Verbos de ação (`/approve`, `/reject`) como sub-rota por não serem CRUD puro. Sem paginação (volume pequeno — YAGNI); busca por `ILIKE` (`q`).

## Integration Points

- **Hetzner Cloud (VPS):** CPX22 (ou CX23), Ubuntu LTS. Cloud Firewall expõe só 22/80/443; Postgres nunca exposto.
- **Hetzner Storage Box (backup):** SFTP com chave dedicada; `pg_dump` cifrado, retenção (ex.: 14 diários + 8 semanais); restauração testada (`gunzip | psql`).
- **Let's Encrypt (TLS):** automático via Caddy (ACME); requer DNS apontando para o VPS e 80/443 abertas.
- **GitHub Actions → VPS (deploy):** push à `main` builda imagens (Go multi-stage + Vite) e roda `docker compose up -d` via SSH (chave em secret).
- **E-mail:** fora de escopo — o sistema não envia e-mail (senha do catequista exibida na tela uma vez). Sem provedor SMTP.

Dependências externas em runtime: apenas Hetzner (compute + storage) e Let's Encrypt. Nenhuma chamada a Vercel/Supabase.

## Impact Analysis

| Componente | Tipo de impacto | Mudança e risco | Ação necessária |
|---|---|---|---|
| Backend (Supabase → Go API) | novo | Reescrita completa do backend; risco alto na autorização (era RLS) | Implementar chi+pgx+sqlc; testes da matriz de permissões |
| Frontend (Next.js → Vite SPA) | modificado | Server Components/Actions → cliente HTTP; risco médio de regressão de fluxos | Migrar telas; reaproveitar componentes e Vitest |
| Autenticação (`@supabase/ssr` → JWT) | novo | Novo modelo de sessão (cookie httpOnly); fluxo `must_change_password` preservado | Implementar AuthService + middlewares |
| Schema/Postgres | modificado | `profiles` absorve email+hash; RLS/private/triggers Supabase removidos | Migrações goose; manter `validate_class_date_day` |
| Sync offline de presença | modificado | Endpoint troca de backend; lógica de idempotência preservada | Replicar dedup `(class_id,date)`/`(session_id,student_id)` |
| PWA (Serwist → vite-plugin-pwa) | modificado | Troca de ferramenta de service worker; offline não dependia de Supabase | Portar Dexie + fila + background sync |
| Relatórios (jspdf/xlsx → libs Go) | modificado | Geração PDF/XLSX migra para Go (excelize, gofpdf/maroto) | Reescrever geração no backend |
| Infra/deploy (Vercel → Hetzner/Docker) | novo | Docker Compose + Caddy + CI + backup | Provisionar VPS; pipeline; backup |
| `scripts/migrate.mjs` (Node) | deprecado | Substituído por goose | Remover do pipeline |

## Testing Approach

### Unit Tests
- **Autorização (`Authorizer`)** — área de maior risco (substitui RLS): cobrir cada regra da matriz (coordenador vê tudo; catequista restrito às suas turmas; bloqueios de papel). Mock do repositório.
- **Auth** — login (senha certa/errada, inativo), bcrypt, JWT, fluxo `must_change_password`, geração de senha do catequista.
- **Validação de DTOs** — leniência de UUID (hex não-RFC4122), regex de data.

### Integration Tests
Contra Postgres real (`testcontainers-go` ou Postgres efêmero no CI):
- **Sync de presença idempotente** — reenviar o mesmo lote não duplica; data não agendada → `skipped`; `catechist_id` vem do token.
- **Trigger `validate_class_date_day`** — data em dia não permitido falha.
- **Guardas de FK** — excluir ano/turma/aluno com dependências → 409; excluir catequista com sessões → bloqueado.
- **Janela de inscrição** — submissão fora do período rejeitada.
- **Handlers** — tabela por endpoint cobrindo 200/400/401/403/404/409 com cookie JWT por papel.

### Frontend
- Migrar a suíte **Vitest existente (25 arquivos)**; reaproveitar componentes/schemas/helpers, ajustando os pontos que assumiam Server Actions para o cliente HTTP.
- Testar o cliente de API e a fila offline (Dexie + `syncPendingSessions`) com `fetch` mockado.

### Aceitação
- Checklist manual dos 3 perfis cobrindo todos os fluxos do PRD — critério de paridade funcional.
- **CI:** `go test ./...` + `vitest run` + `tsc --noEmit` em cada PR.

## Development Sequencing

### Build Order
1. **Etapa 0 — Andaime do monorepo** (sem dependências): `frontend/` (Vite), `backend/` (Go: chi/pgx/sqlc/goose), raiz com `docker-compose.yml`, `Caddyfile`, `.github/workflows/`. Compose local: Postgres + API + Caddy + frontend.
2. **Etapa 1 — Fundação e Auth** (depende de 0 · Fase 1 do PRD): migrações goose; bootstrap do admin; `AuthService` (login bcrypt, JWT, change-password, criar catequista); middlewares + `Authorizer`; telas de login/troca de senha; guarda de rotas no React Router. **Critério:** login dos 3 perfis ponta a ponta no Docker, com autorização correta.
3. **Etapa 2 — Gestão e Inscrição** (depende de 1 · Fase 2): endpoints + telas de anos letivos, turmas, alunos, calendário, catequistas, inscrição pública + revisão, relatórios (Go). **Critério:** fluxos validados (testes + manual).
4. **Etapa 3 — Chamada offline e finalização** (depende de 2 · Fase 3): `/api/attendance` (sync idempotente) + GET; PWA via vite-plugin-pwa; portar Dexie + sync + background sync; backup automático + teste de restauração; desligar Vercel/Supabase. **Critério final:** paridade total, custo ≤ $15/mês, backup+restore comprovados, zero Vercel/Supabase.

### Runbook de provisionamento do Hetzner
1. Criar servidor Hetzner Cloud (CPX22, Ubuntu LTS) com chave SSH.
2. Hardening: login só por chave, sem root/senha; `ufw` + Cloud Firewall liberando 22/80/443.
3. Instalar Docker + Compose plugin.
4. DNS: A-record do domínio → IP (pré-requisito do TLS).
5. `.env` no servidor: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL/PASSWORD`, credenciais Storage Box.
6. Primeiro deploy: `docker compose up -d` → Caddy emite TLS, goose migra, admin é semeado.
7. Backup: chave SFTP para o Storage Box + cron noturno; rodar restauração de teste.
8. CI: cadastrar secrets SSH no GitHub → deploy automático no push à `main`.

### Technical Dependencies
- Domínio registrado + acesso ao DNS (para TLS).
- Conta Hetzner (Cloud + Storage Box).
- Decisão de build no CI vs no VPS (registrar no runbook).

## Monitoring and Observability

- **Logs estruturados** (Go `slog`, JSON): request id, user id, role, rota, status, latência; eventos de auth (login ok/falha, troca de senha, criação de catequista) e de sync (`synced`/`skipped`).
- **Healthcheck** `GET /api/health` (DB ping) usado pelo healthcheck do Compose e pelo Caddy.
- **Métricas-chave:** taxa de erro 5xx, latência das rotas, falhas de login, resultado do backup noturno.
- **Alertas (leves para projeto de uma pessoa):** falha do backup noturno e container reiniciando em loop — via logs/uptime check externo (ex.: ping de healthcheck). Observabilidade pesada (Prometheus/Grafana) é não-objetivo (YAGNI).

## Technical Considerations

### Key Decisions
- **SPA Vite/React + Go como única fonte** (ADR-002): simplicidade e sem runtime Node no servidor; trade-off = reescrever telas que eram Server Components.
- **chi + pgx + sqlc + goose + bcrypt** (ADR-003): SQL explícito/type-safe para joins e upserts críticos; trade-off = SQL à mão vs ORM.
- **JWT em cookie httpOnly + autorização na app** (ADR-004): stateless e same-origin; trade-off = reimplementar fielmente a matriz RLS e ausência de revogação imediata.
- **Docker Compose + GitHub Actions→SSH + backup Hetzner Storage Box** (ADR-005): reproduzível e barato; trade-off = ponto único de falha e backup no mesmo fornecedor.

### Known Risks
- **Divergência da autorização (era RLS) em Go** — probabilidade média, impacto alto. Mitigação: testes unitários cobrindo toda a matriz + testes de integração por endpoint/perfil.
- **Regressão de fluxos ao reescrever o frontend** — média/média. Mitigação: reaproveitar Vitest + checklist manual dos 3 perfis.
- **Idempotência do sync offline** — baixa/alta. Mitigação: testes de reenvio de lote; `ON CONFLICT` no banco; `catechist_id` do token.
- **Perda de dados (ponto único de falha)** — baixa/alta. Mitigação: `pg_dump` noturno off-site cifrado + restauração testada + snapshots.
- **CSRF (cookie de auth)** — baixa/média. Mitigação: SameSite=Lax + verificação de Origin se necessário.

## Architecture Decision Records

- [ADR-001: Hospedagem em VPS único com Docker Compose](adrs/adr-001.md) — VPS Hetzner via Docker Compose, rejeitando AWS/GCP e frontend-em-CDN por custo. *(PRD)*
- [ADR-002: Frontend como SPA Vite/React consumindo a API Go](adrs/adr-002.md) — Migrar Next.js para SPA estática Vite, Go como única fonte de dados.
- [ADR-003: Stack do backend Go — chi + pgx + sqlc, migrações goose](adrs/adr-003.md) — SQL explícito/type-safe, bcrypt, migrações goose.
- [ADR-004: JWT em cookie httpOnly e autorização na camada de aplicação](adrs/adr-004.md) — Auth stateless same-origin; matriz RLS reimplementada em Go.
- [ADR-005: Docker Compose, deploy GitHub Actions→SSH, backup Hetzner Storage Box](adrs/adr-005.md) — Empacotamento, TLS Caddy, CI e backup off-site.

## Open Questions

- **Build no CI vs no VPS:** transferir imagens do runner ou buildar no servidor (e se usar GHCR) — definir no runbook de deploy.
- **Lib de PDF em Go:** `gofpdf` vs `maroto` para os relatórios — decidir na implementação da Etapa 2.
- **Retenção/cifragem do backup:** parâmetros finais (nº de diários/semanais, `gpg` vs `age`) — ajustar na Etapa 3.
- **Expiração do JWT e revogação:** definir tempo de expiração; reavaliar sessão opaca se revogação imediata virar requisito.
