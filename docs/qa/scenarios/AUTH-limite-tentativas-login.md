---
id: AUTH-limite-tentativas-login
area: AUTH
title: Errar a senha muitas vezes seguidas
persona: Camila
journey: J-primeiro-acesso-catequista
expected: Após 10 tentativas no minuto, aviso claro de aguardar e tentar de novo — e quem digita a senha certa depois do intervalo entra normalmente
entry_points: /login
qa_status: pass
bug_ids: BUG-20260724-limite-login-ingles-sem-guia
fix_status: fixed
retest_status: pass
fix_commits: f6b4c5d
evidence: ../evidence/2026-07-24-ciclo-full/S2-rate-limit-429.png; ../evidence/2026-07-24-ciclo-full/S2R-429-traduzido.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Rate limit de 10/min por IP → 429 com Retry-After (backend/internal/server/server.go:31-34; feature recente, commit 2b4ab2c). Plausível para quem digita senha provisória complicada no celular. A tela distingue 429 de 401? O aviso diz quanto esperar?
