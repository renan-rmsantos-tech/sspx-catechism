---
title: "Primitivos, marca e conferência visual"
status: completed
type: frontend
complexity: high
dependencies:
  - task_04
---

# Task 5: Primitivos, marca e conferência visual

## Overview

Fechar os desvios de fidelidade que sobraram nos primitivos e na marca, e produzir a evidência visual das doze superfícies. É o acabamento que o PRD colocou na Prioridade 3: nada aqui conserta defeito funcional, tudo aqui é o código deixando de contradizer o `design/`. A conferência visual desta tarefa é o que permite declarar a iniciativa concluída — e é o que faltou na anterior.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
- O brasão em SVG inline e o gradiente do `auth-shell` **andam juntos**: o inline é o que remove o filtro `[&_img]:brightness-0 [&_img]:invert` que a tela de acesso usa hoje
- O `.dot-grid` está **fora de escopo** — cortado por YAGNI no PRD. Não implementar
- A conferência é **julgamento humano** registrado, não diff de pixels (ADR-007). Não introduzir comparação automática de imagem
- Sem `design/preview/` aberto lado a lado, a conferência vira carimbo. A referência é obrigatória
</critical>

<requirements>
- O botão MUST ganhar o afundamento de 1px a 60ms no `:active`, conforme `design/DESIGN.md` §7 — o feedback de pressão é físico
- O stepper MUST virar trilhos de largura igual com legenda mono, escondendo a legenda abaixo de 720px e mantendo os trilhos, conforme §6
- A linha de chamada MUST usar lavagem de 5% para presente e 4% para ausente — hoje usa `bg-accent-soft` e `bg-danger-soft`, que são 12% e leem como card preenchido, violando §9.6
- O brasão MUST ser SVG inline herdando os tokens, com variante para fundo de tinta e forma de favicon abaixo de 20px, conforme §6
- O aside do `auth-shell` MUST usar o gradiente especificado em §5, não `bg-fg` neutro, e o filtro de inversão MUST ser removido
- `capture-baseline.ts` MUST ganhar as 7 rotas do admin com sessão de papel de coordenação — hoje o papel `catechist` está fixado em 4 pontos, sem constante compartilhada
- As mocks MUST cobrir os endpoints dos sete módulos, senão as telas renderizam banner de erro em vez do conteúdo
- A conferência MUST responder a checklist do `design/SKILL.md` contra `design/preview/` nas 12 superfícies, em telefone e desktop, com registro em `docs/qa/`
- Todas as regras da porta MUST estar em `block` ao fim
</requirements>

## Subtasks

- [x] 5.1 Aplicar o afundamento no botão, os trilhos no stepper e as lavagens corretas na linha de chamada
- [x] 5.2 Converter o brasão para SVG inline com variante de tinta e forma reduzida, removendo o filtro de inversão do `auth-shell`
- [x] 5.3 Aplicar o gradiente especificado ao aside da autenticação
- [x] 5.4 Estender `capture-baseline.ts` com as 7 rotas do admin, papel de coordenação e mocks dos módulos
- [x] 5.5 Capturar as 12 superfícies em telefone e desktop
- [x] 5.6 Conferir contra `design/preview/`, responder a checklist do `SKILL.md` e registrar em `docs/qa/`
- [x] 5.7 Confirmar todas as regras em `block` e a suíte verde

## Implementation Details

Ver TechSpec §Impact Analysis e §Development Sequencing. A decisão sobre a conferência está no ADR-007.

**Estrutura de rota em `capture-baseline.ts`**, para o passo 5.4:

```ts
{ name: string, path: string, authenticatedUser?: { id, email, fullName, role, mustChangePassword }, offline?: boolean }
```

O papel `catechist` está fixado nas linhas 27, 38, 49 e 59, um literal por rota — não há constante compartilhada. As rotas do admin precisam de papel de coordenação, porque `/admin/*` é rota protegida.

O handler de API é registrado dentro do laço de rotas (`:119`) e desregistrado após cada captura (`:156`), fechando sobre o `authenticatedUser` da iteração. `apiResponse(pathname)` é uma cadeia de `if` sobre caminho **mais query**, e devolve `null` para desconhecido, o que vira 404. Endpoints cobertos hoje: `/api/classes`, `/api/academic-years`, `/api/attendance`, `/api/class-dates?academicYearId=baseline-year`, `/api/classes/baseline-class/students`. Faltam os de catequistas, alunos, inscrições e relatórios.

