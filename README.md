# Catechism — gestão de presença para catecismo

Aplicação web/PWA para **uma paróquia** gerenciar **cadastro de alunos** de catecismo e **chamada de presença** por turma. O foco é substituir listas em papel, centralizar dados pessoais, pastorais e de contato dos responsáveis, e permitir que **catequistas** registrem a chamada no celular — inclusive **offline**, com sincronização automática quando a conexão voltar. **Coordenadores** usam um painel para turmas, alunos e relatórios.

Documentação de produto e arquitetura (fonte da verdade para escopo e stack):

- [PRD](.compozy/tasks/catechism-attendance/_prd.md) — visão, personas, funcionalidades e fases
- [TechSpec](.compozy/tasks/catechism-attendance/_techspec.md) — arquitetura, modelo de dados, APIs e decisões técnicas

---

## Stack


| Camada          | Tecnologia                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| App             | [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript                                          |
| UI              | Tailwind CSS, [shadcn/ui](https://ui.shadcn.com), [Base UI](https://base-ui.com)                             |
| Backend / dados | [Supabase](https://supabase.com) (PostgreSQL, Auth, Row Level Security)                                      |
| Offline         | PWA (`[@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa)`), [Dexie](https://dexie.org) (IndexedDB) |
| Relatórios      | jsPDF, xlsx (geração no servidor)                                                                            |
| Deploy          | [Vercel](https://vercel.com) (recomendado)                                                                   |


---

## Regras e princípios principais

- **Papéis:** **coordenador** — turmas, alunos, catequistas, relatórios; **catequista** — apenas turmas às quais está vinculado, chamada e histórico. O acesso é reforçado no banco com **RLS** (Row Level Security), não só na interface.
- **Offline-first na chamada:** a fila fica no dispositivo (IndexedDB) e tenta enviar ao servidor ao voltar online; em Safari/iOS o **Background Sync** pode ser limitado — há fallback com o evento `online` (ver TechSpec).
- **LGPD:** dados de menores e responsáveis são sensíveis; apenas usuários autorizados devem acessar o sistema. Consentimento e processo paroquial ficam fora do código, mas o desenho do produto assume essa obrigação.
- **Escopo do MVP:** uma paróquia, sem portal para pais, sem notificações automáticas de falta, sem multi-paróquia (detalhes em *Non-Goals* do PRD).
- **Linguagem da UI:** português brasileiro, vocabulário paroquial (turma, catequista, aluno).
- **Segredos:** `SUPABASE_SECRET_KEY` (recomendada, formato `sb_secret_…`) ou, em legado, `SUPABASE_SERVICE_ROLE_KEY` (JWT `service_role`) — **somente servidor** (nunca no client nem em `NEXT_PUBLIC_*`). Validação em `lib/supabase/config.ts`.

---

## Pré-requisitos

- **Node.js** 20+ (recomendado; alinhado ao `package.json`)
- **npm** (há `package-lock.json` no repositório)
- Conta **Supabase** (cloud) e, para banco local, **Supabase CLI** ([instalação](https://supabase.com/docs/guides/cli))

---

## Passo a passo: ambiente local

### 1. Clonar e instalar dependências

```bash
git clone <url-do-repositório>
cd catechism
npm install
```

### 2. Banco de dados e Supabase

**Opção A — Supabase na nuvem (mais próximo da produção)**

1. Crie um projeto em [Supabase Dashboard](https://supabase.com/dashboard).
2. Aplique o schema: o SQL completo está em `[supabase/migrations/0001_initial_schema.sql](supabase/migrations/0001_initial_schema.sql)` (tabelas, RLS em `private`, políticas e revogações de RPC no trigger). Use o SQL Editor do Supabase ou a CLI (`supabase link` + **`supabase db push`** sobre o diretório de migrações).
3. Em **Authentication → URL configuration**, configure a **Site URL** (ex.: `http://localhost:3000` em dev) e **Redirect URLs** permitidas (ex.: `http://localhost:3000/`**).
4. Crie usuários de teste via SQL Editor: use `[supabase/scripts/setup_prod_users.sql](supabase/scripts/setup_prod_users.sql)` (cria os três perfis de dev com hash correto para produção). O `seed.sql` também pode ser colado, mas é voltado ao CLI local — para a nuvem o script dedicado é mais seguro.

**Opção B — Supabase local (CLI)**

```bash
supabase start
```

Isso sobe API, Postgres e Studio localmente. Para aplicar migrações e seed de dev:

```bash
supabase db reset
```

Obtenha URL e chaves anon com:

```bash
supabase status
```

Use a **publishable key** (`sb_publishable_…`) ou o **anon** (JWT) e a **API URL** (geralmente `http://127.0.0.1:54321`) no arquivo de ambiente da próxima etapa.

#### Usuários de teste (após `supabase db reset` ou aplicar `seed.sql` em dev)

| E-mail | Papel | Nome no perfil |
| --- | --- | --- |
| `coord@catechism.dev` | coordenador | Maria Coordenadora |
| `catechist1@catechism.dev` | catequista | João Catequista |
| `catechist2@catechism.dev` | catequista | Ana Catequista |

**Senha** (igual para as três contas): `password123` — só para desenvolvimento; **nunca** em produção.

### 3. Variáveis de ambiente

Crie `.env.local` na raiz (**não commite** este arquivo). Um modelo versionado está em [`.env.example`](.env.example). O Supabase passou a chaves novas ([API keys](https://supabase.com/docs/guides/api/api-keys)); este projeto aceita os nomes novos **e** os legados:

```bash
NEXT_PUBLIC_SUPABASE_URL=<URL do projeto Supabase>
# Cliente público (uma das duas):
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_… — recomendado>
# ou, legado:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon JWT>
# Servidor apenas (uma das duas):
SUPABASE_SECRET_KEY=<sb_secret_… — recomendado>
# ou, legado:
# SUPABASE_SERVICE_ROLE_KEY=<service_role JWT>
```

- No dashboard: **Project Settings → API Keys** (`sb_publishable_…` / `sb_secret_…`). Chaves legadas ficam na aba **Legacy anon, service_role**.
- **Supabase local:** use a saída de `supabase status` (URL + chave anônima / publishable, conforme sua versão da CLI).

### 4. Rodar o app

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

O PWA/service worker é **desativado em desenvolvimento** (`next.config.ts`); para testar cache/offline como em produção, use um build de produção local (passo opcional abaixo).

### 5. Verificação rápida (opcional)

```bash
npm run lint
npm test
```

Build de produção local (útil para validar PWA e bundle):

```bash
npm run build
npm run start
```

---

## Passo a passo: produção (Vercel + Supabase)

1. **Repositório:** envie o código para o Git (GitHub, GitLab ou Bitbucket) se ainda não estiver.
2. **Supabase (produção):** projeto dedicado em produção, com o mesmo schema aplicado (`supabase/migrations`). Revise políticas RLS após migrações.
3. **Usuários de teste:** no **SQL Editor** do Supabase, cole e execute [`supabase/scripts/setup_prod_users.sql`](supabase/scripts/setup_prod_users.sql). O script limpa qualquer inserção quebrada e recria os usuários com `instance_id` e hash gerado via `pgcrypto` — necessário para o GoTrue autenticar em produção.
4. **Auth:** em Authentication → URL configuration, defina **Site URL** como a URL pública da Vercel (ex.: `https://seu-app.vercel.app`) e inclua redirects para essa origem (`https://seu-app.vercel.app/**`).
5. **Vercel:** [importe o repositório](https://vercel.com/new), framework Next.js detectado automaticamente.
6. **Variáveis de ambiente na Vercel:** em **Project → Settings → Environment Variables**, cadastre `NEXT_PUBLIC_SUPABASE_URL`, uma chave pública (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`), e uma chave de servidor (`SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`), para Production (e Preview, se usar projeto de staging).
7. **Deploy:** dispare um deploy (push na branch conectada ou “Redeploy”). O build gera também artefatos PWA em `public/` (ex.: service worker conforme `@ducanh2912/next-pwa`).

Confirme login, fluxo coordenador/catequista e, se aplicável, chamada offline em um dispositivo real.

---

## Passo a passo: usar no celular (PWA)

A app é instalável como **PWA**. O **service worker só entra em ação em build de produção** (Vercel ou `npm run build` + `npm run start`). Em `npm run dev` o PWA fica desligado — use a **URL HTTPS de produção** (ou staging) para testar no telemóvel como os catequistas vão usar.

**Antes da primeira vez:** abra o site **com internet**, faça login e navegue um pouco para o navegador cachear os ficheiros necessários ao modo offline na chamada.

### iPhone e iPad (Safari)

1. Abra a URL da app **no Safari** (ex.: `https://seu-app.vercel.app`). No iOS, a instalação na tela inicial costuma funcionar melhor pelo Safari que por outros browsers.
2. Toque no botão **Partilhar** (ícone quadrado com seta para cima).
3. Role e escolha **Adicionar à Tela de Início**.
4. Confirme o nome e toque **Adicionar**.
5. No ecrã principal, abra o **ícone** da app — abre em ecrã quase inteiro (sem barra do Safari habitual).

Para **desinstalar**, mantenha o dedo premido no ícone → **Remover App** → **Remover da Tela Inicial** (ou equivalente conforme a versão do iOS).

### Android (Chrome)

1. Abra a URL da app no **Chrome**.
2. Dependendo da versão, aparece um banner **Instalar app** **ou** abra o menu **⋮** → **Instalar app** / **Adicionar à tela inicial**.
3. Confirme a instalação.
4. Abra pelo **ícone** na gaveta de apps ou no ecrã inicial.

Para **desinstalar**, como qualquer app instalada via Chrome: definições do Chrome ou arrastar o ícone para **Desinstalar** (varia por fabricante).

### Uso no dia a dia (catequista)

1. **Com rede:** abra a app (ou o site), inicie a chamada e registe presenças normalmente.
2. **Sem rede:** se já usou a app online neste telemóvel, continue a marcar presenças; os dados ficam na fila local até haver rede.
3. **Quando a internet voltar:** mantenha a app aberta um momento ou volte mais tarde — a sincronização corre automaticamente. No **Safari/iOS** o recurso Background Sync pode ser limitado; nesse caso, abrir a app quando houver rede costuma bastar para enviar chamadas pendentes.

### Desenvolvimento: testar no telemóvel

- `**localhost` no PC** não está acessível diretamente como `localhost` no telemóvel. Opções: **URL de produção/preview na Vercel**, ou exponha o servidor com HTTPS (tunnel tipo [ngrok](https://ngrok.com/) ou `cloudflared`) e compatibilize redirects no Supabase Auth com essa URL temporária.
- **HTTPS** é habitualmente exigido para service worker fora de `localhost`; por isso a validação fiel ao PWA costuma ser em **staging/produção**.

---

## Scripts NPM


| Comando              | Descrição                               |
| -------------------- | --------------------------------------- |
| `npm run dev`        | Servidor de desenvolvimento             |
| `npm run build`      | Build de produção                       |
| `npm run start`      | Serve o build localmente                |
| `npm run lint`       | Verificação TypeScript (`tsc --noEmit`) |
| `npm test`           | Testes Vitest                           |
| `npm run test:watch` | Vitest em modo watch                    |


---

## Contribuindo e agentes (IA)

O repositório inclui orientações para desenvolvimento com assistentes — ver `[AGENTS.md](AGENTS.md)` e `[CLAUDE.md](CLAUDE.md)`.

---

## Licença e privacidade

Trate dados de alunos e responsáveis conforme a **LGPD** e políticas da instituição. O PRD lista riscos e mitigações; o TechSpec detalha modelo de dados e segurança (RLS).