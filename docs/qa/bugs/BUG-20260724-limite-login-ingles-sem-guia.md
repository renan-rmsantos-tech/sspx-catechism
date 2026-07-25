# BUG-20260724-limite-login-ingles-sem-guia: Após errar a senha demais, a tela diz "Too Many Requests" em inglês, sem orientação

- **Status:** verified
- **Impact (user-side):** Friction
- **Severity:** Medium · **Priority:** P1
- **Persona Affected:** Camila
- **Journey Step:** J-primeiro-acesso-catequista, step 2 (login)
- **Scenarios:** AUTH-limite-tentativas-login
- **Found:** 2026-07-24 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

Uma catequista digitando errado a senha provisória (comprida, colada do WhatsApp) esbarra no limite de 10 tentativas por minuto e recebe **"Too Many Requests"** — status HTTP cru, em inglês, numa interface toda em português, sem dizer o que fazer ("aguarde um minuto e tente de novo"). Ela não distingue isso de um sistema quebrado; a reação realista é desistir e chamar a coordenação. Priority P1 porque a fricção mora na jornada P0 de acesso.

## Reproduction

- **Charter:** CH-primeiro-acesso-senha-provisoria · **Tour:** Autofill Tour
- **Environment:** phone-large 390×844 / wifi / pt-BR (dev local)

1. Em `/login`, errar a senha 10 vezes no mesmo minuto
2. Tentar a 11ª vez

**Expected:** aviso em português com o próximo passo — "Muitas tentativas. Aguarde um minuto e tente novamente."
**Actual:** "Too Many Requests" (texto do status 429 exibido verbatim).

## Evidence

- ../evidence/2026-07-24-ciclo-full/S2-rate-limit-429.png
- Rede: 10× `POST /api/auth/login → 401`, depois `→ 429`

## Fix

- **Root cause:** a tela de login exibia `err.message` cru; para 429 o corpo é o texto HTTP "Too Many Requests".
- **Fix commit:** f6b4c5d — `friendlyLoginError` mapeia 429 para mensagem em português com orientação.
- **Regression test:** login-page.test.tsx (vermelho antes).

## Verification

- **Retested:** 2026-07-25, Camila — 11 tentativas erradas → "Muitas tentativas. Aguarde um minuto e tente novamente." (S2R-429-traduzido.png). · **Report:** ../reports/2026-07-24-ciclo-full.md
- **Result:** confirmado
