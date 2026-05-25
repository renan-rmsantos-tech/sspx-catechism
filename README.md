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

- **Papéis:** **admin** — acesso total, gestão de catequistas e anos letivos; **coordenador** — turmas, alunos, catequistas, relatórios; **catequista** — apenas turmas às quais está vinculado, chamada e histórico. O acesso é reforçado no banco com **RLS** (Row Level Security), não só na interface.
- **Offline-first na chamada:** a fila fica no dispositivo (IndexedDB) e tenta enviar ao servidor ao voltar online; em Safari/iOS o **Background Sync** pode ser limitado — há fallback com o evento `online` (ver TechSpec).
- **LGPD:** dados de menores e responsáveis são sensíveis; apenas usuários autorizados devem acessar o sistema. Consentimento e processo paroquial ficam fora do código, mas o desenho do produto assume essa obrigação.
- **Escopo do MVP:** uma paróquia, sem portal para pais, sem notificações automáticas de falta, sem multi-paróquia (detalhes em *Non-Goals* do PRD).
- **Linguagem da UI:** português brasileiro, vocabulário paroquial (turma, catequista, aluno).
- **Segredos:** `SUPABASE_SECRET_KEY` (recomendada, formato `sb_secret_…`) ou, em legado, `SUPABASE_SERVICE_ROLE_KEY` (JWT `service_role`) — **somente servidor** (nunca no client nem em `NEXT_PUBLIC_*`). Validação em `lib/supabase/config.ts`.

---

## Painel administrativo (`/admin`)

Toda a gestão acontece no painel em `/admin`, acessível após login. A sidebar agrupa as funcionalidades em três secções:

| Secção | Página | Descrição |
| --- | --- | --- |
| — | **Visão Geral** | Dashboard com resumo de turmas, alunos e chamadas |
| Gestão | **Turmas** | CRUD de turmas com vinculação de catequistas |
| Gestão | **Alunos** | Cadastro de alunos com dados pessoais e de responsáveis |
| Gestão | **Catequistas** | Gestão de catequistas (admin apenas) |
| Gestão | **Relatórios** | Exportação de relatórios (PDF/Excel) com preview |
| Aulas | **Chamadas** | Registro de presença por turma (funciona offline) |
| Aulas | **Calendário** | Calendário unificado com dias da semana configuráveis por ano letivo |

O papel **admin** tem acesso a todas as páginas e pode gerenciar catequistas e anos letivos. **Coordenadores** gerenciam turmas, alunos e relatórios. **Catequistas** veem apenas as turmas vinculadas e registram chamadas.

---

## Pré-requisitos

- Contas **Vercel** e **Supabase**, com o repositório Git ligado à Vercel.
- **Dois projetos Supabase** (recomendado): um para **Preview / desenvolvimento** e outro para **Production**, ambos com o mesmo schema em [`supabase/migrations/`](supabase/migrations/).
- **Node.js 20+** só é necessário na sua máquina se for correr `npm run lint`, `npm test` ou a CLI via npm; a aplicação em si executa na Vercel.
- As **migrações SQL** são aplicadas automaticamente a cada deploy (via `supabase db push` no build). O **admin** é provisionado automaticamente ao iniciar o servidor, lendo `ADMIN_EMAIL` e `ADMIN_PASSWORD` das variáveis de ambiente.

---

## Novo projeto Supabase (incluindo recriar do zero)

