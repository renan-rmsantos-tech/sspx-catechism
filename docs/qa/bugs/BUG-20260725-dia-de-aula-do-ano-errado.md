# BUG-20260725-dia-de-aula-do-ano-errado: Turma de outro ano abre chamada em dia sem aula — e o servidor joga tudo fora

- **Status:** verified
- **Impact (user-side):** Trust-Damage
- **Severity:** High · **Priority:** P1
- **Persona Affected:** Joaquim
- **Journey Step:** J-fazer-chamada-offline, step 2 (abrir a folha)
- **Scenarios:** CHM-dia-sem-aula
- **Found:** 2026-07-25 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

A folha de chamada decidia "hoje tem aula?" pelo calendário do **ano ativo**, não do ano da turma. Uma turma de 2027 (sem nenhuma data) abria a folha normalmente num dia de aula de 2026; o catequista marcava todo mundo, confirmava — e o servidor descartava a sessão inteira (data fora do calendário daquela turma). Com o aviso de descarte (fix anterior) o trabalho perdido ao menos era anunciado; sem ele, sumia em silêncio.

## Reproduction

- **Charter:** CH-chamada-interrompida-zoom · **Tour:** Interrupt Tour
- **Environment:** phone-large 390×844, fonte 150% / pt-BR (dev local)

1. Turma vinculada num ano letivo **não ativo**, sem datas de aula, com aluno
2. Abrir a folha num dia de aula do ano ativo
3. Marcar e confirmar

**Expected:** "Hoje não há aula programada" (calendário do ano da turma).
**Actual (antes do fix):** folha aberta, chamada aceita na UI e descartada pelo servidor.

## Evidence

- ../evidence/2026-07-24-ciclo-full/S4-perseveranca-dia-sem-aula.png (folha aberta indevidamente)
- ../evidence/2026-07-24-ciclo-full/S4-perseveranca-descartada.png (descarte após confirmar)
- ../evidence/2026-07-24-ciclo-full/S4R-dia-sem-aula-correto.png (pós-fix)

## Fix

- **Root cause:** `loadAttendanceSheetData` reutilizava as datas do ano ativo para qualquer turma; o fallback offline consultava o cache do ano ativo também.
- **Fix commit:** 2ca939b — folha consulta o calendário do ano da própria turma (`scheduleYearId`); mensagem de descarte deixou de afirmar só "já registrada".
- **Regression test:** dashboard-page.test.tsx "usa o calendário do ano da turma…" (repro ao vivo antes do fix documentada acima).

## Verification

- **Retested:** 2026-07-25, Joaquim, mesma folha — "Hoje não há aula programada", sem botão de marcar. · **Report:** ../reports/2026-07-24-ciclo-full.md
- **Result:** confirmado
