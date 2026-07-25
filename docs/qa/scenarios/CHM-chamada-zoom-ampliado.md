---
id: CHM-chamada-zoom-ampliado
area: CHM
title: Fazer a chamada com zoom de 150%
persona: Joaquim
journey: J-fazer-chamada-offline
expected: Com fonte ampliada (zoom 150-200%), os alvos de toque seguem confortáveis (≥44px), nada essencial some atrás de barras fixas e a chamada completa sem rolagem impossível
entry_points: /dashboard/turmas/:id/chamada
qa_status: pass
bug_ids: BUG-20260725-chamada-sem-anuncios-leitor
fix_status: pending
retest_status:
fix_commits:
evidence: ../evidence/2026-07-24-ciclo-full/S4-dashboard-zoom150.png; ../evidence/2026-07-24-ciclo-full/S4-zoom-faltam-n.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Regra inegociável nº 5 do design system: 44px de alvo de toque em superfície de catequista. Atenção à barra de confirmação fixa e ao chip de rede: com zoom alto, cobrem a lista? Contadores em mono tabular (.num) continuam legíveis?
