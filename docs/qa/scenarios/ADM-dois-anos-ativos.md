---
id: ADM-dois-anos-ativos
area: ADM
title: Impedir (ou deixar claro) dois anos letivos ativos
persona: Anselmo
journey: J-preparar-ano-letivo
expected: O sistema impede dois anos ativos ao mesmo tempo — ou torna inequívoco qual ano rege a inscrição pública, o calendário e a fila de revisão
entry_points: /admin/anos
qa_status: pass
bug_ids: BUG-20260724-dois-anos-ativos-sem-aviso
fix_status: fixed
retest_status: pass
fix_commits: 978d0c1
evidence: ../evidence/2026-07-27-fixes-decisoes/S1-ano-ativo-unico.png
last_report: ../reports/2026-07-27-fixes-decisoes.md
overlaps:
---

DEFEITO SUSPEITO (inspeção de código, a confirmar): nada no backend impede dois anos com is_active=true; GetActiveEnrollmentYear resolve com LIMIT 1 sem ordenação declarada — a inscrição pública e a fila de revisão passam a depender de qual linha o banco devolve. Cenário realista na virada de ano (2026 ainda ativo, 2027 criado ativo). Candidato a Trust-Damage.
