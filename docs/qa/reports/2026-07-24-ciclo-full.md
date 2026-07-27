# QA Run Report — 2026-07-24 — ciclo-full

- **Scope:** primeiro ciclo full pós-redesign (commit `429cc0b` refez toda a UI com o design system Catequese). Plano: `2026-07-24-bootstrap-plano-full.md`. Cobre as 6 jornadas / 7 charters / 32 cenários do plano.
- **Cadence tier:** full
- **Build:** `429cc0b` (main) + árvore docs/qa untracked · **Environment:** http://localhost:5173 (Vite dev, proxy /api → Go :8080, Postgres 16 em Docker, admin semeado via .env)
- **Started:** 2026-07-24T19:55-03:00 · **Finished:** 2026-07-25T03:40-03:00 · **Status:** closed

## Preconditions

- Suíte do CI (a que o projeto define): **verde** — backend `go build`/`go vet`/`go test` 184 pass; frontend Vitest 53 pass.
- Suíte de integração (fora do CI, exige `TEST_DATABASE_URL`): 157 pass, **1 fail** — `TestAcademicYearCRUD` (`academic_year_integration_test.go:145`, "list length = 2, want 1"). Diagnóstico: **asserção obsoleta do teste** — o bloco "Create with enrollment window" cria um 2º ano (2027) e a asserção antiga da listagem ainda espera 1. Bug de teste, não de produto; roteado ao `agent-output-audit` (higiene de teste). Não bloqueia o ciclo.
- **Parity notes:** (1) Vite dev server — service worker/PWA install não é exercido como em produção; a fila offline (Dexie + listener `online`) e o botão de sync manual funcionam em dev e são o que as sessões medem; instalação PWA/Background Sync real ficam como verificação humana. (2) Rede "flaky" emulada com `agent-browser set offline` + `network route --abort` (sem throttling de banda real). (3) Zoom 150% do Joaquim aproximado via font-size 150% na raiz (equivale ao ajuste de fonte do sistema em apps rem-based). (4) Driver dos fluxos: `agent-browser` 0.27.0 (npx), sessões nomeadas por persona.

## Personas

| Persona | Base | Device / Network / Locale | Sessions |
|---|---|---|---|
| Anselmo | Power User | desktop 1280×800 / wifi / pt-BR | CH-preparar-ano-colando-datas, CH-revisao-inscricoes-duas-abas, CH-relatorio-fim-de-periodo |
| Camila | New User | phone-large 390×844 / wifi / pt-BR | CH-primeiro-acesso-senha-provisoria |
| Tereza | Mobile User | phone-large 390×844 / flaky / pt-BR | CH-chamada-offline-rede-instavel |
| Joaquim | Accessibility-Reliant | phone-large 390×844 + fonte 150% / 4g / pt-BR | CH-chamada-interrompida-zoom |
| Marta | New User | phone-small 375×812 / 4g / pt-BR | CH-inscricao-celular-primeira-vez |

## Flows in Scope

- `J-preparar-ano-letivo` — o ano montado uma vez faz o resto do produto funcionar (`../journeys/J-preparar-ano-letivo.md`)
- `J-primeiro-acesso-catequista` — da senha provisória ao dashboard (`../journeys/J-primeiro-acesso-catequista.md`)
- `J-fazer-chamada-offline` — a presença chega intacta com a rede que houver (`../journeys/J-fazer-chamada-offline.md`)
- `J-inscrever-catequizando` — a família matricula sem ir à secretaria (`../journeys/J-inscrever-catequizando.md`)
- `J-aprovar-inscricao` — cada inscrição vira aluno na turma certa (`../journeys/J-aprovar-inscricao.md`)
- `J-emitir-relatorio` — os números apresentados batem com as chamadas (`../journeys/J-emitir-relatorio.md`)

**Ordem de execução** (difere da ordem de risco do plano por dependência de dados — a base nasce vazia e cada sessão produz o mundo da seguinte): S1 preparar-ano → S2 primeiro-acesso → S3 chamada-offline → S4 chamada-zoom → S5 inscrição → S6 revisão → S7 relatório.

## Session Matrix & Results

