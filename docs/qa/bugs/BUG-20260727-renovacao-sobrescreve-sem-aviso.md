# BUG-20260727-renovacao-sobrescreve-sem-aviso: Aprovar como renovação apaga o cadastro do aluno escolhido, sem avisar

- **Status:** verified
- **Impact (user-side):** Data-Loss
- **Severity:** High · **Priority:** P1
- **Persona Affected:** Anselmo
- **Journey Step:** J-aprovar-inscricao, step 3 (aprovar como renovação)
- **Scenarios:** INS-aprovar-renovacao-transfere
- **Found:** 2026-07-27 · **Report:** ../reports/2026-07-27-fixes-decisoes.md

## Summary

Com a busca por nome (fix de [[BUG-20260725-renovacao-exige-uuid]]), a renovação finalmente é usável — e revela que a operação é destrutiva sem dizer isso em lugar nenhum. Ao aprovar a inscrição de **Lucas Andrade** vinculando ao aluno **Carla Oliveira**, o cadastro da Carla foi **substituído**: mesmo registro (uuid `f4d31ba3…`), agora chamado "Lucas Andrade" e movido de Crisma para Primeira Comunhão. A Carla deixou de existir na busca de alunos, e as presenças que ela tinha na Crisma continuam ligadas ao registro — agora sob o nome de outra criança.

Essa é a semântica pretendida da renovação (a mesma criança volta e os dados são atualizados), mas a tela não diz isso: o coordenador escolhe um nome numa lista de resultados e um clique em "Aprovar" apaga o cadastro escolhido. Numa fila de matrícula com nomes parecidos, escolher a linha errada destrói o histórico de uma criança em silêncio.

## Reproduction

- **Charter:** CH-revisao-inscricoes-duas-abas · **Tour:** Multi-Tab
- **Environment:** desktop 1280×800 / pt-BR (dev local)

1. `/admin/inscricoes` → abrir uma inscrição pendente (ex.: "Lucas Andrade")
2. Em "Aluno já cadastrado", buscar e escolher **outro** aluno (ex.: "Carla Oliveira", turma Crisma)
3. Escolher a turma e clicar **Aprovar**

**Expected:** antes de gravar, a tela diz exatamente o que vai acontecer ("o cadastro de Carla Oliveira será substituído pelos dados desta inscrição e movido para Primeira Comunhão") e pede confirmação.
**Actual:** aprova em silêncio; "Carla Oliveira" desaparece da busca de alunos; o histórico dela fica sob outro nome.

## Evidence

- ../evidence/2026-07-27-fixes-decisoes/S4-busca-aluno.png (a escolha)
- Leitura independente após aprovar: `GET /api/students?q=Carla` → 0 registros; o uuid `f4d31ba3…` agora responde "Lucas Andrade | Primeira Comunhão"

## Fix

- **Root cause:** ver Summary.
- **Fix commit:** 740887f — aprovação com aluno vinculado passa por um diálogo que nomeia o cadastro a ser substituído, os dados que entram no lugar e a turma de destino; sem vínculo, a aprovação segue direta.
- **Regression test:** testes novos em `admin-page.test.tsx`, `auth-context.test.tsx` e `dashboard-page.test.tsx` (vermelhos contra o código anterior).

## Verification

- **Retested:** 2026-07-27, sessão nova em persona. · **Report:** ../reports/2026-07-27-fixes-decisoes.md
- **Result:** Cancelar não dispara a aprovação (0 POST) e a leitura independente mostra o aluno intacto na turma antiga; confirmar produz exatamente o que o diálogo disse (Bruno Santos movido para Crisma, um único cadastro) e a mensagem final explicita que foi renovação.
