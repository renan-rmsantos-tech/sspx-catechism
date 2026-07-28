---
title: "Foco visível em todo controle"
status: completed
type: bugfix
complexity: medium
dependencies:
  - task_01
---

# Task 2: Foco visível em todo controle

## Overview

Fechar a falha de acessibilidade que atinge as doze superfícies do produto: nenhum controle da aplicação mostra indicação de foco por teclado. É falha de WCAG 2.4.7 Focus Visible, nível AA — `outline: none` sem substituto equivalente é a falha nomeada no critério. O conserto de comportamento é uma regra de CSS mudando de lugar; o resto da tarefa é a rede que impede a regressão pelo mesmo caminho.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
- O problema é de **cascata, não de especificidade**: `:focus-visible` está em `@layer base` e as utilities em `@layer utilities`; camada posterior vence sempre. Regra fora de camada vence todas
- A mudança tem **alcance total** — o anel passa a aparecer em superfícies que hoje não o mostram, inclusive as já conformes
- Esta tarefa **não migra o admin**. Os controles do admin continuam crus até a task_04; eles só ganham o anel global
</critical>

<requirements>
- A regra `:focus-visible` MUST sair de `@layer base` e virar regra sem camada em `frontend/src/styles.css`, com comentário explicando a cascata — senão alguém "arruma" devolvendo-a para dentro da camada
- Os três apagamentos de foco MUST ser removidos: `button.tsx:5`, `field.tsx:5`, `attendance-page.tsx:331`
- O campo MUST ganhar, por cima do piso global, o anel de 3px a 18% que `design/DESIGN.md` §6 especifica para ele — o piso é o contorno de 2px, o campo tem tratamento próprio
- `anchor-components.test.tsx` MUST afirmar foco em todo primitivo interativo, não só nos que mudaram
- A regra `foco-apagado` MUST virar `block` ao fim desta tarefa
- A conferência por teclado das 12 superfícies MUST ser registrada em `docs/qa/`, seguindo o formato da árvore viva existente
</requirements>

## Subtasks

- [x] 2.1 Mover `:focus-visible` para fora de camada em `frontend/src/styles.css`, com comentário sobre a ordem de camadas
- [x] 2.2 Remover os três `outline-none` e adicionar o anel de 3px especificado ao controle de formulário
- [x] 2.3 Estender `anchor-components.test.tsx` com as afirmações de foco nos primitivos interativos
- [x] 2.4 Virar `foco-apagado` para `block` no registro de regras
- [x] 2.5 Percorrer as 12 superfícies por teclado, conferindo que o anel aparece e não colide com gaveta, controle segmentado nem linha de chamada
- [x] 2.6 Registrar a conferência em `docs/qa/`

## Implementation Details

Ver TechSpec §Impact Analysis para o alcance da mudança e §Testing Approach para a camada de contrato.

O estado atual, para referência:

```
frontend/src/styles.css:79   @layer base { :focus-visible { outline: 2px solid var(--accent); ... } }
frontend/src/components/ui/button.tsx:5              focus-visible:outline-none   (sem ring de substituição)
frontend/src/components/ui/field.tsx:5               focus:outline-none           (atinge input, select, textarea)
frontend/src/pages/dashboard/attendance-page.tsx:331 outline-none                 (busca da chamada)
```

Ordem de camadas no CSS gerado, verificada no build: `@layer properties, theme, base, components, utilities`.

`anchor-components.test.tsx` já renderiza 18 primitivos e afirma classes de token, `min-h-touch` e `disabledReason`, no estilo `render(<>…</>)` com asserts via `toHaveClass`. As afirmações de foco entram nesse mesmo padrão. Import explícito do vitest, `it` e não `test`, nomes em inglês.

As 12 superfícies para a conferência: acesso, troca de senha, painel do catequista, folha de chamada, inscrição pública, e as sete do admin — anos, calendário, turmas, alunos, catequistas, inscrições, relatórios.

### Relevant Files

- `frontend/src/styles.css:79` — a regra e sua camada atual
- `frontend/src/components/ui/button.tsx:5` — `focus-visible:outline-none`
- `frontend/src/components/ui/field.tsx:5` — `focus:outline-none` no `control` compartilhado
- `frontend/src/pages/dashboard/attendance-page.tsx:331` — busca com `outline-none`
- `frontend/src/components/ui/anchor-components.test.tsx` — o contrato dos primitivos
- `design/DESIGN.md` §6 (foco do campo) e §7 (foco global)
- `docs/qa/` — a árvore viva onde a conferência é registrada

### Dependent Files

- Todas as 12 superfícies — o anel passa a aparecer em todas; nenhuma precisa de alteração, mas todas precisam de conferência
- `frontend/src/components/ui/drawer.tsx`, `seg.tsx`, `sidebar.tsx`, `choice.tsx` — controles interativos que ganham o anel e podem ter colisão visual
- `frontend/src/test/design-fidelity/` — a regra `foco-apagado` muda de nível

### Related ADRs

- [ADR-005: O anel de foco é regra CSS fora de camada, com contrato nos primitivos](adrs/adr-005.md) — esta tarefa É a decisão
- [ADR-001: A porta escreve o backlog](adrs/adr-001.md) — a regra `foco-apagado` da task_01 é o que aponta os três arquivos

## Deliverables

- `:focus-visible` como regra sem camada, comentada
- Os três apagamentos removidos, com o anel de 3px do spec no controle de formulário
- Afirmações de foco em todo primitivo interativo no contrato
- `foco-apagado` em `block`
- Conferência por teclado das 12 superfícies registrada em `docs/qa/`
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests para o comportamento de foco nos primitivos **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] A regra `foco-apagado` devolve lista vazia sobre `frontend/src/` depois das remoções
  - [ ] A regra `foco-apagado` em `block` falha se um `outline-none` for reintroduzido — pelo fixture plantado
  - [ ] A regra pega as três variantes: `outline-none`, `focus:outline-none`, `focus-visible:outline-none`
- Integration tests:
  - [ ] Botão em cada variante não carrega nenhuma classe que suprima contorno
  - [ ] Campo, seleção e área de texto expõem o tratamento de foco especificado
  - [ ] Item de navegação, aba do segmentado e fechar-gaveta são alcançáveis por teclado e mantêm o anel
  - [ ] A busca da folha de chamada mantém o anel após a remoção do `outline-none`
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Falha WCAG 2.4.7 fechada: 100% dos controles com foco visível pelo teclado nas 12 superfícies
- `foco-apagado` em `block` e verde — 2 de 5 regras bloqueantes
- Nenhuma colisão visual do anel com gaveta, segmentado ou linha de chamada
- Conferência por teclado registrada em `docs/qa/`, com as 12 superfícies nomeadas
- Nenhum fluxo, rota ou texto de navegação alterado