| # | Charter | Journey / Scenario | Persona | Tour | Status | Issue | Fix commit |
|---|---|---|---|---|---|---|---|
| 1 | CH-preparar-ano-colando-datas | J-preparar-ano-letivo / ADM-criar-ano-dias-aula | Anselmo | Paste | Fixed | BUG-20260724-editar-ano-sempre-falha; BUG-20260724-remover-ano-sem-confirmacao | dd2b09a |
| 2 | CH-preparar-ano-colando-datas | J-preparar-ano-letivo / ADM-colar-datas-calendario | Anselmo | Paste | Pass | | |
| 3 \1| Pass |  |  |
| 4 | CH-preparar-ano-colando-datas | J-preparar-ano-letivo / ADM-criar-turma-vincular-catequista | Anselmo | Paste | Fixed | BUG-20260724-criar-turma-impossivel | dd2b09a |
| 5 | CH-preparar-ano-colando-datas | J-preparar-ano-letivo / ADM-dois-anos-ativos | Anselmo | Paste | Blocked (human decision) | BUG-20260724-dois-anos-ativos-sem-aviso | |
| 6 | CH-preparar-ano-colando-datas | J-preparar-ano-letivo / ADM-promovido-some-da-lista | Anselmo | Paste | Blocked (human decision) | BUG-20260724-promovida-some-da-lista | |
| 7 \1| Pass |  |  |
| 8 | CH-primeiro-acesso-senha-provisoria | J-primeiro-acesso-catequista / AUTH-senha-inicial-uma-vez | Camila (setup: Anselmo) | Autofill | Pass |  |  |
| 9 | CH-primeiro-acesso-senha-provisoria | J-primeiro-acesso-catequista / AUTH-troca-forcada-primeiro-login | Camila | Autofill | Pass |  |  |
| 10 | CH-primeiro-acesso-senha-provisoria | J-primeiro-acesso-catequista / AUTH-regras-senha-divergentes | Camila | Autofill | Blocked (human decision) | BUG-20260724-regras-senha-divergentes |  |
| 11 | CH-primeiro-acesso-senha-provisoria | J-primeiro-acesso-catequista / AUTH-usuario-inativo-bloqueado | Camila | Autofill | Pass |  |  |
| 12 \1| Fixed (retest do 429 ao final) | BUG-20260724-limite-login-ingles-sem-guia | f6b4c5d |
| 13 \1| Fixed | BUG-20260724-chamada-data-utc-errada; BUG-20260724-so-proxima-turma-tem-chamada | f6b4c5d |
| 14 \1| Fixed | BUG-20260724-salvando-infinito-offline; BUG-20260725-marcacoes-somem-no-reload | e62e6c9; f6b4c5d |
| 15 \1| Fixed | BUG-20260724-refazer-chamada-descartada-em-silencio | e62e6c9; f6b4c5d |
| 16 \1| Fixed | BUG-20260724-refazer-chamada-descartada-em-silencio | e62e6c9; f6b4c5d |
| 17 \1| Blocked (human decision) | BUG-20260724-sessao-expirada-sem-caminho |  |
| 18 \1| Pass |  |  |
| 19 \1| Pass |  |  |
| 20 \1| Fixed | BUG-20260725-dia-de-aula-do-ano-errado | 2ca939b |
| 21 \1| Pass |  |  |
| 22 \1| Pass |  |  |
| 23 \1| Blocked (human decision) | BUG-20260725-voltar-do-navegador-perde-inscricao |  |
| 24 \1| Pass |  |  |
| 25 \1| Pass |  |  |
| 26 \1| Pass |  |  |
| 27 \1| Blocked (human decision) | BUG-20260725-renovacao-exige-uuid |  |
| 28 \1| Blocked (human decision) | BUG-20260725-motivo-rejeicao-invisivel |  |
| 29 \1| Pass |  |  |
| 30 \1| Fixed | BUG-20260725-previa-relatorio-tela-branca | eb7b9f6 |
| 31 \1| Pass |  |  |
| 32 \1| Pass |  |  |

Status legend: `Pending | Pass | Fixed | Skipped | Blocked (needs human verify) | Blocked (human decision)`

## Session Debriefs

<!-- One block per charter run, written within 5 minutes of the box ending. -->

### CH-preparar-ano-colando-datas — Anselmo

- **Ran:** 2026-07-24 ~20:05 → ~20:50 (box 90 respeitado: sim)
- **Findings:**
  - **Editar ano letivo é impossível** — todo PATCH da UI leva `year` e o backend rejeita com `unknown field` vazado cru na tela (Blocks-Completion: o ritual anual de abrir/fechar janela num ano existente não existe). BUG-20260724-editar-ano-sempre-falha.
  - **Criar turma é impossível** — o form manda `isArchived` e o create rejeita; bloqueia chamada/relatório a jusante (Blocks-Completion). BUG-20260724-criar-turma-impossivel.
  - **Remover ano**: hard delete sem confirmação, sem feedback, tabela stale até reload; segundo clique gera 404 confuso (Trust-Damage). BUG-20260724-remover-ano-sem-confirmacao.
  - **Dois anos ativos aceitos em silêncio**; inscrição pública seguiu funcionando resolvendo um deles arbitrariamente (Trust-Damage). BUG-20260724-dois-anos-ativos-sem-aviso.
  - **Promoção faz a pessoa sumir** de todas as telas, sem confirmação e sem caminho de volta (Trust-Damage). BUG-20260724-promovida-some-da-lista.
  - Caminhos que funcionaram bem: criação de ano com janela validada (erro inline claro "O encerramento deve ser posterior à abertura", input preservado); colagem de datas com recusa por dia da semana listando a data exata (`2026-07-22`), dedup silencioso de duplicata, persistência confirmada em fresh load; 409 ao excluir ano com dependências.