O filtro de onda (`:66-68`) é um ternário sobre o nome da onda; a fase do admin entra pelo mesmo padrão.

As 7 rotas: `/admin/anos`, `/admin/calendario`, `/admin/turmas`, `/admin/alunos`, `/admin/catequistas`, `/admin/inscricoes`, `/admin/relatorios`.

**Estilo:** `capture-baseline.ts` usa aspas duplas e ponto e vírgula, diferente do resto de `src/`. Manter. `attendance-row.tsx`, `chip.tsx` e `metrics.tsx` também usam aspas duplas; `button.tsx`, `stepper.tsx` e `brand.tsx` usam aspas simples sem ponto e vírgula.

### Relevant Files

- `frontend/src/components/ui/button.tsx` — falta o `:active`
- `frontend/src/components/ui/stepper.tsx` — hoje bolinhas numeradas, deve virar trilhos
- `frontend/src/components/ui/attendance-row.tsx` — lavagens a 12%, devem ser 5% e 4%
- `frontend/src/components/ui/brand.tsx` — 3 linhas, usa `<img src="/favicon.svg">`
- `frontend/src/components/auth/auth-shell.tsx:12` — o filtro `[&_img]:brightness-0 [&_img]:invert` e o `bg-fg`
- `frontend/scripts/capture-baseline.ts` — 163 linhas, 6 rotas, 2 tamanhos de tela
- `design/preview/` — as dez fichas de referência para a conferência
- `design/DESIGN.md` §5 (`.auth`), §6 (brasão, stepper, seg), §7 (movimento)

### Dependent Files

- `frontend/src/components/ui/anchor-components.test.tsx` — renderiza `Brand`, `Stepper`, `AttendanceRow`; asserções mudam com os primitivos
- `frontend/src/pages/dashboard/attendance-page.tsx` — consome `AttendanceRow`; as lavagens mudam de aparência
- `frontend/src/pages/enrollment/enrollment-page.tsx` — consome `Stepper` nos 4 passos
- `frontend/public/favicon.svg` — permanece para favicon e PWA, onde CSS não alcança
- `docs/visual-baseline/` — recebe as imagens da fase

### Related ADRs

- [ADR-007: A conferência visual estende a captura existente](adrs/adr-007.md) — esta tarefa É a decisão; explica por que não há diff de pixels
- [ADR-005: O anel de foco é regra fora de camada](adrs/adr-005.md) — a conferência confirma que o anel não colide com os primitivos alterados aqui

## Deliverables

- Botão com feedback de pressão; stepper em trilhos; linha de chamada em lavagem
- Brasão em SVG inline herdando tokens, com o filtro de inversão removido do `auth-shell`
- Aside da autenticação com o gradiente especificado
- `capture-baseline.ts` cobrindo as 12 superfícies, com papel de coordenação e mocks dos sete módulos
- Imagens das 12 superfícies em telefone e desktop em `docs/visual-baseline/`
- Checklist do `design/SKILL.md` respondida nas 12, registrada em `docs/qa/`
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests para os primitivos alterados e para a captura **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Todas as regras da porta devolvem lista vazia sobre `frontend/src/`
  - [ ] Cada regra em `block` continua falhando com seu fixture plantado
- Integration tests:
  - [ ] Linha de chamada marcada como presente e como ausente expõe a lavagem, não o preenchimento
  - [ ] Stepper renderiza trilhos e esconde a legenda em largura reduzida, mantendo os trilhos
  - [ ] Brasão herda a cor do contexto e inverte sobre fundo de tinta sem filtro CSS
  - [ ] Brasão abaixo de 20px usa a forma reduzida
  - [ ] `auth-shell` renderiza sem nenhum filtro de imagem
  - [ ] As 7 rotas do admin capturam com conteúdo, não com banner de erro — prova de que as mocks cobrem os módulos
  - [ ] A inscrição pública continua avançando pelos 4 passos com o stepper novo
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Conferência visual aprovada nas 12 superfícies, com evidência registrada em `docs/qa/` e imagens em `docs/visual-baseline/`
- Todas as regras da porta em `block` — a partir daqui qualquer divergência nova reprova antes de entrar
- Nenhum filtro CSS sobre o brasão em superfície alguma
- O `.dot-grid` não foi implementado — o corte do PRD foi respeitado
- Nenhum fluxo, rota ou texto de navegação alterado nas 12 superfícies
