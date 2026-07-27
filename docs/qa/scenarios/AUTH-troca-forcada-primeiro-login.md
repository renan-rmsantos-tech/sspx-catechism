---
id: AUTH-troca-forcada-primeiro-login
area: AUTH
title: Trocar a senha obrigatória no primeiro acesso
persona: Camila
journey: J-primeiro-acesso-catequista
expected: O primeiro login redireciona à força para /trocar-senha (nenhuma outra rota abre), a checklist das 3 regras reage ao vivo, o botão desabilitado diz "Faltam N" e após a troca ela cai no /dashboard só com as suas turmas
entry_points: /login
qa_status: pass
bug_ids:
fix_status:
retest_status: pass
fix_commits:
evidence: ../evidence/2026-07-24-ciclo-full/S2-checklist-123456.png
last_report: ../reports/2026-07-27-fixes-decisoes.md
overlaps:
---

Guard bloqueia toda rota enquanto must_change_password=true (frontend/src/lib/auth-routing.ts:42-44). Tentar navegar direto para /dashboard e /admin antes de trocar. Após trocar: token reemitido, novo login não força mais a troca.
