# QA Run Report — 2026-07-27 — fixes-decisoes

- **Scope:** ciclo targeted sobre os commits `978d0c1` (backend) e `99b06c3` (frontend), que implementam as 9 decisões tomadas em 2026-07-27 sobre os achados do ciclo full de 24-25/07. Jornadas tocadas pelo diff: preparar ano letivo, primeiro acesso, aprovar inscrição, inscrever catequizando, fazer chamada. Canário adjacente: emitir relatório (não tocado, compartilha o shell do admin).
- **Cadence tier:** targeted
- **Build:** `99b06c3` (main) · **Environment:** http://localhost:5173 (Vite dev, proxy /api → Go :8080, Postgres 16 em Docker com o mundo de QA do ciclo anterior + migração `0002_single_active_year` aplicada no boot)
- **Started:** 2026-07-27T12:05-03:00 · **Finished:** 2026-07-27T18:50-03:00 · **Status:** closed

## Preconditions

- Suíte automatizada **verde antes das sessões**: backend `go build`/`go vet`/`go test` → 185 pass; frontend `vitest` → 74 pass; `tsc -b` → sem erros.
- Regressões novas provadas **vermelhas contra o código anterior**: 10 falhas ao guardar os fontes e rodar a suíte (9 testes novos + 2 atualizados).
- Migração `0002_single_active_year` aplicada no startup; índice parcial `academic_years_single_active` confirmado no banco.
- **Parity notes** (mantidas do ciclo anterior, qualificam todos os verdicts): Vite dev sem service worker; driver Chromium via `agent-browser` 0.27.0; rede emulada por `set offline`, sem throttling de banda; sem gerenciador de senhas real. As verificações humanas do ciclo anterior seguem pendentes.

## Personas

| Persona | Base | Device / Network / Locale | Sessions |
|---|---|---|---|
| Anselmo | Power User | desktop 1280×800 / wifi / pt-BR | CH-preparar-ano-colando-datas, CH-revisao-inscricoes-duas-abas, CH-relatorio-fim-de-periodo |
| Camila | New User | phone-large 390×844 / wifi / pt-BR | CH-primeiro-acesso-senha-provisoria |
| Marta | New User | phone-small 375×812 / 4g / pt-BR | CH-inscricao-celular-primeira-vez |
| Tereza | Mobile User | phone-large 390×844 / flaky / pt-BR | CH-chamada-offline-rede-instavel |

## Flows in Scope

- `J-preparar-ano-letivo` — ano ativo único, confirmação de exclusões, gestão de pessoas completa (`../journeys/J-preparar-ano-letivo.md`)
- `J-primeiro-acesso-catequista` — política de senha agora praticada pelo servidor (`../journeys/J-primeiro-acesso-catequista.md`)
- `J-aprovar-inscricao` — busca de aluno por nome; processadas em leitura (`../journeys/J-aprovar-inscricao.md`)
- `J-inscrever-catequizando` — histórico por passo + rascunho no aparelho (`../journeys/J-inscrever-catequizando.md`)
- `J-fazer-chamada-offline` — chamada registrada em leitura; 401 vai para a fila (`../journeys/J-fazer-chamada-offline.md`)
- `J-emitir-relatorio` — **canário**, não tocado pelo diff (`../journeys/J-emitir-relatorio.md`)

## Session Matrix & Results

