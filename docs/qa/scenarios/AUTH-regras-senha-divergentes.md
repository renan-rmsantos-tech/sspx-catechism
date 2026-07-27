---
id: AUTH-regras-senha-divergentes
area: AUTH
title: Receber a mesma regra de senha na tela e no servidor
persona: Camila
journey: J-primeiro-acesso-catequista
expected: As regras exibidas na checklist coincidem com as que o servidor aceita — nenhuma senha passa num e é recusada no outro, em nenhuma direção
entry_points: /trocar-senha
qa_status: pass
bug_ids: BUG-20260724-regras-senha-divergentes
fix_status: fixed
retest_status: pass
fix_commits: 978d0c1
evidence: ../evidence/2026-07-24-ciclo-full/S2-checklist-123456.png
last_report: ../reports/2026-07-27-fixes-decisoes.md
overlaps:
---

DEFEITO SUSPEITO (inspeção de código, a confirmar): o front exige ≥6 caracteres + uma letra + um número (frontend/src/components/auth/password-rules.ts:3-7); o backend exige apenas ≥6 (backend/internal/server/auth_handlers.go:96). Uma senha "123456" seria recusada pela tela mas aceita pela API — e qualquer cliente fora da SPA cria senha fraca. Candidato a Trust-Damage.
