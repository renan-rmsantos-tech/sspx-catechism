# Registro de ciclo — 2026-07-24 — Bootstrap + plano Full

- **Escopo:** primeiro ciclo de QA do projeto. Gatilho: commit `429cc0b` refez toda a UI com o design system Catequese (auth, dashboard, presença, inscrição, admin) — o diff toca todas as jornadas, logo o ciclo cobre as jornadas de alto valor do produto inteiro.
- **Tier:** **full** (todas as jornadas P0+P1, todas as 5 personas cobertas).
- **Tipo deste arquivo:** registro de *planejamento* (skill `qa-report`). O relatório de execução será um arquivo próprio, datado, escrito pelo `qa-execution` quando as sessões rodarem.

## Bootstrap

- Árvore `docs/qa/` criada do zero (não havia árvore anterior); templates semeados dos skills; bloco de gitignore aplicado no `.gitignore` da raiz (`state.csv`, `evidence/`).
- Sem artefatos legados de QA para adotar — `docs/visual-baseline/` são baselines visuais do design system (Playwright com API mockada), indexados no `README.md` da árvore, não migrados. Nenhum id re-mintado.

## O que foi planejado

- **Personas:** 5 (`personas.md`) — Marta (New/mobile, inscrição), Tereza (Mobile, chamada), Anselmo (Power, coordenação), Camila (New, primeiro acesso), Joaquim (Accessibility-Reliant, chamada ampliada).
- **Jornadas:** 6 (`journeys/`) — inscrever catequizando, aprovar inscrição, fazer chamada offline, primeiro acesso da catequista, preparar ano letivo, emitir relatório. Todas com flowchart, fim verdadeiro e ≥1 caminho de abandono.
- **Cenários:** 32 (`scenarios/`), todos `untested` — INS 9 · CHM 8 · AUTH 5 · ADM 7 · REL 3.
- **Charters:** 7 (`charters/`), ordem de risco abaixo.
- **Automation backlog:** 1 item (`automation-backlog/chamada-offline-sync-e2e.md`).

## Ordem das sessões (risco decrescente)

| # | Charter | Jornada | Persona | Tour | Box |
|---|---|---|---|---|---|
| 1 | CH-chamada-offline-rede-instavel | J-fazer-chamada-offline | Tereza | Network | 90 |
| 2 | CH-inscricao-celular-primeira-vez | J-inscrever-catequizando | Marta | Back-Button | 60 |
| 3 | CH-revisao-inscricoes-duas-abas | J-aprovar-inscricao | Anselmo | Multi-Tab | 60 |
| 4 | CH-primeiro-acesso-senha-provisoria | J-primeiro-acesso-catequista | Camila | Autofill | 60 |
| 5 | CH-preparar-ano-colando-datas | J-preparar-ano-letivo | Anselmo | Paste | 90 |
| 6 | CH-chamada-interrompida-zoom | J-fazer-chamada-offline | Joaquim | Interrupt | 60 |
| 7 | CH-relatorio-fim-de-periodo | J-emitir-relatorio | Anselmo | Feature | 30 |

Nota de sequência: o setup do ambiente (base nasce vazia — ver README da árvore) faz o caminho feliz de `CH-preparar-ano-colando-datas` na prática; ainda assim a sessão 5 roda por inteiro, porque o tour de colagem e os estados ambíguos não aparecem no setup. A sessão 7 consome as chamadas produzidas pelas sessões 1 e 6.

## Defeitos suspeitos (inspeção de código no planejamento — a confirmar em sessão, NÃO registrados como bugs)

O registry `bugs/` fica vazio até uma sessão reproduzir o sintoma com evidência; estes suspeitos estão encodados nos cenários/charters citados:

1. **Perda silenciosa no sync** — fila local limpa mesmo com `synced=0` (`frontend/src/lib/attendance-sync.ts:38-40`) → `CHM-sync-perda-silenciosa` (candidato Data-Loss).
2. **Regras de senha divergentes** — front ≥6 + letra + número vs backend só ≥6 (`password-rules.ts:3-7` vs `auth_handlers.go:96`) → `AUTH-regras-senha-divergentes`.
3. **Dois anos ativos possíveis** — `GetActiveEnrollmentYear` com `LIMIT 1` → `ADM-dois-anos-ativos`.
4. **Promovido some da lista** — `GET /api/catechists` filtra `role='catechist'` → `ADM-promovido-some-da-lista`.
5. **401 na fila offline** — comportamento da fila quando o sync encontra sessão expirada é indefinido → `CHM-sessao-expira-na-chamada`.
6. Menores, anotados para observação durante as sessões: `/inscricao` acessível logado; `GET /api/students` sem paginação (base inteira numa resposta); dashboard com N+1 requisições de alunos.

## Varredura da taxonomia (5 dimensões × 6 jornadas)

1. **Journeys** — todas as 6 mapeadas fim-a-fim com fim verdadeiro e abandono. Coberto.
2. **Functional** — validações, round-trips e fronteiras de auth vivem dentro dos cenários (INS-validacao-*, ADM-*, AUTH-*, idempotência CHM-reenvio-*). Coberto.
3. **Experiential** — tours + persona Joaquim (a11y/zoom) + regras do design system citadas nos cenários (botão diz motivo, 44px, mono tabular); paper cuts são protocolo da execução. Coberto.
4. **Edge/error/empty** — janela fechada, sem ano ativo, dia sem aula, período vazio, 409s de conflito/proteção, back/refresh/interrupt via tours. Coberto.
5. **Cross-cutting:**
   - *Responsividade* — coberta pelas personas mobile (390px) + admin desktop; baselines visuais complementam.
   - *Regressão* — o ciclo full É a varredura de regressão do redesign 429cc0b.
   - *Consistência* — guarda automatizada de cor literal + observação nos tours; nenhuma sessão dedicada.
   - *Continuidade cross-device* — **SKIP consciente:** o produto não promete começar no celular e terminar no desktop; a fila offline é por dispositivo, por desenho.
   - **SKIPs de tour:** *Locale Tour* — produto mono-locale pt-BR por desenho (uma paróquia); formatos BR de data/telefone estão cobertos dentro de INS/ADM. *Money Tour* — não há dinheiro no produto (non-goal do PRD). *Garbage Tour* — sem sessão dedicada neste ciclo; a colagem suja do Paste Tour (sessão 5) e a validação de INS cobrem o grosso; candidato a charter num ciclo alvo futuro (formulário de alunos em `/admin/alunos`).

## Checklist de completude (Step 7)

- [x] Toda jornada em escopo tem flowchart com fim verdadeiro e ≥1 abandono (6/6)
- [x] Toda jornada tem ≥1 charter com persona atribuída (6/6; J-fazer-chamada-offline tem 2)
- [x] Todo cenário tem id content-addressed, jornada existente e `qa_status` real (`untested` — nada foi caminhado ainda) (32/32)
- [x] Bugs abertos: nenhum registrado — registry vazio é o estado honesto pré-execução; suspeitos documentados acima
- [x] 5 dimensões da taxonomia varridas por jornada; skips registrados com razão (acima)
- [x] Tracker validado: `materialize_state.py` gera `state.csv` com 32 linhas sem violação de schema

## Próximo passo

Rodar o ciclo com o skill `qa-execution` (sessões na ordem acima, ambiente local conforme README da árvore). Cada sessão escreve debrief no relatório de execução datado, atualiza os `qa_status` e registra bugs com evidência no `bugs/`.