| # | Charter | Journey / Scenario | Persona | Tour | Status | Issue | Fix commit |
|---|---|---|---|---|---|---|---|
| 1 | CH-preparar-ano-colando-datas | J-preparar-ano-letivo / ADM-dois-anos-ativos | Anselmo | Paste | Fixed | BUG-20260724-dois-anos-ativos-sem-aviso | 978d0c1 |
| 2 | CH-preparar-ano-colando-datas | J-preparar-ano-letivo / ADM-promovido-some-da-lista | Anselmo | Paste | Fixed | BUG-20260724-promovida-some-da-lista | 978d0c1; 99b06c3 |
| 3 | CH-preparar-ano-colando-datas | J-preparar-ano-letivo / ADM-remocao-bloqueada-protegidos | Anselmo | Paste | Fixed | BUG-20260724-remover-ano-sem-confirmacao | 99b06c3 |
| 4 | CH-preparar-ano-colando-datas | J-preparar-ano-letivo / ADM-criar-ano-dias-aula | Anselmo | Paste | Pass |  |  |
| 5 | CH-preparar-ano-colando-datas | J-preparar-ano-letivo / ADM-criar-turma-vincular-catequista | Anselmo | Paste | Pass |  |  |
| 6 | CH-primeiro-acesso-senha-provisoria | J-primeiro-acesso-catequista / AUTH-regras-senha-divergentes | Camila | Autofill | Fixed | BUG-20260724-regras-senha-divergentes | 978d0c1 |
| 7 | CH-primeiro-acesso-senha-provisoria | J-primeiro-acesso-catequista / AUTH-troca-forcada-primeiro-login | Camila | Autofill | Pass |  |  |
| 8 | CH-inscricao-celular-primeira-vez | J-inscrever-catequizando / INS-abandono-e-retorno | Marta | Back-Button | Fixed | BUG-20260725-voltar-do-navegador-perde-inscricao | 99b06c3 |
| 9 | CH-inscricao-celular-primeira-vez | J-inscrever-catequizando / INS-inscricao-feliz-celular | Marta | Back-Button | Pass |  |  |
| 10 | CH-inscricao-celular-primeira-vez | J-inscrever-catequizando / INS-validacao-preserva-dados | Marta | Back-Button | Pass |  |  |
| 11 | CH-revisao-inscricoes-duas-abas | J-aprovar-inscricao / INS-aprovar-renovacao-transfere | Anselmo | Multi-Tab | Fixed | BUG-20260725-renovacao-exige-uuid; BUG-20260727-renovacao-sobrescreve-sem-aviso | 99b06c3; 740887f |
| 12 | CH-revisao-inscricoes-duas-abas | J-aprovar-inscricao / INS-rejeitar-motivo-obrigatorio | Anselmo | Multi-Tab | Fixed | BUG-20260725-motivo-rejeicao-invisivel | 99b06c3 |
| 13 | CH-revisao-inscricoes-duas-abas | J-aprovar-inscricao / INS-aprovar-cria-aluno | Anselmo | Multi-Tab | Pass |  |  |
| 14 | CH-chamada-offline-rede-instavel | J-fazer-chamada-offline / CHM-sessao-expira-na-chamada | Tereza | Network | Fixed | BUG-20260724-sessao-expirada-sem-caminho; BUG-20260727-sessao-expirada-preso-no-dashboard | 99b06c3; 740887f |
| 15 | CH-chamada-offline-rede-instavel | J-fazer-chamada-offline / CHM-reenvio-mesma-data | Tereza | Network | Fixed | BUG-20260724-refazer-chamada-descartada-em-silencio | 99b06c3 |
| 16 | CH-chamada-offline-rede-instavel | J-fazer-chamada-offline / CHM-chamada-feliz-online | Tereza | Network | Pass |  |  |
| 17 | CH-chamada-offline-rede-instavel | J-fazer-chamada-offline / CHM-chamada-offline-fila | Tereza | Network | Pass |  |  |
| 18 | CH-relatorio-fim-de-periodo | J-emitir-relatorio / REL-previa-e-download (canário) | Anselmo | Feature | Pass |  |  |

Status legend: `Pending | Pass | Fixed | Skipped | Blocked (needs human verify) | Blocked (human decision)`

## Session Debriefs

### CH-preparar-ano-colando-datas — Anselmo

- **Ran:** 2026-07-27 ~12:10 → ~12:45 (box 90; escopo reduzido ao que o diff tocou)
- **Findings:** troca atômica do ano ativo funciona nos dois caminhos (criar e editar), confirmada em fresh load; confirmação de exclusão bloqueia a chamada à API e a tabela deixou de ficar stale; a tela de pessoas agora lista os 5 perfis com papel visível — **a Fátima, que havia sumido no ciclo anterior, reapareceu**, foi rebaixada e promovida de novo pela UI; admin aparece como "Conta protegida", sem select nem remover; coordenadores passam a ser vinculáveis a turma e o vínculo persiste.
- **Bugs filed/updated:** nenhum novo. Verificados: dois-anos-ativos, promovida-some-da-lista, remover-ano-sem-confirmacao.
- **Scenarios settled:** ADM-dois-anos-ativos → pass · ADM-promovido-some-da-lista → pass · ADM-remocao-bloqueada-protegidos → pass · ADM-criar-ano-dias-aula → pass · ADM-criar-turma-vincular-catequista → pass
- **Paper cuts:** mensagem do 409 ainda chega crua e em minúsculas ("catequista possui chamadas registradas").

