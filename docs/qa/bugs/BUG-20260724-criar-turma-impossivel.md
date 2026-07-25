# BUG-20260724-criar-turma-impossivel: Coordenador não consegue criar nenhuma turma — todo envio falha com erro técnico

- **Status:** verified
- **Impact (user-side):** Blocks-Completion
- **Severity:** Critical · **Priority:** P0
- **Persona Affected:** Anselmo
- **Journey Step:** J-preparar-ano-letivo, step 3 (criar turma e vincular catequistas)
- **Scenarios:** ADM-criar-turma-vincular-catequista
- **Found:** 2026-07-24 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

O coordenador preenche a turma (nome, ano, nível, horário, catequistas) e clica "Criar turma" — e recebe sempre `JSON inválido: json: unknown field "isArchived"`. **Nenhuma turma pode ser criada pela interface**, com qualquer combinação de campos. Sem turma não existe chamada, aluno em turma nem relatório: o produto inteiro fica bloqueado a jusante. O erro exibido é jargão técnico vazado (mesma família de [[BUG-20260724-editar-ano-sempre-falha]]: o formulário envia um campo que o backend, com `DisallowUnknownFields`, rejeita — aqui o `isArchived` que o form de criação inclui por padrão).

## Reproduction

- **Charter:** CH-preparar-ano-colando-datas · **Tour:** Paste Tour
- **Environment:** desktop 1280×800 / wifi / pt-BR (dev local)

1. Entrar como coordenador em `/admin/turmas` (com um ano letivo criado)
2. Preencher só o nome e o ano (ou todos os campos — indiferente)
3. Clicar **Criar turma**

**Expected:** turma criada, listada na tabela, visível no dashboard das catequistas vinculadas.
**Actual:** status mostra `JSON inválido: json: unknown field "isArchived"`; POST `/api/classes` → 400; nada é criado.

## Evidence

- ../evidence/2026-07-24-ciclo-full/S1-criar-turma-400.png
- Rede: `POST /api/classes → 400` com payload mínimo e com payload completo

## Fix

- **Root cause:**
- **Fix commit:**
- **Regression test:**

## Verification

- **Retested:** 2026-07-25, Anselmo — 3 turmas criadas (201) e edição sem mudança (PATCH 200); turmas visíveis no dashboard das catequistas (S3/S4). · **Report:** ../reports/2026-07-24-ciclo-full.md
- **Result:** confirmado
