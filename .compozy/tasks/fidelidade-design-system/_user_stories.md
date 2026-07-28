# User Stories — Fidelidade ao design system

> Origem: [`_prd.md`](_prd.md) §User Stories · Decomposição: [`_tasks.md`](_tasks.md)

Rastreamento das histórias do PRD contra as tarefas que as entregaram. Uma história só é marcada quando existe evidência verificável — teste, relatório de conferência ou estado observável em produção.

## Coordenação

- [x] **US-01** Como coordenadora, quero que os formulários do admin tenham a mesma aparência do resto do sistema, para não desconfiar que a tela está quebrada quando vou cadastrar uma turma.
  - Entregue por: `task_03`, `task_04` · Evidência: regra `classe-inexistente` em `block` e verde; `docs/qa/reports/2026-07-28-admin-design-system.md`
- [x] **US-02** Como coordenadora, quero ver o estado de cada inscrição em português e por cor, para não precisar traduzir `pending` de cabeça no meio da fila de revisão.
  - Entregue por: `task_04` · Evidência: `EnrollmentStatusChip` em `admin-page.tsx`; renovação como `<Chip tone="gold">`
- [x] **US-03** Como coordenadora, quero que os números das tabelas e relatórios se alinhem em coluna, para comparar frequência entre turmas com o olho.
  - Entregue por: `task_03`, `task_04` · Evidência: API `numericColumns` em `Table`; contrato em `anchor-components.test.tsx`
- [x] **US-04** Como coordenadora, quero saber se o sistema está online enquanto cadastro, porque estou gravando dados.
  - Entregue por: `task_04` · Evidência: `NetworkChip` no shell do admin

## Catequista

- [x] **US-05** Como catequista navegando por teclado, quero enxergar em que campo estou, para fazer a chamada sem depender do toque na tela.
  - Entregue por: `task_02` · Evidência: `docs/qa/reports/2026-07-27-foco-visivel.md`; regra `foco-apagado` em `block`
- [x] **US-06** Como catequista, quero que a linha marcada continue sendo uma linha com um tom de fundo, e não um bloco colorido, para bater o olho na lista inteira.
  - Entregue por: `task_05` · Evidência: lavagens de 5% e 4% em `attendance-row.tsx`; `docs/qa/reports/2026-07-28-fidelidade-primitivos-marca.md`

## Responsável

- [x] **US-07** Como responsável preenchendo a inscrição, quero ver em qual dos quatro passos estou de um jeito que sobreviva na tela do celular.
  - Entregue por: `task_05` · Evidência: `stepper.tsx` em trilhos; baseline `docs/visual-baseline/fase-4-primitivos/enrollment-mobile.png`

## Quem constrói

- [x] **US-08** Como quem vai mexer numa tela amanhã, quero que o `design/` descreva o produto de verdade, para não implementar contra um documento que mente.
  - Entregue por: `task_01` a `task_05` · Evidência: cinco regras em `block` e verdes
- [x] **US-09** Como quem abre um pull request, quero que o build me diga na hora que usei uma classe que não existe ou apaguei um foco.
  - Entregue por: `task_01` · Evidência: porta em `frontend/src/test/design-fidelity/`, executada em `npm test`, no `pre-push` e no `infra/Caddy.Dockerfile:13`
  - **Ressalva:** o `pre-push` é versionado mas exige instalação manual por máquina; sem ela, o retorno só vem no deploy

## Caso de borda

- [x] **US-10** Como pessoa que ativou "reduzir movimento", quero que o produto respeite a preferência em toda transição, inclusive nas superfícies novas do admin.
  - Evidência: `prefers-reduced-motion` em `frontend/src/styles.css`, herdado por todas as superfícies

## Não cobertas — fora de escopo por decisão do PRD

- Leitor de tela na folha de chamada — `BUG-20260725-chamada-sem-anuncios-leitor`, status `open`
- Conformidade WCAG AA completa além do que o `design/` especifica