### CH-primeiro-acesso-senha-provisoria — Camila (conta Rita Alves)

- **Ran:** 2026-07-27 ~12:50 → ~13:10 (box 60)
- **Findings:** primeiro acesso íntegro (senha provisória exibida uma vez com o novo aviso "anote agora"; guard forçou a troca; "Faltam 1" explicou o bloqueio; senha válida levou ao dashboard). Saudação e data locais corretas — regressão dos fixes do ciclo anterior não ocorreu. A política do servidor foi verificada tecnicamente (declarado fora de persona): "123456" e "abcdef" agora são recusados com a mesma regra da tela.
- **Scenarios settled:** AUTH-regras-senha-divergentes → pass · AUTH-troca-forcada-primeiro-login → pass

### CH-inscricao-celular-primeira-vez — Marta

- **Ran:** 2026-07-27 ~13:15 → ~13:55 (box 60)
- **Findings:** o **back do navegador agora volta um passo** em vez de sair do site, com os dados intactos; sair do site inteiro e voltar restaura o rascunho no passo em que parou, com aviso explícito; o envio limpa o rascunho e reabrir dá formulário em branco; back a partir do sucesso não reenvia (1 POST). Validações inline seguem preservando o que foi digitado.
- **Surpresa:** a inscrição falhou com "período de inscrições não está aberto" porque o ano ativo estava com a abertura da janela em branco (resíduo do ciclo anterior) — o coordenador corrigiu pela tela de anos (que voltou a funcionar) e o envio passou. Reforça o paper cut já registrado: a família só descobre a janela fechada no fim do formulário.
- **Scenarios settled:** INS-abandono-e-retorno → pass · INS-inscricao-feliz-celular → pass · INS-validacao-preserva-dados → pass

### CH-revisao-inscricoes-duas-abas — Anselmo

- **Ran:** 2026-07-27 ~14:00 → ~14:40 (box 60)
- **Findings:** a busca por nome tornou a renovação usável pela primeira vez — **e expôs que ela substitui o cadastro escolhido em silêncio**: aprovar a inscrição de "Lucas Andrade" vinculada a "Carla Oliveira" apagou a Carla (mesmo uuid, agora com outro nome e turma), com o histórico de presença dela sob o nome errado. Achado novo, Data-Loss, filed e corrigido no fix loop. O drawer de leitura das processadas mostra situação, data e motivo da rejeição por extenso.
- **Bugs filed:** BUG-20260727-renovacao-sobrescreve-sem-aviso
- **Scenarios settled:** INS-aprovar-renovacao-transfere → pass (após o fix) · INS-rejeitar-motivo-obrigatorio → pass · INS-aprovar-cria-aluno → pass
- **Paper cuts:** coluna STATUS ainda em inglês cru ("pending"/"rejected"); com o drawer aberto existem **dois botões "Buscar"** na tela (filtro da fila e busca de aluno), ambíguos para leitor de tela.

### CH-chamada-offline-rede-instavel — Tereza

- **Ran:** 2026-07-27 ~14:45 → ~15:30 (box 90)
- **Findings:** com a sessão morta, a chamada foi para a fila e a mensagem prometeu "Entre novamente" — **mas o link devolvia ao dashboard quebrado** ("não autenticado"), porque a SPA seguia se achando autenticada; só um reload manual escapava. Achado novo, filed e corrigido no fix loop. A chamada em si nunca se perdeu: após reload + login a fila drenou sozinha. A folha de uma chamada já registrada abre em leitura ("Chamada de hoje já registrada às 18:36"), sem remarcação. Dia sem aula segue correto na turma de outro ano.
- **Bugs filed:** BUG-20260727-sessao-expirada-preso-no-dashboard
- **Scenarios settled:** CHM-sessao-expira-na-chamada → pass (após o fix) · CHM-reenvio-mesma-data → pass · CHM-chamada-feliz-online → pass · CHM-chamada-offline-fila → pass

### CH-relatorio-fim-de-periodo — Anselmo (canário)

