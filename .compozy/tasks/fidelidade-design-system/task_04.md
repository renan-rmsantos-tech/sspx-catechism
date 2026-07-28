---
title: "Migração das sete views do admin"
status: completed
type: frontend
complexity: critical
dependencies:
    - task_02
    - task_03
---

# Task 4: Migração das sete views do admin

## Overview

Trazer o console da coordenação para dentro do design system. É a tarefa que o commit `429cc0b` declarou ter feito e não fez: 139 de 1305 linhas foram tocadas, e os formulários das sete telas ficaram com estilo padrão do navegador. Ao fim desta tarefa três regras da porta viram bloqueantes e a checklist do `design/SKILL.md` é respondida item a item por tela — é o critério de saída que a Onda 4 anterior declarou sem cumprir.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
- **Migrar uma view por vez, rodando a suíte do admin a cada uma.** Nunca acumular. É a mitigação do maior risco desta iniciativa
- **13 dos 20 testes quebram** se o `Field` local for trocado pelo do design system sem passar `id` casando com o `id` do controle. O local associa por envolvimento, o do sistema por `htmlFor`
- **Não extrair as views** para arquivos próprios. É Non-Goal explícito do PRD; os arquivos de entrada seguem como reexportações
- Nenhum fluxo, rota, texto de navegação ou contrato com o backend muda. Paridade funcional é restrição do PRD
</critical>

<requirements>
- O `Field` local de `admin-page.tsx:1180-1196` MUST ser removido e substituído pelo primitivo, com `id` passado em todo campo para preservar a associação de rótulo
- As 31 ocorrências de classe morta MUST desaparecer — 28 com `className="input"` exato e as 3 compostas em `:323`, `:701`, `:1067`
- Os 2 botões crus (`:839` na fila de inscrições, `:1039` no seletor de aluno) e os 6 checkboxes (`:215`, `:223`, `:429`, `:439`, `:584`, `:588`) MUST adotar os primitivos, preservando seus nomes acessíveis
- O estado das inscrições MUST virar chip em português — Pendente, Aprovada, Rejeitada — substituindo os termos técnicos em inglês de `:838`
- Renovação MUST usar o dourado litúrgico, que é o papel que `design/DESIGN.md` §2 reserva para ele; dourado nunca é ação
- O indicador de rede MUST aparecer no shell do admin (`:111-144`), porque é superfície que grava dados
- `Section` (`:1198-1205`) MUST usar os tokens de raio e elevação, não `rounded-lg shadow-sm` do Tailwind
- O vazio de `DataTable` (`:1250`) MUST dizer o próximo passo, no lugar de "Nenhum registro encontrado."
- As regras `classe-inexistente`, `controle-cru` e `apelido-de-variante` MUST virar `block` ao fim desta tarefa
- A checklist do `design/SKILL.md` MUST ser respondida item a item para cada uma das sete telas e registrada em `docs/qa/`
</requirements>

## Subtasks

- [x] 4.1 Remover o `Field` local e migrar `AcademicYearsView` e `CalendarView`, rodando a suíte do admin ao fim de cada
- [x] 4.2 Migrar `ClassesView` e `StudentsView` — a segunda concentra 11 das 31 ocorrências
- [x] 4.3 Migrar `CatechistsView`, `EnrollmentsView` e `ReportsView`, incluindo `StudentPicker` e `RejectBox`
- [x] 4.4 Trocar estado por chip em português e aplicar o dourado à renovação
- [x] 4.5 Adicionar o indicador de rede ao shell, ajustar `Section` aos tokens e reescrever o vazio de `DataTable`
- [x] 4.6 Virar `classe-inexistente`, `controle-cru` e `apelido-de-variante` para `block`
- [x] 4.7 Responder a checklist do `design/SKILL.md` nas sete telas e registrar em `docs/qa/`

## Implementation Details

Ver TechSpec §Impact Analysis para o risco e §Development Sequencing para a ordem das views. As decisões estão nos ADRs 004 e 006.

**Distribuição das 31 ocorrências por view**, para dimensionar cada passo:

| View | Linhas | Ocorrências | Onde |
|---|---|---|---|
| `AcademicYearsView` | 146-273 | 3 | 212, 231, 234 |
| `CalendarView` | 275-333 | 2 | 313 + `:323` composta |
| `ClassesView` | 353-467 | 4 | 401, 404, 414, 417 |
| `StudentsView` | 469-614 | 11 | 534, 547, 557, 560, 563, 566, 569, 572, 575, 578, 581 |
| `CatechistsView` | 622-742 | 3 | 681, 684 + `:701` composta |
| `EnrollmentsView` | 744-939 | 3 | 818, 824, 866 |
| `StudentPicker` | 949-1058 | 1 | 1018 |
| `RejectBox` | 1060-1079 | 1 | `:1067` composta |
| `ReportsView` | 1081-1178 | 3 | 1125, 1135, 1138 |