- **Bugs filed/updated:** [BUG-20260724-editar-ano-sempre-falha, BUG-20260724-criar-turma-impossivel, BUG-20260724-remover-ano-sem-confirmacao, BUG-20260724-dois-anos-ativos-sem-aviso, BUG-20260724-promovida-some-da-lista]
- **Scenarios settled:** ADM-criar-ano-dias-aula → pass (bugs vinculados) · ADM-colar-datas-calendario → pass · ADM-criar-turma-vincular-catequista → fail · ADM-dois-anos-ativos → fail · ADM-promovido-some-da-lista → fail · (ADM-data-travada e ADM-remocao-bloqueada aguardam mundo com chamadas)
- **Paper cuts:** ver tabela; destaque: erro de formato do calendário não diz QUAL linha; datas em ISO cru na tabela de anos; mensagem do 409 de exclusão de ano diz "turmas vinculadas" quando a dependência era uma inscrição.
- **Surprises:** o formulário público aceitou inscrição com dois anos ativos (resolução silenciosa); o badge "Inscrições 1" refletiu na hora.
- **Suggested next charter:** revisitar este charter pós-fix para data-travada + remoção-de-catequista-com-chamadas; um charter Garbage Tour para /admin/alunos segue valendo para o próximo ciclo.

**Setup produzido para as próximas sessões:** ano 2026 ativo (Sex+Sáb, janela 01/07–31/08, 8 datas incl. 2026-07-24/25) · ano 2027 inativo (sáb, sem datas) · catequistas Tereza (`tereza@paroquia.local` / dom-fe-bispo-22), Joaquim (`joaquim@paroquia.local` / anjo-gloria-igreja-58) · Fátima promovida a coordenador (cobaia do bug) · 1 inscrição pendente "Teste da Coordenação" · turmas: NENHUMA (bloqueado pelo bug de criar turma).

### CH-primeiro-acesso-senha-provisoria — Camila (setup: Anselmo)

- **Ran:** 2026-07-24 ~23:05 → ~23:45 (box 60 respeitado: sim)
- **Findings:**
  - Senha inicial exibida uma única vez ✓ (some no reload) — mas o banner não avisa que não será mostrada de novo (paper cut).
  - Senha colada com espaço no fim (WhatsApp) → "credenciais inválidas" sem dica de espaços (paper cut sharp).
  - Guard da troca forçada segura /dashboard e /admin ✓; checklist viva ✓; botão diz "Faltam N" ✓.
  - **Botão "Salvar nova senha" mudo ao clique** — o form só submeteu via Enter. Suspeita de botão morto para toque/mouse (Blocks-Completion mobile se confirmar); repro agendada no primeiro acesso da Tereza (S3).
  - **Regras de senha divergentes provadas ao vivo**: tela recusa "123456", servidor aceita (HTTP 200) → BUG + Decision for a Human.
  - Conta desativada → "usuário inativo" distinto de senha errada ✓, mas cru e sem próximo passo (paper cut sharp).
  - 10 erros → 429 exibido como **"Too Many Requests"** em inglês, sem guia → BUG (fail). Recuperação após a janela funciona ✓.
  - Dashboard vazio da Camila: empty state exemplar ✓; "Bom dia" às 23:27 (fuso errado na saudação) → BUG; "Todas as chamadas de hoje foram registradas" para quem não tem turma (paper cut).
- **Bugs filed/updated:** [BUG-20260724-regras-senha-divergentes, BUG-20260724-limite-login-ingles-sem-guia, BUG-20260724-saudacao-fuso-errado]
- **Scenarios settled:** AUTH-senha-inicial-uma-vez → pass · AUTH-usuario-inativo-bloqueado → pass · AUTH-regras-senha-divergentes → blocked-decision · AUTH-limite-tentativas-login → fail · AUTH-troca-forcada → pendente da repro do clique
- **Paper cuts:** ver tabela.
- **Surprises:** submit por Enter funcionou onde o clique não — inversão rara (teclado > toque).
- **Suggested next charter:** repetir Autofill Tour com gerenciador de senhas real (tooling não cobre — Human Verification).

### CH-chamada-offline-rede-instavel — Tereza

