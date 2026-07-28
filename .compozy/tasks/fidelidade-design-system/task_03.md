---
title: "Primitivos habilitadores do admin"
status: completed
type: refactor
complexity: medium
dependencies:
    - task_01
---

# Task 3: Primitivos habilitadores do admin

## Overview

Preparar a biblioteca de primitivos para a migração do console da coordenação. São três mudanças de API que precisam existir **antes** da task_04, para não migrar as seis tabelas do admin duas vezes: a tabela passa a declarar suas colunas numéricas, o campo de busca ganha primitivo próprio, e o botão perde as variantes-apelido herdadas do shadcn que hoje permitem emitir um segundo botão primário sem perceber.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
- A remoção das variantes-apelido é **mecânica e verificável**: `tsc -b` reprova toda variante inexistente. Não é oportunidade para redesenhar botão
- Esta tarefa **não migra view nenhuma**. Ela toca `admin-page.tsx` apenas para renomear variantes e ajustar as 6 chamadas de `DataTable` à nova API
- A declaração de coluna numérica é a regra do tabular (ADR-006). Ela substitui uma regra da porta que **não pode existir** — varredura estática não distingue número comparável de identificador
</critical>

<requirements>
- `Table`/`DataTable` MUST aceitar a declaração de quais colunas são numéricas, e o primitivo MUST aplicar mono, alinhamento à direita e `nowrap` — o consumidor declara a intenção, o primitivo garante o tratamento
- Declarar uma coluna numérica MUST tornar impossível ela sair sem tabular; não pode haver caminho em que a declaração seja ignorada
- `field.tsx` MUST ganhar `SearchField` com o ícone posicionado dentro do controle, conforme `design/DESIGN.md` §6 (`.search-wrap`)
- `button.tsx` MUST expor apenas os quatro nomes do sistema — primário, secundário, fantasma e perigo —, removendo `default`, `outline` e `destructive`
- Os 17 usos das variantes-apelido MUST ser renomeados: 15 em `admin-page.tsx` e 2 em `confirm-dialog.tsx:33,36`
- A regra `apelido-de-variante` MUST continuar em `report` ao fim desta tarefa — ela só vira `block` na task_04, quando a migração do admin fechar
- `anchor-components.test.tsx` MUST afirmar que coluna declarada numérica renderiza com o tratamento tabular
</requirements>

## Subtasks

- [x] 3.1 Estender a API de `Table`/`DataTable` para declaração de colunas numéricas, aplicando o tratamento no primitivo
- [x] 3.2 Ajustar as 6 chamadas de `DataTable` do admin à nova API, declarando quais colunas são numéricas em cada uma
- [x] 3.3 Criar `SearchField` em `field.tsx`, com o ícone dentro do controle
- [x] 3.4 Podar as variantes-apelido de `button.tsx` para os quatro nomes do sistema
- [x] 3.5 Renomear os 17 usos afetados e confirmar com `tsc -b` que nenhum escapou
- [x] 3.6 Estender o contrato dos primitivos com o caso da coluna tabular

## Implementation Details

Ver TechSpec §Core Interfaces e §Impact Analysis. A decisão e suas trocas estão no ADR-006.

**As 6 chamadas de `DataTable` e suas colunas**, para o passo 3.2:

| Linha | View | Colunas | Headers |
|---|---|---|---|
| 246 | `AcademicYearsView` | 5 | `['Ano', 'Dias', 'Inscrições', 'Status', 'Ações']` |
| 451 | `ClassesView` | 5 | `['Turma', 'Ano', 'Catequistas', 'Status', 'Ações']` |
| 600 | `StudentsView` | 5 | `['Nome', 'Turma', 'Responsável', 'Contato', 'Ações']` |
| 690 | `CatechistsView` | 5 | `['Nome', 'E-mail', 'Papel', 'Status', 'Ações']` |
| 836 | `EnrollmentsView` | 4 | `['Nome', 'Status', 'Renovação', 'Contato']` |
| 1166 | `ReportsView` | 2 | `['Aluno', 'Presenças']` |

`Table` é consumido em exatamente dois lugares no repo: `DataTable` (`admin-page.tsx:1225-1226`) e o próprio contrato (`anchor-components.test.tsx:57`). A superfície de mudança é pequena.

