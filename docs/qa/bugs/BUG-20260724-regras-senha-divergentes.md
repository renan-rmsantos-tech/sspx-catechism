# BUG-20260724-regras-senha-divergentes: A tela exige "uma letra e um número" na senha; o servidor aceita qualquer coisa com 6 caracteres

- **Status:** open
- **Impact (user-side):** Trust-Damage
- **Severity:** High · **Priority:** P1
- **Persona Affected:** Camila
- **Journey Step:** J-primeiro-acesso-catequista, step 3 (troca de senha)
- **Scenarios:** AUTH-regras-senha-divergentes; AUTH-troca-forcada-primeiro-login
- **Found:** 2026-07-24 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

A checklist de troca de senha promete uma política ("Pelo menos 6 caracteres" **e** "Uma letra e um número") que o servidor não cumpre: `POST /api/auth/change-password` com `"123456"` retorna **200 ok**. A política real do sistema é só "6 caracteres" — a checklist é teatro. Qualquer cliente fora da SPA (ou uma futura tela que esqueça a regra) cria senhas fracas em contas que gerenciam dados de crianças. A promessa de segurança exibida ao usuário precisa ser a praticada.

## Reproduction

- **Charter:** CH-primeiro-acesso-senha-provisoria · **Tour:** Autofill Tour
- **Environment:** dev local; verificação técnica via API pública (fora de persona, registrada como tal)

1. Na tela `/trocar-senha`, digitar `123456` → a checklist trava o envio ("Uma letra e um número" não atendida)
2. Enviar o mesmo `{"newPassword":"123456"}` direto ao endpoint público com sessão válida

**Expected:** o servidor recusa o que a tela recusa (mesma política nos dois lados).
**Actual:** HTTP 200 `{"status":"ok"}` — senha trocada para `123456` (conta descartável de verificação).

Validação do servidor: `backend/internal/server/auth_handlers.go` (`len(req.NewPassword) < 6` apenas). Regras da tela: `frontend/src/components/auth/password-rules.ts`.

## Evidence

- Transcrição da verificação: login conta descartável → change-password `123456` → `HTTP 200 {"status":"ok"}` (sessão desta rodada)
- ../evidence/2026-07-24-ciclo-full/S2-checklist-123456.png (a tela recusando a mesma senha)

## Fix

- **Root cause:**
- **Fix commit:**
- **Regression test:**

## Verification