1. Crie o projeto em [Supabase Dashboard](https://supabase.com/dashboard) e copie **URL** e chaves em **Project Settings → API Keys**.
2. **Aplique o schema:** com `SUPABASE_DB_URL` configurada na Vercel, as migrações rodam automaticamente no build. Para setup manual: `npm install`, `npm run supabase:link`, `npm run supabase:push`.
3. Se algo falhar na criação da extensão, em **Database → Extensions** ative manualmente **pgcrypto**.
4. **Admin:** provisionado automaticamente ao iniciar o servidor a partir de `ADMIN_EMAIL` e `ADMIN_PASSWORD` (env vars). Os demais utilizadores são criados pelo admin no painel.
5. **Authentication → URL configuration:** **Site URL** = URL principal da app (por exemplo o domínio de **Production** na Vercel). Em **Redirect URLs**, inclua as origens que a Vercel usa, por exemplo `https://seu-app.vercel.app/**` e, para previews, `https://*.vercel.app/**` (ou liste URLs fixas, conforme a política que quiser).

Repita os passos 2–5 no projeto Supabase de **produção** quando for dar deploy final.

### Admin

O admin é criado automaticamente ao iniciar o servidor, com base nas variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD` configuradas na Vercel. Se o utilizador já existir, apenas garante que o profile tem role `admin`.

---

## Variáveis de ambiente

Configure na **Vercel** (**Project → Settings → Environment Variables**). Modelo em [`.env.example`](.env.example).

- **Production:** variáveis apontando para o Supabase de **produção**.
- **Preview** (e **Development** na Vercel, se usar): apontando para o Supabase de **dev**, para não misturar dados.

O projeto aceita chaves novas e legadas do Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=<URL do projeto>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_…>  # ou NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY=<sb_secret_…>                       # ou SUPABASE_SERVICE_ROLE_KEY

# Migrações automáticas no build
SUPABASE_DB_URL=<connection string PostgreSQL>

# Admin provisionado ao iniciar o servidor
ADMIN_EMAIL=<email do admin>
ADMIN_PASSWORD=<senha do admin>
```

Documentação: [API keys](https://supabase.com/docs/guides/api/api-keys).

---

## Vercel

1. [Importe o repositório](https://vercel.com/new); Next.js é detetado automaticamente.
2. Associe variáveis por ambiente (Production vs Preview) conforme a secção anterior.
3. Faça deploy. O PWA (service worker) segue a configuração de build; em desenvolvimento local o PWA costuma estar desligado (`next.config.ts`).

Confirme login com o admin, crie os demais utilizadores pelo painel e, se aplicável, teste chamada offline num dispositivo real.

---

## Opcional na sua máquina (CI / PR)

Não é obrigatório correr a app localmente. Para lint e testes:

```bash
git clone <url-do-repositório>
cd catechism
npm install
npm run lint
npm test
```

O ficheiro [`supabase/seed.sql`](supabase/seed.sql) contém dados de exemplo (turmas, alunos) para desenvolvimento — execute no **SQL Editor** se quiser popular o ambiente de homologação.

---

## Passo a passo: usar no celular (PWA)

A app é instalável como **PWA**. O **service worker** só entra em ação nos **deploys na Vercel** (Production / Preview); use uma **URL HTTPS** desses ambientes para testar offline e instalação como os utilizadores finais.

**Antes da primeira vez:** com internet, abra o site, faça login e navegue um pouco para o browser cachear o necessário ao modo offline na chamada.

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

Use **Preview** ou **Production** na Vercel (**HTTPS**). O Supabase Auth deve ter essas URLs nas **Redirect URLs** (wildcard de preview ou URLs por branch).

---

## Scripts NPM


| Comando                 | Descrição                                                |
| ----------------------- | -------------------------------------------------------- |
| `npm run supabase:link` | Liga o diretório `supabase/` a um projeto cloud (`link`) |
| `npm run supabase:push` | Envia migrações para o projeto ligado (`db push`)        |
| `npm run dev`           | Servidor Next local (opcional)                           |
| `npm run build`         | Build de produção (também usado na Vercel)               |
| `npm run start`         | Serve o build localmente (opcional)                      |
| `npm run lint`          | Verificação TypeScript (`tsc --noEmit`)                  |
| `npm test`              | Testes Vitest                                            |
| `npm run test:watch`    | Vitest em modo watch                                     |


---

## Contribuindo e agentes (IA)

O repositório inclui orientações para desenvolvimento com assistentes — ver `[AGENTS.md](AGENTS.md)` e `[CLAUDE.md](CLAUDE.md)`.

---

## Licença e privacidade

Trate dados de alunos e responsáveis conforme a **LGPD** e políticas da instituição. O PRD lista riscos e mitigações; o TechSpec detalha modelo de dados e segurança (RLS).