- **Ran:** 2026-07-24 ~23:35 → 25T00:40 (box 90 ~respeitado)
- **Findings:**
  - **"Hoje" é o dia UTC**: às 23:4x de sexta a folha abre e grava "SÁBADO, 25 DE JULHO" enquanto o dashboard diz "SEXTA, 24" — chamadas noturnas caem no dia errado (Data-Loss). Todas as sessões deste ciclo ficaram gravadas em 2026-07-25.
  - **Deadlock de navegação**: só a "próxima" turma (alfabética, ignora calendário/horário) tem chamada; cards não são tocáveis; com a Perseverança (0 alunos, sem aula) na vez, a Primeira Comunhão ficou inalcançável (Blocks-Completion). Fluxo continuou por URL direta — desvio de fidelidade declarado.
  - **"Salvando…" infinito no confirmar offline** (2 repros limpas): a chamada É enfileirada, mas a tela nunca avisa; e o sync automático não roda ao abrir o app já online (só no evento de reconexão).
  - **Correção descartada em silêncio**: folha já registrada reabre em branco; reenvio finge sucesso; acumulado permaneceu 100% (Data-Loss provado ao vivo).
  - **401 ao confirmar**: marcações preservadas na tela, mas banner cru "não autenticado" sem caminho de recuperação.
  - Funcionou bem: chip Online/Offline sempre visível; aria-labels das linhas; contadores; "Faltam N"; banner de fila com "Sincronizar agora"; "Feita hoje"+50% em fresh load (leitura independente).
- **Bugs filed/updated:** [BUG-20260724-chamada-data-utc-errada, BUG-20260724-so-proxima-turma-tem-chamada, BUG-20260724-salvando-infinito-offline, BUG-20260724-refazer-chamada-descartada-em-silencio, BUG-20260724-sessao-expirada-sem-caminho]
- **Scenarios settled:** CHM-chamada-feliz-online → fail · CHM-chamada-offline-fila → fail · CHM-sync-perda-silenciosa → fail · CHM-reenvio-mesma-data → fail · CHM-sessao-expira-na-chamada → fail · AUTH-troca-forcada → pass (clique era limitação do driver: funciona com scroll+toque real)
- **Paper cuts:** CTA de troca de senha abaixo da dobra em 390px; "próxima" ignora horário; cards stale após sync manual (reload resolve); turma 2027 agrupada sob "ANO LETIVO 2026".
- **Surprises:** a fila offline preservou os dados em todos os caminhos — os defeitos são de *feedback e política*, não de armazenamento.
- **Suggested next charter:** re-walk pós-fix do fluxo offline completo em build de produção (SW ativo) — a paridade dev pode mascarar/causar o "Salvando…".

### CH-chamada-interrompida-zoom — Joaquim

- **Ran:** 2026-07-25 ~00:50 → ~01:25 (box 60 respeitado)
- **Findings:**
  - **Turma de outro ano herdava o calendário do ano ativo**: Perseverança (2027, sem datas) abria a folha e o servidor descartava a chamada → corrigido e re-testado (2ca939b).
  - Botão desabilitado diz "Faltam 2" ✓; busca + "Marcar todos presentes" age só nos visíveis, contadores contam a turma toda ✓.
  - Fonte 150%: alvos de toque ≥44px, telas legíveis, nada essencial coberto ✓.
  - **Reload zera as marcações em andamento** (rascunho sem persistência) → BUG-20260725-marcacoes-somem-no-reload (open, Friction).
  - Troca de app (aba viva) preserva marcações ✓.
- **Bugs filed/updated:** [BUG-20260725-dia-de-aula-do-ano-errado (verified), BUG-20260725-marcacoes-somem-no-reload (open)]
- **Scenarios settled:** CHM-confirmar-diz-motivo → pass · CHM-chamada-zoom-ampliado → pass · CHM-dia-sem-aula → pass (fixed+retested)
- **Paper cuts:** aviso de descarte usa tom neutro mas aparece como banner de erro (aceitável).
- **Surprises:** o aviso de descarte do fix anterior disparou no caso do calendário — mas com motivo enganoso ("já registrada"); copy corrigida no mesmo fix.
- **Suggested next charter:** persistência de rascunho de chamada (decisão de produto) + revisitar com leitor de tela real (aproximação de zoom não cobre VoiceOver).

### CH-inscricao-celular-primeira-vez — Marta

- **Ran:** 2026-07-25 ~01:30 → ~02:05 (box 60 respeitado)
- **Findings:**
  - **Voltar do navegador sai do site e joga fora os 4 passos digitados** — contradiz a promessa "os dados ficam guardados" (Data-Loss de input; Android back é o gesto padrão). Escalado: histórico por passo ou rascunho persistido.
  - Sem reenvio duplicado em nenhum caminho ✓; reabertura pós-sucesso vem limpa ✓.
  - Validações inline claras e próximas (vazio, telefone com formato exato) ✓; sem máscara automática de telefone (paper cut).
  - Janela fechada: "o período de inscrições não está aberto" claro, dados preservados — mas a mãe só descobre DEPOIS de preencher tudo (paper cut sharp: falta pré-checagem ao carregar).
  - Sem ano ativo: "nenhum ano letivo ativo encontrado" — jargão de operador para uma família (paper cut).