**Os 13 testes que dependem de `<label>` envolvente** e quebram sem `id`: rótulos `'Ano'`, `'Ano letivo'` (2×), `'Datas (uma por linha)'`, `'Nome'` (2×), `'Nível'`, `'Nome completo'`, `'Telefone'`, `'E-mail'` (2×), `'Turma'` (3×), `'De'`, `'Até'`, e o checkbox `'Catequista Um'`. Correspondem aos testes 2, 6, 7, 9, 10, 11, 15, 17, 19 e 20.

**Os 7 que migram limpos**, porque não dependem de envolvimento: `'Buscar alunos'` e `'Buscar inscrições'` (`aria-label` no próprio controle), `'Papel de Fátima Souza'` (`aria-label` no `select`), `'Aluno já cadastrado'` e `'Motivo da rejeição'` (já usam `htmlFor`/`id`), `'Calendário de 2026'` (`aria-label`), e os que usam `data-testid`.

**Botões crus e seus testes:** `:839` é o botão "Pedro Santos" que abre a gaveta e é usado por 5 testes; `:1039` é o "Ana Clara" do seletor. Ambos sobrevivem se virarem `Button` fantasma mantendo o texto.

**Convenções:** `admin-page.tsx` usa JSX multi-linha, aspas simples, sem ponto e vírgula. Comentário de regra de negócio em pt-BR citando o bug entre parênteses — o arquivo já faz isso em `:177`, `:193-194`, `:774-775`. Teste novo com id de bug vai em pt-BR com o id no fim do nome, entre parênteses.

### Relevant Files

- `frontend/src/pages/admin/admin-page.tsx` — 1305 linhas, as 7 views e os helpers locais
- `frontend/src/pages/admin/admin-page.test.tsx` — 602 linhas, 20 testes num único `describe('AdminPage')`
- `frontend/src/components/ui/field.tsx` — `Field`, `Input`, `Select`, `Textarea` e o `SearchField` da task_03
- `frontend/src/components/ui/chip.tsx` — `Chip` com tom dourado e `NetworkChip`
- `frontend/src/components/ui/choice.tsx` — substitui os checkboxes nativos
- `frontend/src/components/ui/empty-state.tsx` — o vazio que diz o próximo passo
- `design/SKILL.md` §9 — a checklist a responder por tela
- `design/DESIGN.md` §2 (dourado como sinal) e §6 (chips como portador de estado)

### Dependent Files

- `frontend/src/pages/admin/views/*.tsx` — 7 reexportações; não mudam, mas quebram se um símbolo for renomeado
- `frontend/src/components/ui/confirm-dialog.tsx` — `data-testid="confirm-destructive"`, usado por 3 testes
- `frontend/src/test/design-fidelity/` — três regras mudam de nível ao fim
- `docs/qa/` — recebe a checklist das sete telas

### Related ADRs

- [ADR-004: Controle cru proibido fora dos primitivos](adrs/adr-004.md) — por que o `Field` local sai e não há allowlist
- [ADR-003: Vocabulário derivado da folha de referência](adrs/adr-003.md) — por que `className="input"` é reprovado
- [ADR-006: O tabular vira API da tabela](adrs/adr-006.md) — as colunas declaradas na task_03 são preenchidas aqui
- [ADR-001: A porta escreve o backlog](adrs/adr-001.md) — o relatório da task_01 é a lista de trabalho desta tarefa

## Deliverables

- As sete views usando os primitivos do design system, sem classe morta e sem controle cru
- Estado das inscrições em chip e em português, renovação em dourado
- Indicador de rede no shell, `Section` sobre tokens, vazio com próximo passo
- Os 13 testes afetados consertados, sem perda de cobertura de comportamento
- `classe-inexistente`, `controle-cru` e `apelido-de-variante` em `block`
- Checklist do `design/SKILL.md` respondida nas sete telas e registrada em `docs/qa/`
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests para as sete views **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] As três regras devolvem lista vazia sobre `frontend/src/` ao fim da migração
  - [ ] Cada regra em `block` falha com o fixture plantado reintroduzido
- Integration tests:
  - [ ] Os 20 testes existentes continuam cobrindo o mesmo comportamento após a migração dos seletores
  - [ ] Cada uma das sete views renderiza seus campos com rótulo associado ao controle — `getByLabelText` encontra todos
  - [ ] Estado de inscrição aparece como Pendente, Aprovada ou Rejeitada, nunca em inglês
  - [ ] Inscrição de renovação exibe o selo dourado, e o dourado não aparece em nenhum botão
  - [ ] O shell do admin renderiza o indicador de rede
  - [ ] Tabela vazia exibe o próximo passo, não "Nenhum registro encontrado."
  - [ ] Erro de formulário continua amarrado a `aria-invalid` em cada view
  - [ ] Os fluxos de aprovar, rejeitar com motivo e renovar continuam funcionando de ponta a ponta
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Zero ocorrências de classe morta e zero controles crus em `frontend/src/pages/`
- 5 de 5 regras da porta em `block` e verdes
- Checklist do `design/SKILL.md` respondida item a item nas sete telas, sem item em falha, registrada em `docs/qa/`
- Nenhum cenário de `docs/qa/state.csv` abre bug funcional novo
- Nenhuma view foi extraída para arquivo próprio — o Non-Goal foi respeitado
