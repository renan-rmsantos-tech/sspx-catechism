---
title: "A porta de fidelidade"
status: pending
type: test
complexity: high
dependencies: []
---

# Task 1: A porta de fidelidade

## Overview

Construir a verificação automática de fidelidade ao design system e calibrá-la para **reprovar o código de hoje**. A lista de falhas que ela emite é o backlog das tarefas 2 a 5 — é a decisão central do ADR-001: o inventário do desvio passa a ser derivado por máquina, não por auditoria humana. Ao fim desta tarefa nada de UI mudou ainda; o que existe é um relatório confiável e uma rede que impede as superfícies já conformes de regredir enquanto as outras são consertadas.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
- A porta é **leitura de arquivo**, nunca compilação nem renderização: ela roda no portão de deploy, que executa na droplet de produção (`infra/README.md:244-245`)
- Regra que produz falso positivo **não entra** (ADR-001). Toda regra precisa reprovar o código atual por um motivo real e verificável
- Esta tarefa **não altera nenhuma tela**. Se um arquivo de `src/pages/` ou `src/components/ui/` mudar, o escopo vazou
</critical>

<requirements>
- O registro de regras MUST exigir `fixture` no tipo `Rule` — não pode ser possível registrar uma regra sem a violação plantada que prova que ela funciona
- Cada regra MUST declarar `enforcement: 'report' | 'block'`; em `report` ela lista as violações e passa, em `block` ela falha
- A regra `classe-inexistente` MUST derivar seu vocabulário de `design/assets/catequese-ds.css` menos `frontend/src/styles.css` (ADR-003), e a extração MUST descer em seletores compostos — `num-col` só existe como `.table .num-col` na linha 318
- `cor-literal` MUST nascer em `block` (já está verde); `foco-apagado`, `classe-inexistente`, `controle-cru` e `apelido-de-variante` MUST nascer em `report`
- A migração de `frontend/src/test/color-literals.test.ts` MUST preservar a técnica de auto-verificação: `mkdtemp`, fixture com o literal montado por concatenação, e o reset explícito de `lastIndex` em regex global de módulo
- O `COPY` em `infra/Caddy.Dockerfile` MUST vir **antes** do `RUN npx vitest run` da linha 13, e MUST espelhar o layout para que `../design/assets/catequese-ds.css` resolva igual dentro e fora da imagem
- O relatório emitido MUST estar ordenado por superfície, com arquivo, linha e trecho
</requirements>

## Subtasks

- [ ] 1.1 Criar o varredor de arquivos, os tipos (`Rule`, `Violation`, `RuleContext`) e o condutor que derrama as duas suítes a partir do registro
- [ ] 1.2 Implementar `legacyOnlyClasses()` — extrair seletores de classe do CSS de referência, inclusive aninhados, e subtrair os que o projeto define
- [ ] 1.3 Implementar as cinco regras com seus fixtures plantados, nos níveis de aplicação definidos acima
- [ ] 1.4 Migrar `color-literals.test.ts` para o registro, mantendo-a em `block` e preservando a auto-verificação
- [ ] 1.5 Adicionar a linha de `COPY` em `infra/Caddy.Dockerfile` e o hook `scripts/pre-push.sh`, com a instalação documentada em `infra/README.md` §8
- [ ] 1.6 Exercitar um deploy real (`git push production main`) confirmando que a regra `classe-inexistente` encontra a folha de referência dentro da imagem
- [ ] 1.7 Emitir e publicar o relatório de divergências ordenado por superfície

## Implementation Details

Ver TechSpec §Core Interfaces para as assinaturas de `Rule`, `Violation`, `RuleContext` e `legacyOnlyClasses`, e §System Architecture para a fronteira entre a porta (não renderiza) e o contrato dos primitivos (renderiza).

Ponto de partida obrigatório: `frontend/src/test/color-literals.test.ts` já é o modelo. Ele exporta o helper testável do próprio arquivo de teste, tem dois casos — "guarda passa no repo real" e "guarda detecta violação plantada" —, e monta o literal do fixture por concatenação para não disparar a si mesmo. Replicar essa forma.

O que cada regra reprova hoje, para calibração:

| Regra | Reprova | Onde |
|---|---|---|
| `classe-inexistente` | 31 ocorrências | `admin-page.tsx` — 28 exatas + `:323`, `:701`, `:1067` compostas |
| `controle-cru` | 5 botões, 31 campos | `admin-page.tsx:839,1039`; `attendance-page.tsx:331`; checkboxes em `:215,223,429,439,584,588` |
| `foco-apagado` | 3 arquivos | `button.tsx:5`, `field.tsx:5`, `attendance-page.tsx:331` |
| `apelido-de-variante` | 17 usos | 15 em `admin-page.tsx`, 2 em `confirm-dialog.tsx:33,36` |
| `cor-literal` | nada | já verde |