- **Bugs filed/updated:** [BUG-20260725-voltar-do-navegador-perde-inscricao]
- **Scenarios settled:** INS-inscricao-feliz-celular → pass · INS-validacao-preserva-dados → pass · INS-abandono-e-retorno → fail (escalado) · INS-janela-fechada → pass · INS-sem-ano-ativo → pass
- **Paper cuts:** ver tabela.
- **Surprises:** o formulário público segue acessível logado (observado; menor).
- **Suggested next charter:** Autofill Tour com autofill real de navegador no formulário público.

### CH-revisao-inscricoes-duas-abas — Anselmo

- **Ran:** 2026-07-25 ~02:05 → ~02:40 (box 60 respeitado)
- **Findings:**
  - Aprovação cria aluno na turma certa; fim verdadeiro confirmado (Miguel em Primeira Comunhão via busca) ✓; badge zera; fila Pendentes esvazia ✓.
  - **Conflito de duas abas**: decisão dupla → 409 "esta inscrição já foi processada" legível, sem aluno fantasma ✓.
  - **Renovação inutilizável**: "Aluno existente (opcional)" só aceita UUID interno; nome → "identificador inválido". Backend correto (transfere sem duplicar, provado com UUID). Escalado (componente de busca = design).
  - Rejeição exige motivo com botão que explica ✓ — mas o **motivo é write-only** (invisível depois). Escalado.
  - Paper cuts: STATUS em inglês cru ("pending"/"rejected"); banner "Inscrição aprovada." persiste ao navegar entre filtros.
- **Bugs filed/updated:** [BUG-20260725-renovacao-exige-uuid, BUG-20260725-motivo-rejeicao-invisivel]
- **Scenarios settled:** INS-aprovar-cria-aluno → pass · INS-revisao-dupla-conflito → pass · INS-aprovar-renovacao-transfere → fail (escalado) · INS-rejeitar-motivo-obrigatorio → fail (escalado)
- **Suggested next charter:** Garbage Tour no drawer de aprovação (campos opcionais, dados colados).

### CH-relatorio-fim-de-periodo — Anselmo (+ revisita do CH-preparar-ano)

- **Ran:** 2026-07-25 ~02:40 → ~03:20 (box 30 + revisita)
- **Findings:**
  - **Prévia derrubava o painel em tela branca** — contrato divergente (front esperava records aninhado; API entrega listas planas). A prévia nunca funcionou contra o backend real; mocks espelhavam o front. Corrigido (eb7b9f6) e re-testado: números conferem com as chamadas (3 catequizandos, 6 presenças, 100%, barras 2/2/0), PDF/XLSX válidos, `relatorio-<de>-<até>` correto.
  - Período invertido → "A data final deve ser igual ou posterior à inicial" ✓; formato mutilado → "Use o formato YYYY-MM-DD" ✓ (tela íntegra nos dois).
  - Turma sem registros → zeros honestos, sem crash ✓.
  - Nuance anotada: registros de aluno transferido (Carla) contam nos totais da turma antiga sem a aluna aparecer na lista (paper cut).
  - **Revisita S1**: "Datas travadas por chamada: 2026-07-24, 2026-07-25" listadas; remover data travada → erro nomeando a data, edição preservada ✓. Remover catequista com chamadas → 409 "catequista possui chamadas registradas", pessoa preservada ✓ (sem diálogo de confirmação antes — padrão já rastreado).
- **Bugs filed/updated:** [BUG-20260725-previa-relatorio-tela-branca (verified)]
- **Scenarios settled:** REL-previa-e-download → pass (fixed) · REL-periodo-invalido-claro → pass · REL-turma-sem-registros → pass · ADM-data-travada-permanece → pass · ADM-remocao-bloqueada-protegidos → pass
- **Suggested next charter:** conferência XLSX/PDF campo a campo contra a prévia (abrir os arquivos) — nesta rodada validou-se assinatura/da geração e totais da prévia.

## Lens Pass (Step 5 — J-fazer-chamada-offline e J-inscrever-catequizando)

Compressão declarada: a passada reaproveitou as caminhadas extensas das sessões + uma varredura dedicada de teclado/semântica.