**Observação apurada na exploração:** `DataTable` aplica `className="px-3 py-2"` em `th`/`td`, conflitando com os `[&_th]:px-4 [&_th]:py-3` de `Table`. Vale resolver enquanto a API muda, já que os dois vivem no mesmo lugar.

**Os 17 usos a renomear:**
- `admin-page.tsx` — `variant="outline"` nas linhas 124, 239, 254, 445, 460, 540, 594, 607, 720, 830, 1029, 1145, 1149; `variant="destructive"` nas linhas 1073 e 1270
- `confirm-dialog.tsx` — `variant="outline"` na linha 33, `variant="destructive"` na linha 36

Atenção ao teste 18 de `admin-page.test.tsx` (linha 532), que depende de `disabledReason` virar o nome acessível do botão — o comportamento não muda, mas o botão sim.

**Convenções:** `components/ui/*` usa one-liner denso, aspas simples, sem ponto e vírgula. `admin-page.tsx` usa JSX multi-linha convencional, aspas simples, sem ponto e vírgula. Manter cada arquivo no seu estilo.

### Relevant Files

- `frontend/src/components/ui/table.tsx` — 5 linhas, exporta `Table` e `TableWrap`
- `frontend/src/components/ui/field.tsx` — o `control` compartilhado onde `SearchField` se apoia
- `frontend/src/components/ui/button.tsx:5-19` — `buttonVariants` com os apelidos a podar
- `frontend/src/pages/admin/admin-page.tsx:1223-1258` — `DataTable`, o único consumidor de produção de `Table`
- `frontend/src/components/ui/confirm-dialog.tsx:33,36` — os 2 usos fora do admin
- `design/DESIGN.md` §3 (regra numérica) e §6 (`.search-wrap`, `.table`)
- `design/reference-components/Field.jsx` — mostra o `SearchField` de referência

### Dependent Files

- `frontend/src/pages/admin/admin-page.test.tsx` — 20 testes; o teste 18 depende de `disabledReason`, os demais não devem ser afetados por esta tarefa
- `frontend/src/components/ui/anchor-components.test.tsx:57` — usa `Table` diretamente
- `frontend/src/pages/dashboard/attendance-page.tsx:331` — a busca crua que vai adotar `SearchField` na task_04
- `frontend/src/test/design-fidelity/` — `apelido-de-variante` fica em `report` até a task_04

### Related ADRs

- [ADR-006: O número tabular vira API da tabela, não regra da porta](adrs/adr-006.md) — esta tarefa É a decisão; explica por que a varredura estática não serve
- [ADR-004: Controle cru proibido fora dos primitivos](adrs/adr-004.md) — `SearchField` é o exemplo previsto de "estender o primitivo em vez de abrir exceção"

## Deliverables

- `Table`/`DataTable` com declaração de colunas numéricas e tratamento aplicado no primitivo
- As 6 chamadas do admin ajustadas, com as colunas numéricas declaradas
- `SearchField` em `field.tsx`
- `button.tsx` com os quatro nomes do sistema e os 17 usos renomeados
- Contrato dos primitivos cobrindo a coluna tabular
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests para a nova API de tabela e para `SearchField` **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Coluna declarada numérica renderiza com mono, alinhamento à direita e `nowrap`
  - [ ] Coluna não declarada permanece com o tratamento padrão
  - [ ] Tabela sem nenhuma coluna declarada continua funcionando — a declaração é opcional, o tratamento não
  - [ ] `SearchField` posiciona o ícone dentro do controle e mantém a altura de toque
  - [ ] `SearchField` expõe nome acessível quando recebe rótulo
- Integration tests:
  - [ ] As 6 tabelas do admin renderizam com as colunas numéricas alinhadas
  - [ ] Os 20 testes de `admin-page.test.tsx` continuam passando após a renomeação das variantes
  - [ ] O botão desabilitado continua expondo `disabledReason` como nome acessível (teste 18)
  - [ ] `tsc -b` passa — nenhuma variante inexistente sobrou
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Não existe caminho em que uma coluna declarada numérica saia sem tabular
- `button.tsx` expõe exatamente quatro variantes, e `tsc -b` confirma que nenhum uso ficou órfão
- Os 20 testes do admin continuam verdes — esta tarefa não deve quebrar nenhum
- `apelido-de-variante` continua em `report`, aguardando a task_04
- Nenhuma view do admin foi migrada visualmente