Convenções da suíte: import explícito do vitest mesmo com `globals: true`, `it` e nunca `test`, nomes de teste em inglês para infraestrutura. Aspas simples e sem ponto e vírgula, como no restante de `src/test/`.

### Relevant Files

- `frontend/src/test/color-literals.test.ts` — o modelo a replicar e a guarda a absorver
- `design/assets/catequese-ds.css` — fonte do vocabulário legado; 99 seletores de primeiro nível, `num-col` aninhado na linha 318
- `frontend/src/styles.css` — define apenas 5 classes (`display`, `num`, `eyebrow`, `wordmark`, `text-muted`), linhas 82-87
- `infra/Caddy.Dockerfile` — linha 11 copia só `frontend/`; o `COPY` novo entra antes da linha 13
- `scripts/post-receive.sh` — o padrão de hook versionado e instalado por cópia
- `infra/README.md` §8 (137-245) — onde documentar a instalação do `pre-push`
- `frontend/vitest.config.ts` — `globals: true`, jsdom, execução serial

### Dependent Files

- `frontend/src/pages/admin/admin-page.tsx` — alvo de 3 das 5 regras; **não deve ser alterado nesta tarefa**
- `frontend/src/components/ui/button.tsx`, `field.tsx` — alvos de `foco-apagado`; alterados na task_02
- `frontend/src/components/ui/confirm-dialog.tsx` — 2 usos de variante-apelido; alterado na task_03
- `compose.traefik.yaml:48` — contexto de build na raiz; não muda, mas é o que torna o `COPY` possível

### Related ADRs

- [ADR-001: A porta automática escreve o backlog](adrs/adr-001.md) — esta tarefa É a decisão: a porta primeiro, calibrada para falhar, e o relatório vira backlog
- [ADR-002: Meta-testes Vitest no trilho existente, mais pre-push](adrs/adr-002.md) — define os três pontos de execução e por que não há CI
- [ADR-003: Vocabulário derivado da folha de referência](adrs/adr-003.md) — define `legacyOnlyClasses` e a dependência de caminho que exige o `COPY`
- [ADR-004: Controle cru proibido fora dos primitivos](adrs/adr-004.md) — define a regra `controle-cru` e a ausência deliberada de allowlist

## Deliverables

- `frontend/src/test/design-fidelity/` com registro, varredor, condutor e as cinco regras
- `legacyOnlyClasses()` funcionando sobre seletores simples e compostos
- `color-literals.test.ts` absorvido no registro, sem perda da auto-verificação
- `scripts/pre-push.sh` versionado, com instalação documentada em `infra/README.md` §8
- `infra/Caddy.Dockerfile` com o `COPY` da folha de referência, validado num deploy real
- Relatório de divergências ordenado por superfície, publicado
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests para o portão de deploy — o `COPY` exercitado de ponta a ponta **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `legacyOnlyClasses` com CSS sintético: seletor simples, seletor composto aninhado, seletor já definido no projeto — devolve só o que existe no `design/` e não no projeto
  - [ ] `legacyOnlyClasses` inclui `num-col`, provando que a extração desce em `.table .num-col`
  - [ ] `legacyOnlyClasses` exclui `num`, `eyebrow`, `display`, `wordmark`, `text-muted`
  - [ ] Varredor sobre árvore temporária: recursa em subdiretório, ignora arquivo que não é `.ts`/`.tsx`, devolve caminho relativo à raiz
  - [ ] Cada uma das cinco regras pega sua violação plantada (o caso obrigatório do `fixture`)
  - [ ] Regra em `report` com violações **passa**; a mesma regra em `block` com as mesmas violações **falha**
  - [ ] `cor-literal` continua devolvendo lista vazia sobre `frontend/src/` real
  - [ ] Regex global de módulo não pula arquivo por `lastIndex` residual — o caso que a guarda original já cobre
- Integration tests:
  - [ ] `npm test` em `frontend/` executa a porta junto com a suíte existente, sem quebrar os ~75 testes atuais
  - [ ] `git push production main` constrói a imagem com a folha de referência presente e a regra `classe-inexistente` encontra o arquivo
  - [ ] Reprovação em `block` faz a imagem não construir, e o `post-receive.sh` reverte sem tocar containers
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- A porta reprova o código atual apontando as 31 ocorrências de classe morta e os 3 apagamentos de foco, com arquivo e linha
- Nenhuma regra produz falso positivo — cada violação apontada é verificável à mão
- Cada regra explica sua falha em uma frase, sem exigir leitura do `DESIGN.md`
- `cor-literal` está em `block` e verde; as outras quatro estão em `report`
- Um deploy real foi executado com sucesso após o `COPY`
- Nenhum arquivo de `src/pages/` ou `src/components/ui/` foi alterado