| Lente | Chamada | Inscrição | Notas |
|---|---|---|---|
| Usabilidade | friction | friction | Botões dizem o motivo ✓; erros cruas do servidor em várias telas (minúsculas, jargão); ações destrutivas sem confirmação (fail pontual já em bugs) |
| Acessibilidade | friction | pass | Folha: 1 h1 ✓, todos os botões nomeados ✓, **0 regiões aria-live** → BUG-20260725-chamada-sem-anuncios-leitor; inscrição: campos todos com label ✓, tab order correto ✓ |
| Performance percebida | pass | pass | Feedback <1s em tudo que foi medido pós-fixes (o "Salvando…" infinito era o fail — corrigido) |
| Compatibilidade | friction | friction | Só Chromium testado (driver); Safari/iOS e Firefox pendentes → Human Verification |
| Recuperabilidade de erro | friction | friction | Inputs preservados ✓ em quase tudo; "não autenticado" sem caminho (escalado); voltar-do-navegador perde inscrição (escalado) |
| Paridade de produção | friction | friction | Vite dev sem SW; sem gerenciador de senhas real; rede emulada. Divergências listadas em Preconditions e qualificam os verdicts |

## What Was Fixed

### BUG-20260724-editar-ano-sempre-falha: editar ano letivo era impossível
- **Symptom:** todo "Salvar ano" na edição → 400 com `unknown field "year"` cru na tela.
- **Root cause:** form envia estado inteiro; DTO de PATCH (DisallowUnknownFields) não aceita `year`.
- **Fix:** dd2b09a — payload de update sem `year`.
- **Regression test:** admin-page.test.tsx "edits academic years without sending immutable fields" (vermelho antes, verde depois).
- **Retested:** sessão nova em persona — Editar → Salvar ano → PATCH 200, "Ano letivo atualizado.", janela preservada.

### BUG-20260724-criar-turma-impossivel: criar (e editar) turma era impossível
- **Symptom:** todo "Criar turma" → 400 `unknown field "isArchived"`; edição idem (`id`).
- **Root cause:** form envia `id`/`isArchived` que os DTOs de create/update rejeitam.
- **Fix:** dd2b09a — create envia só os campos do contrato; update inclui isArchived, nunca id.
- **Regression test:** admin-page.test.tsx "creates and edits classes without fields the API rejects" (vermelho antes, verde depois).
- **Retested:** em persona — 3 turmas criadas (201) e edição sem mudança (PATCH 200, "Turma atualizada."). Visibilidade no dashboard da catequista confirma na S3 (retest_status pending até lá).

## Paper Cuts

| Persona | Where (journey/step) | Felt | Sharpness | Outcome |
|---|---|---|---|---|
| Anselmo | J-preparar-ano-letivo / calendário | "Colei 40 datas e ele só diz 'use YYYY-MM-DD' — qual linha está errada?" | sharp | watching |
| Anselmo | J-preparar-ano-letivo / anos | "A tabela mostra 2026-07-01 até 2026-08-31 — ninguém aqui lê data assim" | dull | watching |
| Anselmo | J-preparar-ano-letivo / anos | "Apaguei um ano por engano? O banner verde de 'criado' continuou lá em cima enquanto o formulário dava erro" | dull | watching |
| Anselmo | J-preparar-ano-letivo / anos (excluir) | "Diz que o ano tem turmas vinculadas — não tem turma nenhuma, tem uma inscrição" | sharp | watching |

## Runtime Errors Observed

- Integração backend: `TestAcademicYearCRUD` falha por asserção obsoleta (detalhe em Preconditions) — roteado ao `agent-output-audit`, não é bug de produto.
- Crash React em `<ReportsView>` (tela branca) ao pré-visualizar — virou BUG-20260725-previa-relatorio-tela-branca (corrigido).
- Nenhum outro erro de console não explicado nas caminhadas pós-fixes.

## Human Verifications Needed

- [ ] **Build de produção com service worker**: repetir o fluxo offline completo (confirmar sem sinal → mensagem <2s; Background Sync com app fechado; instalação PWA) num deploy real. O dev não exercita SW — e o bug do "Salvando…" era invisível com SW ativo.
- [ ] **iPhone/Safari real**: chamada offline + login (cookies httpOnly + autofill do iOS divergem do Chromium emulado).
- [ ] **Gerenciador de senhas real** (1Password/Chrome) no primeiro acesso: salvar a senha provisória, deixar preencher na troca — o tour de Autofill só foi aproximado.
- [ ] **Abrir os PDF/XLSX baixados** e conferir campo a campo com a prévia (a rodada validou geração, assinatura dos arquivos e totais da prévia).

## Decisions for a Human

**Decididas em 2026-07-27 (Renan):** itens abaixo aprovados nas recomendações — 1→op.1, 2→op.1, 3→op.1, 4→op.1, 5→op.3, 6→op.1, 7→op.2, 8→op.1, 9→op.1. Registro individual em cada bug (`## Decisão`); implementação e re-teste no ciclo targeted de 2026-07-27.

