# BUG-20260724-editar-ano-sempre-falha: Coordenador não consegue editar nenhum ano letivo — todo salvar falha com erro técnico

- **Status:** verified
- **Impact (user-side):** Blocks-Completion
- **Severity:** Critical · **Priority:** P0
- **Persona Affected:** Anselmo
- **Journey Step:** J-preparar-ano-letivo, step 1 (criar/ajustar o ano letivo)
- **Scenarios:** ADM-criar-ano-dias-aula; ADM-dois-anos-ativos; INS-janela-fechada
- **Found:** 2026-07-24 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

O coordenador clica em Editar num ano letivo, muda qualquer coisa (ou nada) e clica "Salvar ano" — e recebe sempre `JSON inválido: json: unknown field "year"`. Nenhuma edição de ano letivo funciona pela UI: não dá para abrir/fechar a janela de inscrições de um ano existente (ritual anual), mudar dias de aula nem ativar/desativar o ano. O único caminho que sobra é destrutivo: remover e recriar o ano — impossível quando o ano já tem turmas/inscrições (409). De quebra, o erro exibido é jargão técnico de Go vazado cru na interface.

## Reproduction

- **Charter:** CH-preparar-ano-colando-datas · **Tour:** Paste Tour
- **Environment:** desktop 1280×800 / wifi / pt-BR (dev local, Vite + Go)

1. Entrar como coordenador em `/admin/anos`
2. Criar um ano letivo qualquer (ex.: 2026, ativo, Sexta+Sábado)
3. Clicar **Editar** na linha do ano — mudar qualquer campo ou nenhum
4. Clicar **Salvar ano**

**Expected:** alterações salvas (ex.: janela de inscrições definida) e refletidas na tabela.
**Actual:** status mostra `JSON inválido: json: unknown field "year"`; PATCH `/api/academic-years/{id}` responde 400; nada é salvo.

Causa aparente (para triagem): o formulário de edição envia o campo `year` no corpo do PATCH; o backend decodifica com `DisallowUnknownFields` e o DTO de update não aceita `year` — qualquer payload da UI é rejeitado. O teste de integração passa porque envia só `classDays`/janela, sem `year`.

## Evidence

- ../evidence/2026-07-24-ciclo-full/S1-patch-400.png (erro na tela + campos válidos)
- Rede: `PATCH /api/academic-years/e8b60275-… → 400` com edição sem nenhuma mudança (repro mínima)
- Caminho de leitura independente: tabela de anos segue mostrando "- até -" após o salvar

## Fix

- **Root cause:** o formulário de edição envia o estado inteiro (incl. `year`) no PATCH; o backend decodifica com `DisallowUnknownFields` e o DTO de update só aceita `isActive`/`classDays`/`enrollmentStartsAt`/`enrollmentEndsAt` — todo payload da UI era rejeitado. Sintoma (400 na tela) ≠ causa (contrato de payload divergente).
- **Fix commit:** dd2b09a — o onSubmit remove `year` do payload de update.
- **Regression test:** frontend/src/pages/admin/admin-page.test.tsx — "edits academic years without sending immutable fields" (vermelho antes, verde depois).

## Verification

- **Retested:** 2026-07-25, Anselmo, sessão nova — Editar → Salvar ano → PATCH 200, "Ano letivo atualizado.", janela preservada; edição de janela usada ao vivo nos probes de inscrição. · **Report:** ../reports/2026-07-24-ciclo-full.md
- **Result:** confirmado