- **Ran:** 2026-07-27 ~15:35 → ~15:50 (box 30) + re-check após o fix loop
- **Findings:** jornada não tocada pelo diff segue íntegra — prévia renderiza com números coerentes com as chamadas reais, PDF baixa válido, console limpo. Repetido depois das mudanças no `api.ts` (global) sem regressão.
- **Scenarios settled:** REL-previa-e-download → pass

## What Was Fixed

As 9 decisões foram implementadas **antes** das sessões (commits `978d0c1` e `99b06c3`); as sessões as verificaram em persona. O fix loop desta rodada tratou os **dois achados novos** das sessões:

### BUG-20260727-renovacao-sobrescreve-sem-aviso: renovação apagava o cadastro escolhido
- **Symptom:** aprovar vinculando a um aluno existente substituía o cadastro dele (nome e turma) em silêncio; a criança sumia da busca e o histórico dela ficava sob outro nome.
- **Root cause:** a semântica destrutiva da renovação nunca foi exposta na interface — antes do fix da busca por nome o caminho era inutilizável, então ninguém a via.
- **Fix:** `740887f` — diálogo nomeando o cadastro substituído, os dados que entram e a turma de destino; aprovação sem vínculo continua direta.
- **Regression test:** `admin-page.test.tsx` — confirmação exigida na renovação, ausente na aprovação simples.
- **Retested:** cancelar não altera nada (leitura independente confirma); confirmar produz exatamente o anunciado.

### BUG-20260727-sessao-expirada-preso-no-dashboard: "Entre novamente" não levava ao login
- **Symptom:** após o 401, a SPA seguia autenticada; o link devolvia ao dashboard com "não autenticado" e a fila parada.
- **Root cause:** nada comunicava o 401 ao contexto de autenticação, que só tratava o 401 do `/api/auth/me`.
- **Fix:** `740887f` — evento global `auth:unauthorized` zera a sessão local; o aviso de chamada guardada passou para a tela de login. A mensagem equivalente na folha ficou inalcançável e foi removida em vez de virar código morto.
- **Regression test:** `auth-context.test.tsx` (401 derruba a sessão) + `dashboard-page.test.tsx` (fila preservada e login avisando).
- **Retested:** ciclo completo — sessão morta → fila → login com aviso → entrar → fila drena sozinha; servidor com a chamada. Adjacentes re-caminhadas: login normal (sem aviso espúrio), admin e relatório.

## Paper Cuts

| Persona | Where (journey/step) | Felt | Sharpness | Outcome |
|---|---|---|---|---|
| Anselmo | J-preparar-ano / remover pessoa | "Ele diz 'catequista possui chamadas registradas' em letra minúscula, parece erro de sistema" | dull | watching |
| Anselmo | J-aprovar-inscricao / fila | "A coluna diz 'pending' e 'rejected' — por que em inglês?" | sharp | reincidente do ciclo anterior; segue aberto |
| Anselmo | J-aprovar-inscricao / drawer | "Tem dois botões 'Buscar' na mesma tela e não dá para saber qual é qual" | dull | watching (a11y) |
| Marta | J-inscrever / janela | "Preenchi tudo para descobrir no fim que as inscrições estavam fechadas" | sharp | reincidente; candidato a pré-checagem |

## Runtime Errors Observed

- Nenhum erro de console não explicado nas caminhadas. O crash de `<ReportsView>` do ciclo anterior não reapareceu.

## Human Verifications Needed

As quatro pendências do ciclo anterior seguem válidas e **ganharam urgência**, porque esta rodada mexeu em caminhos que só a produção exercita de verdade:

- [ ] **Build de produção com service worker**: repetir o fluxo offline completo e o novo caminho de sessão expirada (o SW pode servir a SPA em cache e mudar o momento do redirecionamento).
- [ ] **iPhone/Safari real**: o wizard público agora usa `history.pushState` por passo e `sessionStorage` — o gesto de voltar do iOS e a política de storage do Safari precisam ser vistos no aparelho.
- [ ] **Gerenciador de senhas real** no primeiro acesso.
- [ ] **Abrir os PDF/XLSX baixados** e conferir campo a campo com a prévia.

## Decisions for a Human