### Confirmação em ações destrutivas (BUG-20260724-remover-ano-sem-confirmacao + padrão geral)
- What's broken: remover ano apaga na hora, sem confirmação, sem feedback, com tabela stale; remoção de catequista idem (só o 409 salvou a Tereza). Evidência: S1-tabela-pos-delete.png
- Why not auto-fixed: o padrão de confirmação (AlertDialog? undo? texto?) é decisão de design que vale para o produto todo.
- Options: 1. AlertDialog de confirmação nos destrutivos (padrão shadcn, rápido) — um toque a mais para coordenadores apressados; 2. Undo pós-ação (toast "Removido — desfazer") — mais fluido, mais implementação.
- Recommendation: opção 1 agora (padrão simples e consistente com o design system), avaliando undo depois.

### Dois anos letivos ativos (BUG-20260724-dois-anos-ativos-sem-aviso)
- What's broken: o sistema aceita dois "Ativo" e resolve inscrições/fila por LIMIT 1 sem ordem. Evidência: S1-dois-anos-ativos.png
- Why not auto-fixed: exige regra de negócio (unicidade? troca atômica?) e mudança de backend/schema.
- Options: 1. Índice único parcial + serviço que desativa o anterior ao ativar um novo (troca atômica); 2. Bloquear ativação com aviso "Desative 2026 antes".
- Recommendation: opção 1 — corresponde à intenção real do coordenador na virada de ano.

### Pessoa promovida some da gestão (BUG-20260724-promovida-some-da-lista)
- What's broken: promover a Coordenador remove a pessoa de todas as telas, sem volta pela UI. Evidência: S1-fatima-promovida.png
- Why not auto-fixed: mudar o GET /api/catechists (contrato) ou criar tela de coordenadores é decisão de produto.
- Options: 1. Listar todos os perfis com coluna de papel (e permitir rebaixar); 2. Confirmação forte na promoção explicando o sumiço.
- Recommendation: opção 1 — sem uma lista completa, o produto não tem gestão de pessoas de verdade.

### Recuperação da sessão expirada na chamada (BUG-20260724-sessao-expirada-sem-caminho)
- What's broken: 401 ao confirmar → "não autenticado", sem caminho; re-login perde as marcações. Evidência: S3-401-na-confirmacao.png
- Why not auto-fixed: a recuperação correta (enfileirar no 401? modal de re-login preservando estado?) é decisão de fluxo.
- Options: 1. Enfileirar a chamada também no 401 e mandar re-logar ("está guardada no aparelho"); 2. Modal de re-login in-place.
- Recommendation: opção 1 — reusa a fila offline que já existe e casa com o modelo mental do produto.

### Voltar do navegador no formulário público (BUG-20260725-voltar-do-navegador-perde-inscricao)
- What's broken: back do Android sai do site e joga fora os 4 passos digitados, contrariando a promessa da tela.
- Why not auto-fixed: histórico por passo vs rascunho persistido é decisão de arquitetura do wizard.
- Options: 1. history.pushState por passo (back = passo anterior); 2. Rascunho em sessionStorage restaurado ao voltar; 3. Ambos.
- Recommendation: opção 3 — o custo é baixo e o público é exatamente o que mais usa o gesto de voltar.

### Renovação pede UUID (BUG-20260725-renovacao-exige-uuid)
- What's broken: "Aluno existente (opcional)" só aceita UUID interno; nome → "identificador inválido". Renovação inutilizável por humanos. Evidência: S6-aluno-existente-nome.png
- Why not auto-fixed: exige componente de busca/autocomplete de aluno (design de interação).
- Options: 1. Autocomplete buscando /api/students?q=; 2. Select com todos os alunos ativos.
- Recommendation: opção 1 — a busca já existe na API; o select não escala.

### Motivo de rejeição invisível (BUG-20260725-motivo-rejeicao-invisivel)
- What's broken: motivo obrigatório para rejeitar, impossível de consultar depois.
- Why not auto-fixed: onde exibir (coluna? drawer de rejeitada?) é escolha de design simples porém de produto.
- Options: 1. Coluna "Motivo" no filtro Rejeitadas; 2. Drawer somente-leitura para processadas.
- Recommendation: opção 2 — reusa o drawer e serve também para re-conferir aprovadas.

### Refazer/corrigir chamada enviada (parte de política do BUG-20260724-refazer-chamada-descartada-em-silencio)
- What's broken: a folha de chamada já registrada reabre em branco e aceita remarcação que o servidor sempre descartará (agora com aviso honesto, mas ainda um beco).
- Why not auto-fixed: permitir edição de chamada (e por quem) é regra de negócio nova.
- Options: 1. Folha carrega o registro existente em modo leitura ("Chamada de hoje já registrada às …"); 2. Permitir correção pelo catequista no mesmo dia (PUT); 3. Correção só pela coordenação.
- Recommendation: opção 1 já; opção 3 como evolução.

