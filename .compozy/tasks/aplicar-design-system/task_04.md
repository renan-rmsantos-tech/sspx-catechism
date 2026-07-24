---
title: "Onda 3 — Inscrição pública em etapas (stepper)"
status: completed
type: frontend
complexity: medium
dependencies:
    - task_03
---

# Task 4: Onda 3 — Inscrição pública em etapas (stepper)

## Overview

Transforma o formulário público de inscrição — hoje uma página única com `FormData` cru e campos locais improvisados — em um fluxo de etapas curtas com indicador de progresso e campos de escolha em blocos tocáveis. É a única mudança deliberada de fluxo da iniciativa (PRD §User Experience): mesmos dados, mesmo payload, mesma API — só a apresentação muda.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
- O payload de `POST /api/enrollments` deve permanecer IDÊNTICO ao atual (paridade do PRD)
</critical>

<requirements>
- `enrollment-page.tsx` migrado de `FormData` para um único form react-hook-form + `publicEnrollmentSchema` (zodResolver), com estado de etapa local e validação por etapa via `schema.pick(...)` ao avançar
- Etapas curtas (dados do catecúmeno → histórico religioso → responsáveis → revisão/envio) com `Stepper` indicando progresso; voltar preserva valores preenchidos
- Campos booleanos/opções como blocos de escolha tocáveis (`choice`), campos com `Field` do kit; alvos ≥44px (formulário usado no celular)
- Componentes locais improvisados (`Field`, `Textarea`, `BooleanField` internos da página) substituídos pelo kit
- Tela de sucesso no padrão novo; mensagens de erro de envio no tom do DS
- Submissão de ponta a ponta funcionando; payload comparado ao formato atual
- Fechamento: checklist `SKILL.md` + baseline (`onda-3-inscricao/`)
</requirements>

## Subtasks

- [ ] 4.1 Migrar o form para RHF + zodResolver mantendo o schema e o payload atuais
- [ ] 4.2 Particionar em etapas com validação `schema.pick` ao avançar e navegação voltar/avançar
- [ ] 4.3 Substituir campos locais pelo kit (`Field`, `choice`, `Stepper`)
- [ ] 4.4 Migrar estados de envio (sucesso/erro) para o padrão novo
- [ ] 4.5 Rodar checklist do `SKILL.md` e capturar baseline da onda

## Implementation Details

Ver TechSpec §Core Interfaces (Stepper: apresentação separada do estado; um único form RHF submetido inteiro no final) e §Data Models (sub-schemas via `pick`, schema completo preservado). O RHF + `@hookform/resolvers` já são dependências do projeto (usados no admin). Referência visual: fluxo de inscrição em `design/ui_kits/app/` e blocos `choice` em `components.html`.

### Relevant Files

- `frontend/src/pages/enrollment/enrollment-page.tsx` — reescrito como stepper RHF
- `frontend/src/lib/enrollment-api.ts` — `publicEnrollmentSchema` e `submitPublicEnrollment` consumidos sem alteração
- `frontend/src/pages/enrollment/enrollment-page.test.tsx` — atualizado para o fluxo em etapas

### Dependent Files

- `backend` `POST /api/enrollments` — contrato inalterado (nenhuma mudança de backend)
- `frontend/src/test/color-literals.test.ts` — arquivo da onda sai da allowlist se estiver nela

### Related ADRs

- [ADR-001](adrs/adr-001.md) — Onda 3 na sequência
- [ADR-003](adrs/adr-003.md) — kit via utilities + CVA

## Deliverables

- Inscrição em etapas funcionando de ponta a ponta com payload idêntico
- Baseline da onda em `docs/visual-baseline/onda-3-inscricao/`
- Unit tests com 80%+ coverage na página **(REQUIRED)**
- Teste de paridade de payload **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Avançar com etapa inválida bloqueia e mostra erros; com etapa válida avança
  - [ ] Voltar preserva os valores preenchidos em todas as etapas
  - [ ] Blocos de escolha alternam estado e refletem no form
  - [ ] Erro de envio da API exibe mensagem e permite reenvio
- Integration tests:
  - [ ] Fluxo completo: preencher todas as etapas → enviar → payload capturado no mock de fetch é idêntico ao formato atual (mesmas chaves e tipos de `PublicEnrollmentPayload`) → tela de sucesso
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Payload de submissão byte-compatível com o formato pré-migração
- Checklist do `SKILL.md` passa; baseline capturado
- Nenhuma cor literal no arquivo da página
