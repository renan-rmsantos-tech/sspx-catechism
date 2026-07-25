# BUG-20260724-chamada-data-utc-errada: À noite, a chamada abre e grava no dia seguinte — "hoje" é calculado em UTC

- **Status:** verified
- **Impact (user-side):** Data-Loss
- **Severity:** High · **Priority:** P0
- **Persona Affected:** Tereza
- **Journey Step:** J-fazer-chamada-offline, step 2-3 (folha de chamada)
- **Scenarios:** CHM-chamada-feliz-online; CHM-dia-sem-aula
- **Found:** 2026-07-24 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

Às 23:4x de sexta-feira 24/07 (fuso -03), a folha de chamada abre como "**SÁBADO, 25 DE JULHO**" e grava a sessão nessa data — o "hoje" do app é o dia UTC, não o do aparelho. Toda chamada feita (ou revisada) depois das 21h locais cai **no dia errado**, sem qualquer aviso; o registro fica corrompido silenciosamente. O dashboard, na mesma hora, mostra "SEXTA-FEIRA, 24 DE JULHO" no topo — duas telas adjacentes discordam sobre que dia é hoje. Mesma raiz do [[BUG-20260724-saudacao-fuso-errado]] ("Bom dia" às 23h), mas aqui atinge o dado central do produto.

## Reproduction

- **Charter:** CH-chamada-offline-rede-instavel · **Tour:** Network Tour
- **Environment:** phone-large 390×844 / pt-BR / fuso -03, 23:40 local

1. Após ~21h locais (quando já virou o dia em UTC), abrir o dashboard → header mostra a data local (sexta 24)
2. Iniciar a chamada de uma turma → a folha mostra e grava **sábado 25**
3. Confirmar → a sessão é criada com date=2026-07-25

**Expected:** a chamada de hoje é a do dia local do aparelho, consistente em todas as telas.
**Actual:** folha e gravação usam o dia UTC; dashboard usa o dia local; à noite os dois divergem.

## Evidence

- ../evidence/2026-07-24-ciclo-full/S3-chamada-data-utc.png (folha "SÁBADO, 25" às 23:4x de sexta)
- ../evidence/2026-07-24-ciclo-full/S3-dashboard-tereza.png (dashboard "SEXTA-FEIRA, 24" no mesmo momento)

## Fix

- **Root cause:** `today()` usava `new Date().toISOString().slice(0,10)` (dia UTC) em três telas; o cabeçalho do dashboard formatava a data local — divergência a partir das 21h no fuso -03 e chamada gravada no dia seguinte.
- **Fix commit:** f6b4c5d — helper `localToday()` (dia local) substitui os três usos.
- **Regression test:** dates.test.ts "usa o dia local do aparelho, nunca o dia UTC" (vermelho antes em fuso ≠ UTC; vacuo em CI UTC, documentado no teste).

## Verification

- **Retested:** 2026-07-25 (00h, fuso -03), Tereza — folha e dashboard concordam na data local; nova chamada gravada no dia local correto. · **Report:** ../reports/2026-07-24-ciclo-full.md
- **Result:** confirmado (sessões pré-fix permanecem gravadas em 25/07 — nota no relatório)
