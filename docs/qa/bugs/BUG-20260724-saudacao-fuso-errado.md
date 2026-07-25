# BUG-20260724-saudacao-fuso-errado: Dashboard diz "Bom dia" à noite — saudação calculada no fuso errado

- **Status:** verified
- **Impact (user-side):** Trust-Damage
- **Severity:** Medium · **Priority:** P2
- **Persona Affected:** Camila
- **Journey Step:** J-fazer-chamada-offline, step 1 (dashboard da catequista)
- **Scenarios:** CHM-chamada-feliz-online
- **Found:** 2026-07-24 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

Às **23:27 (horário de Brasília)** o dashboard cumprimenta "**Bom dia, Camila**". A saudação aparenta usar UTC (23:27−03 = 02:27 UTC → "bom dia"), não o horário do aparelho. É a primeira frase que a catequista lê toda vez que abre o app — errar a hora do dia mina a confiança no resto ("se erra até o bom-dia, será que a chamada foi mesmo?"). Classificado Trust-Damage (nada quebra, a confiança sim); severidade média por ser onipresente no dia a dia.

## Reproduction

- **Charter:** CH-primeiro-acesso-senha-provisoria · **Tour:** Autofill Tour
- **Environment:** phone-large 390×844 / pt-BR / fuso -03

1. Entrar no `/dashboard` como catequista à noite (após ~21h no fuso -03)
2. Ler a saudação do topo

**Expected:** "Boa noite, Camila"
**Actual:** "Bom dia, Camila" (23:27 local)

## Evidence

- ../evidence/2026-07-24-ciclo-full/S2-dashboard-camila-vazio.png (saudação + data no topo; hora local 23:27 registrada no log da sessão)

## Fix

- **Root cause:** diagnóstico inicial (UTC) estava errado — a saudação era **"Bom dia" hardcoded** no JSX; nunca mudou com a hora.
- **Fix commit:** f6b4c5d — `greetingForHour(hora local)`.
- **Regression test:** dates.test.ts "cumprimenta conforme a hora local" (vermelho antes).

## Verification

- **Retested:** 2026-07-24 23:5x, Tereza — "Boa noite, Tereza". · **Report:** ../reports/2026-07-24-ciclo-full.md
- **Result:** confirmado