### Renovação: só avisar, ou também impedir? (BUG-20260727-renovacao-sobrescreve-sem-aviso — já mitigado)
- What's broken: nada mais em silêncio — o diálogo agora diz que o cadastro escolhido será substituído. Resta a pergunta de produto: quando os nomes divergem muito (inscrição "Lucas" vinculada ao cadastro "Carla"), o sistema deve apenas avisar ou recusar?
- Why not auto-fixed: definir o que é "divergência demais" (e o que fazer com apelidos, nomes corrigidos, casamento de irmãos) é regra de negócio.
- Options: 1. Manter só a confirmação (estado atual) — simples, confia no coordenador. 2. Destacar a divergência no diálogo (comparar nome antigo × novo lado a lado). 3. Exigir digitar o nome do cadastro para confirmar, como em exclusões de repositório.
- Recommendation: opção 2 — mostra a diferença exatamente onde a decisão é tomada, sem transformar renovação legítima em burocracia.

## Learnings

- **Corrigir um caminho inutilizável revela o que ele fazia.** A renovação só ficou perigosa depois que passou a ser usável: enquanto exigia uuid, ninguém chegava à semântica destrutiva. Vale antecipar isso sempre que um fix destrava um fluxo morto — o ciclo seguinte deve caminhar o fluxo *inteiro*, não só o ponto corrigido.
- **Um fix pode desfazer a promessa de outro.** O logout global no 401 (achado B) tornou inalcançável a mensagem criada para o achado A do ciclo anterior. Só o re-walk pegou; a suíte apontou o conflito porque o teste afirmava a mensagem, não o desfecho. Testes que afirmam **o que a pessoa consegue fazer** sobrevivem a mudanças de implementação melhor que os que afirmam a existência de um texto.
- **A fila offline continua sendo a peça mais sólida do produto**: em todos os cenários desta rodada (401, sessão morta, reenvio) o dado sobreviveu; o que falha é sempre a comunicação em volta dele.
- Paper cuts reincidentes (status em inglês, janela descoberta no fim) já apareceram em dois ciclos seguidos — pelo critério do registry, viram candidatos a bug de `Friction` no próximo planejamento.

## Final Status

- **Exit gate (suíte automatizada completa):** `go build ./...` → Success · `go vet ./...` → No issues · `go test ./...` → **185 passed in 18 packages** · `vitest run` → **13 arquivos, 76 testes, 0 falhas** · `tsc -b` → No errors. (A falha pré-existente de `TestAcademicYearCRUD` na suíte de integração fora do CI não reapareceu nesta base — a asserção obsoleta segue roteada ao `agent-output-audit`.)
- **Issues by user impact (2 achados novos nesta rodada):** Data-Loss **1** (renovação sobrescrevendo — corrigido e verificado) · Friction **1** (sessão expirada sem caminho de volta — corrigido e verificado) · Blocks-Completion 0 · Trust-Damage 0 · Cosmetic 0.
- **Registry após a rodada:** 22 bugs no total, **21 verified · 1 open** (`BUG-20260725-marcacoes-somem-no-reload`, Friction, sem decisão pendente — rascunho de chamada não sobrevive a reload; fora do escopo das 9 decisões). O `BUG-20260725-chamada-sem-anuncios-leitor` foi endereçado de fato (a folha agora tem região `role=status`), mas fica **aberto** até uma verificação com leitor de tela real.
- **Fixes desta rodada:** 3 commits — `978d0c1` (backend: ano ativo único, pessoas, política de senha), `99b06c3` (frontend: confirmações, busca de aluno, leitura de processadas, rascunho da inscrição, chamada em leitura), `740887f` (fix loop: confirmação da renovação e sessão morta levando ao login). Todos com teste de regressão vermelho-antes/verde-depois e re-walk em persona.
- **Coverage:** 6/6 jornadas em escopo caminhadas por persona (5 tocadas pelo diff + 1 canário); 18/18 linhas da matriz terminais (10 Fixed · 8 Pass · 0 Pending); tracker inteiro em **32/32 `pass`**, sem `blocked-decision` restante. Paridade declarada: dev sem service worker, Chromium apenas, autofill aproximado — as 4 verificações humanas seguem pendentes e ganharam urgência.
- **Verdict:** **ready with blocked items** — as 9 decisões estão implementadas e verificadas em persona, os dois achados novos foram corrigidos no mesmo ciclo, e nenhum bloqueio funcional resta em nenhuma jornada. Antes de promover a produção, faça as verificações humanas (build com service worker, iPhone/Safari real) — o wizard passou a depender de `history`/`sessionStorage` e o caminho de sessão expirada depende de redirecionamento, ambos áreas onde dev e produção divergem.
