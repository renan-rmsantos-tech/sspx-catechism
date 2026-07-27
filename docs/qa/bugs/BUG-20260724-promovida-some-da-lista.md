# BUG-20260724-promovida-some-da-lista: Promover catequista a coordenador a faz sumir de todas as telas, sem aviso e sem volta

- **Status:** verified
- **Impact (user-side):** Trust-Damage
- **Severity:** High · **Priority:** P1
- **Persona Affected:** Anselmo
- **Journey Step:** J-preparar-ano-letivo, step 3 (pessoas e vínculos)
- **Scenarios:** ADM-promovido-some-da-lista; ADM-criar-turma-vincular-catequista
- **Found:** 2026-07-24 · **Report:** ../reports/2026-07-24-ciclo-full.md

## Summary

O coordenador muda o papel de uma catequista para "Coordenador" no select da tabela — a mudança dispara **na hora, sem confirmação** — e a pessoa **desaparece de todas as telas de gestão**: some da tabela de catequistas e das checkboxes de vínculo de turma. Não existe nenhuma tela que liste coordenadores, então não há como **ver** que ela virou coordenadora nem como **rebaixá-la de volta** pela interface — a promoção é um beco sem saída. Para o coordenador, a impressão é de que a pessoa foi excluída do sistema. O único vestígio da existência de Fátima na tela era o banner de senha inicial da criação dela.

## Reproduction

- **Charter:** CH-preparar-ano-colando-datas · **Tour:** Paste Tour
- **Environment:** desktop 1280×800 / wifi / pt-BR (dev local)

1. Em `/admin/catequistas`, criar a catequista "Fátima Souza"
2. Na linha dela, mudar o select de papel para "Coordenador"
3. Observar: a linha some imediatamente da tabela (sem confirmação, sem mensagem)
4. Recarregar a página → Fátima não aparece em lugar nenhum
5. Ir a `/admin/turmas` → as checkboxes de catequistas não a listam mais

**Expected:** ou a lista mostra todos os perfis com papel visível (e permite rebaixar), ou a promoção pede confirmação explicando que a pessoa sai da lista de catequistas.
**Actual:** sumiço silencioso e irreversível pela UI (a API `GET /api/catechists` só devolve `role='catechist'`).

## Evidence

- ../evidence/2026-07-24-ciclo-full/S1-fatima-promovida.png (tabela sem Fátima logo após a promoção; banner com a senha dela ainda no topo)
- Fresh load: 0 ocorrências de "Fátima" na tabela; checkboxes de turma sem ela

## Fix

- **Root cause:** ver Summary; decisão de 2026-07-27 registrada abaixo.
- **Fix commit:** 978d0c1 + 99b06c3 — `GET /api/catechists` devolve todos os perfis; a tela vira "Catequistas e coordenadores" com papel editável, admin como conta protegida, e os vínculos de turma passam a listar coordenadores.
- **Regression test:** suíte do frontend/backend desta rodada (76 vitest + 185 go), com os testes novos vermelhos contra o código anterior.

## Verification

- **Retested:** 2026-07-27, sessões novas em persona. · **Report:** ../reports/2026-07-27-fixes-decisoes.md
- **Result:** Fátima (promovida no ciclo anterior) reapareceu, foi rebaixada a catequista e promovida de novo pela UI; vinculada à turma Crisma, o vínculo persistiu em fresh load. Admin aparece sem select e sem remover.
## Decisão

Decisão (2026-07-27, Renan): opção 1 — a tela de pessoas lista todos os perfis com papel visível e permite rebaixar coordenador; admin aparece sem ações.