### "Próxima chamada" ciente de calendário e horário (resto do BUG-20260724-so-proxima-turma-tem-chamada)
- What's broken: a "próxima" é alfabética e ignora calendário/horário (indicou turma sem aula hoje). O acesso por card já foi destravado.
- Why not auto-fixed: a regra de ordenação (calendário+horário? só calendário?) merece decisão consciente; "Horário" hoje é texto livre.
- Options: 1. Filtrar por "hoje é dia de aula da turma" e ordenar por nome; 2. Estruturar horário (campo hora) e ordenar de verdade.
- Recommendation: opção 1 agora, opção 2 quando houver migração de schema.

### Política de senha: a tela promete, o servidor não cumpre (BUG-20260724-regras-senha-divergentes)
- What's broken: a checklist exige "uma letra e um número"; `POST /api/auth/change-password` aceita `123456` (HTTP 200, provado com conta descartável). Evidência: ../evidence/2026-07-24-ciclo-full/S2-checklist-123456.png
- Why not auto-fixed: endurecer a validação do servidor é mudança de contrato da API (payloads antes aceitos passam a falhar) — fora do governor.
- Options:
  1. Endurecer o backend para a política da tela (≥6 + letra + número) — consistência e segurança; único custo: contrato mais estrito.
  2. Afrouxar a checklist para "≥6 caracteres" — consistência sem mudar contrato; enfraquece senhas de contas que gerenciam dados de crianças.
- Recommendation: opção 1 — a política exibida já é a promessa feita ao usuário; implementá-la no servidor é cumpri-la.

## Learnings

- **Contrato front↔back é o ponto cego sistêmico**: 4 dos 5 Blocks-Completion (editar ano, criar turma, prévia de relatório, e o payload de update de turma) eram payload/shape divergente invisível para testes com mock. Vale um gate de contrato (testes de integração front→API real no CI, ou geração de tipos a partir do backend) — roteado ao `agent-output-audit`.
- **Datas em UTC**: `toISOString().slice(0,10)` como "hoje" apareceu 3× (era o padrão da casa). O helper `localToday()` agora existe; qualquer data nova deve nascer dele.
- **Mensagens de servidor vazadas cruas** (minúsculas, jargão, inglês no 429) eram o paper cut mais repetido — um mapa central de erros → copy resolveria a classe inteira.
- **A fila offline guardou os dados em todos os cenários** — os defeitos eram de feedback/política, nunca de armazenamento. O núcleo técnico do offline é sólido.
- Candidato a tour novo: "Coordenação em dia de matrícula" (fila cheia + telefone tocando + duas abas) rendeu os melhores achados de revisão.
- Sessões pré-fix do dia 25/07 permanecem no banco de QA local (gravadas pelo bug UTC); inofensivas aqui, mas produção precisaria de auditoria se o bug tivesse chegado lá.

## Final Status

- **Exit gate (suíte automatizada completa):** `go build ./...` → Success · `go vet ./...` → No issues · `go test ./...` → **184 passed in 18 packages** · `npx vitest run` → **PASS (65) FAIL (0)** · `npx tsc -b` → No errors. (Integração com `TEST_DATABASE_URL`: 1 falha pré-existente por asserção obsoleta de teste, documentada em Preconditions, não relacionada aos fixes.)
- **Issues by user impact (20 bugs na rodada):** Blocks-Completion **5** (4 corrigidos+verificados; 1 aberto: renovação-por-UUID) · Data-Loss **3** (2 corrigidos+verificados; 1 aberto: voltar-do-navegador na inscrição) · Trust-Damage **7** (3 corrigidos; 4 abertos/escalados) · Friction **5** (1 corrigido; 4 abertos) · Cosmetic **0**.
- **Fixes desta rodada:** 5 commits na branch `qa/fixes-ciclo-full-20260724` (dd2b09a, e62e6c9, f6b4c5d, 2ca939b, eb7b9f6), todos com teste de regressão vermelho-antes/verde-depois e re-walk em persona.
- **Coverage:** 6/6 jornadas caminhadas por persona; 32/32 cenários com verdict terminal (**25 pass · 7 blocked-decision**, dos quais 9 passaram via fix+retest nesta rodada); 0 Pending. Paridade: dev sem SW, Chromium only, autofill aproximado — verificações humanas listadas.
- **Verdict:** **not ready** — o produto NÃO deve ir a produção neste estado de main: os 5 Blocks-Completion descobertos provam que fluxos centrais (editar ano, criar turma, relatório) nunca rodaram contra o backend real. Com a branch de fixes mergeada, restam 2 bloqueios funcionais escalados (renovação por UUID e perda da inscrição no voltar) + 4 Trust-Damage com recomendação — resolvidas as decisões humanas e feito o smoke em build de produção (SW/iOS), o caminho para release fica aberto.
