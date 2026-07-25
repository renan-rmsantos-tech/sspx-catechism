# BUG-20260724-remover-ano-sem-confirmacao: Remover ano letivo apaga na hora, sem confirmação, sem feedback e com tabela desatualizada

- **Status:** open
- **Impact (user-side):** Trust-Damage
- **Severity:** High · **Priority:** P1
- **Persona Affected:** Anselmo
- **Journey Step:** J-preparar-ano-letivo, step 1 (gestão de anos letivos)
- **Scenarios:** ADM-remocao-bloqueada-protegidos; ADM-criar-ano-dias-aula
- **Found:** 2026-07-24 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

O ícone de lixeira na linha do ano letivo **apaga o ano imediatamente** — nenhum "tem certeza?", nenhum aviso do que será perdido. Pior: a exclusão não dá **nenhum feedback** e a **tabela continua mostrando o ano excluído** até um reload manual. O coordenador, sem ver reação, clica de novo — e recebe "ano letivo não encontrado", sem entender que o primeiro clique já tinha apagado. Um misclick na lixeira destrói a configuração do ano (dias de aula, janela de inscrição) sem cerimônia; só o reload da página revela a verdade.

## Reproduction

- **Charter:** CH-preparar-ano-colando-datas · **Tour:** Paste Tour
- **Environment:** desktop 1280×800 / wifi / pt-BR (dev local)

1. Entrar como coordenador em `/admin/anos` com um ano letivo sem dependências criado
2. Clicar no ícone de lixeira ("Remover ano") da linha
3. Observar: nenhuma confirmação é pedida; nenhuma mensagem aparece; a linha **continua na tabela**
4. Clicar na lixeira de novo → "ano letivo não encontrado" (o DELETE anterior já tinha apagado)
5. Recarregar a página → "Nenhum registro encontrado."

**Expected:** confirmação antes de destruir ("Remover o ano 2026? Isso apaga dias de aula e janela de inscrição."), feedback de sucesso e tabela atualizada na hora.
**Actual:** hard delete instantâneo e mudo; tabela stale; segundo clique produz erro confuso.

Nota de escopo: com dependências (turmas/inscrições) o backend bloqueia com 409 — o raio de destruição é limitado a anos "novos"; a ausência de confirmação continua perigosa.

## Evidence

- ../evidence/2026-07-24-ciclo-full/S1-tabela-pos-delete.png (tabela vazia só após reload)
- Rede: 1º clique `DELETE /api/academic-years/{id}` (sucesso silencioso); 2º clique → 404
- Status na tela após o 2º clique: "ano letivo não encontrado"

## Fix

- **Root cause:**
- **Fix commit:**
- **Regression test:**

## Verification
