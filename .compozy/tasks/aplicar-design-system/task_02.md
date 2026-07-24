---
title: "Onda 1 — Auth: shell full-ink, login, trocar senha, regras ao vivo"
status: completed
type: frontend
complexity: medium
dependencies:
    - task_01
---

# Task 2: Onda 1 — Auth: shell full-ink, login, trocar senha, regras ao vivo

## Overview

Migra a menor área da aplicação — login e troca de senha — para o novo shell institucional (painel full-ink com brasão ao lado do formulário, conforme `shell-auth.html`), com regras de senha validadas ao vivo durante a digitação. Atua como piloto da fundação: valida tokens e componentes em telas reais antes das áreas críticas.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
- Fluxos NÃO mudam — mesmos passos, mesmas rotas, mesma API (paridade funcional do PRD)
</critical>

<requirements>
- `auth-shell.tsx` refeito: painel institucional escuro (brasão `brand` sobre full-ink) + área de formulário, responsivo (painel colapsa/empilha no mobile), substituindo o card centrado atual
- `login-page.tsx` e `change-password-page.tsx` migrados para os componentes do kit (`Field`, `Button` com `disabledReason`, chips de erro)
- Regras de senha exibidas e validadas ao vivo durante a digitação no primeiro acesso (checklist visual por regra), usando a validação Zod existente
- Um único `btn-primary` por tela; serifa apenas no wordmark; alvos ≥44px
- Rotas (`/login`, `/trocar-senha`), `auth-context`, `route-guard` e chamadas de API inalterados
- Fechamento de onda: checklist `design/SKILL.md` + capturas de baseline (`onda-1-auth/`)
</requirements>

## Subtasks

- [ ] 2.1 Reconstruir o `auth-shell` como shell institucional full-ink com brasão
- [ ] 2.2 Migrar `login-page` para o kit (Field, Button, estados de erro)
- [ ] 2.3 Migrar `change-password-page` com regras de senha validadas ao vivo
- [ ] 2.4 Rodar a checklist do `SKILL.md` nas duas telas e corrigir o que falhar
- [ ] 2.5 Capturar baseline da onda (`docs/visual-baseline/onda-1-auth/`)

## Implementation Details

Ver TechSpec §Development Sequencing (Onda 1) e §Core Interfaces. Referência visual: `design/ui_kits/app/shell-auth.html`. O shell atual (`components/auth/auth-shell.tsx`) é um card centrado simples — a estrutura nova vem da referência, adaptada com utilities+tokens.

### Relevant Files

- `frontend/src/components/auth/auth-shell.tsx` — refeito como shell full-ink
- `frontend/src/components/auth/login-page.tsx` — migrado ao kit
- `frontend/src/components/auth/change-password-page.tsx` — migrado + regras ao vivo
- `design/ui_kits/app/shell-auth.html` — oráculo visual

### Dependent Files

- `frontend/src/contexts/auth-context.tsx` — consumido sem alteração
- `frontend/src/components/auth/route-guard.tsx` — inalterado
- `frontend/src/lib/auth-api.ts` — inalterado
- `frontend/src/test/color-literals.test.ts` — arquivos de auth saem da allowlist se estiverem nela

### Related ADRs

- [ADR-001](adrs/adr-001.md) — Onda 1 como piloto da fundação
- [ADR-003](adrs/adr-003.md) — componentes via utilities + CVA

## Deliverables

- Shell institucional + duas telas de auth no visual novo
- Regras de senha ao vivo funcionando no primeiro acesso
- Capturas de baseline da onda em `docs/visual-baseline/onda-1-auth/`
- Unit tests com 80%+ coverage nas telas alteradas **(REQUIRED)**
- Fluxos de login/troca funcionando como antes **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Login: credencial válida navega como hoje; erro de API exibe mensagem no padrão novo
  - [ ] Troca de senha: regras aparecem e mudam de estado conforme a digitação; submit só habilita com todas cumpridas (botão desabilitado explica o motivo)
  - [ ] Shell renderiza brasão/wordmark (serifa só ali) e um único botão primário por tela
- Integration tests:
  - [ ] Fluxo completo primeiro acesso: login com `mustChangePassword` → troca → redirecionamento (testes existentes de auth-routing permanecem verdes)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing; suíte existente verde sem modificação
- Checklist do `SKILL.md` passa nas duas telas
- Baseline da onda capturado
- Nenhuma cor literal nos arquivos tocados
