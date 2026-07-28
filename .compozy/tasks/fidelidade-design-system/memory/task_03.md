# Task Memory: task_03.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Implementar os primitivos que preparam a migração do admin: declaração tabular, busca e nomes de variante.

## Important Decisions

- `Table` aceita `numericColumns` opcional e injeta as classes tabulares nas células `th` e `td`; `DataTable` repassa a declaração e todas as seis chamadas a explicitam.
- As colunas comparáveis declaradas são Ano (anos letivos), Ano (turmas) e Presenças (relatórios); as demais tabelas declaram uma lista vazia.
- `SearchField` reutiliza o controle compartilhado, com ícone `Search` absoluto dentro de um contêiner relativo e nome acessível opcional por `label`.

## Learnings

- A cobertura global do repositório não é um gate efetivo (confirmando a lacuna da TechSpec); a cobertura limitada às superfícies desta task ficou em 86,82% de statements.
- O formulário de relatórios requer aguardar a opção de turma e usar `userEvent.selectOptions` antes da pré-visualização para evitar corrida do React Hook Form.

## Files / Surfaces

- Alterados: `frontend/src/components/ui/{table,field,button,confirm-dialog}.tsx`, contrato de âncoras e página/testes do admin.
- Verificação fresca: `npm test` (96 testes), `npm run build`, varredura de aliases e cobertura limitada às superfícies alteradas.

## Errors / Corrections

- O tracking mestre fornecido (`.compozy/tasks/fidelidade-design-system/_tasks.md`) não existe. Não marcar a task como concluída nem criar commit automático até o arquivo ser disponibilizado ou a instrução de tracking for corrigida.

## Ready for Next Run
