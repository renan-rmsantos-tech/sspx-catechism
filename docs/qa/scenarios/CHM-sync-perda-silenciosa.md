---
id: CHM-sync-perda-silenciosa
area: CHM
title: Ser avisada quando uma chamada enviada não foi aceita
persona: Tereza
journey: J-fazer-chamada-offline
expected: Se o servidor descartar a sessão (skipped — data fora do calendário ou turma desvinculada), a catequista é avisada e a chamada não desaparece em silêncio
entry_points: /dashboard
qa_status: pass
bug_ids: BUG-20260724-refazer-chamada-descartada-em-silencio
fix_status: fixed
retest_status: pass
fix_commits: e62e6c9; f6b4c5d
evidence:
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

DEFEITO SUSPEITO (inspeção de código no planejamento, a confirmar em sessão): o POST /api/attendance responde {synced, skipped} e o front limpa a fila local mesmo quando synced=0 (frontend/src/lib/attendance-sync.ts:38-40). Cenário concreto: chamada feita offline numa data que depois saiu do calendário, ou turma da qual a catequista foi desvinculada — a sessão é descartada sem nenhum aviso. Candidato a Data-Loss.
