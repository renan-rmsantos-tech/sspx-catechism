---
title: Relatórios PDF e Excel
status: completed
type: frontend
complexity: medium
dependencies:
  - task_05
  - task_07
---

# Task 9: Relatórios PDF e Excel

## Overview
Implementa a geração server-side de relatórios de presença em PDF (jsPDF) e Excel (xlsx) com filtros por turma e período. Inclui a página de relatórios no painel do coordenador e o endpoint `GET /api/reports/attendance` com parâmetros `classId`, `from`, `to` e `format`.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implementar `GET /api/reports/attendance?classId=&from=&to=&format=pdf|xlsx`
- MUST gerar PDF com jsPDF contendo: lista de alunos, presenças/faltas por data, total e percentual por aluno
- MUST gerar Excel com xlsx com a mesma estrutura do PDF
- MUST validar os parâmetros `classId` (UUID válido), `from`/`to` (datas válidas, `from <= to`), `format` (`pdf` ou `xlsx`)
- MUST garantir que somente coordenador acessa o endpoint (401 para catequista)
- O PDF e Excel DEVEM ser compatíveis com Adobe Acrobat Reader e Microsoft Excel (requisito do PRD)
- A geração deve completar em menos de 5 segundos para períodos de até 1 ano com 150 alunos
- MUST implementar página `/admin/relatorios` com seleção de turma, período e botão de download
</requirements>

## Subtasks
- [x] 9.1 Instalar `jspdf`, `jspdf-autotable` e `xlsx` como dependências
- [x] 9.2 Implementar query de dados para o relatório: junção de `students`, `attendance_sessions` e `attendance_records` com cálculo de totais e percentuais
- [x] 9.3 Implementar gerador de PDF (`lib/reports/pdf.ts`) com tabela de alunos × datas
- [x] 9.4 Implementar gerador de Excel (`lib/reports/excel.ts`) com a mesma estrutura
- [x] 9.5 Implementar Route Handler `GET /api/reports/attendance` com validação Zod e headers de download
- [x] 9.6 Criar página `/admin/relatorios` com formulário de filtros (turma, período) e botão de download

## Implementation Details
Consultar TechSpec → **API Endpoints** para o contrato do endpoint de relatório.

Estrutura do relatório (PDF e Excel):
- Cabeçalho: nome da turma, período, data de geração
- Tabela: coluna "Aluno" + uma coluna por data de chamada no período
- Células: "P" (presente), "F" (falta), "-" (sem chamada nessa data)
- Rodapé por aluno: total de presenças, total de faltas, percentual de presença

O endpoint deve retornar o arquivo diretamente com os headers corretos:
- PDF: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="relatorio-turma-PERIODO.pdf"`
- Excel: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### Relevant Files
- `app/api/reports/attendance/route.ts` — Route Handler de relatórios
- `app/admin/relatorios/page.tsx` — página de relatórios do coordenador
- `lib/reports/pdf.ts` — gerador de PDF com jsPDF
- `lib/reports/excel.ts` — gerador de Excel com xlsx
- `lib/reports/query.ts` — query de dados do relatório

### Dependent Files
- `supabase/migrations/0001_initial_schema.sql` (task_02) — tabelas `attendance_sessions`, `attendance_records`, `students`
- `app/admin/layout.tsx` (task_04) — layout com sidebar

### Related ADRs
- [ADR-001: Escopo do Produto — MVP Focado](adrs/adr-001.md) — Relatórios PDF/Excel fazem parte do MVP

## Deliverables
- Route Handler `GET /api/reports/attendance` com suporte a PDF e Excel
- Geradores `lib/reports/pdf.ts` e `lib/reports/excel.ts`
- Página `/admin/relatorios` com filtros e botão de download
- Unit tests com 80%+ coverage **(REQUIRED)**
- Integration tests para geração de arquivo e controle de acesso **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Cálculo de percentual de presença: 3 presenças em 5 chamadas = 60%
  - [x] Cálculo de percentual: 0 chamadas no período = exibir "-" (sem divisão por zero)
  - [x] Validação Zod: `format` com valor diferente de `pdf` ou `xlsx` retorna erro
  - [x] Validação Zod: `from > to` retorna erro descritivo
  - [x] PDF gerado contém pelo menos o nome da turma no conteúdo
  - [x] Excel gerado tem ao menos uma planilha com dados
- Integration tests:
  - [x] `GET /api/reports/attendance` para catequista retorna 403
  - [x] `GET /api/reports/attendance?format=pdf` retorna arquivo com `Content-Type: application/pdf`
  - [x] `GET /api/reports/attendance?format=xlsx` retorna arquivo Excel válido (parseable com xlsx)
  - [ ] Arquivo PDF gerado abre sem erros no Acrobat Reader (manual — PDF magic bytes verified)
  - [ ] Arquivo Excel gerado abre sem erros no Microsoft Excel (manual — XLSX.read parses cleanly)
  - [x] Relatório com 150 alunos e 12 meses gera em menos de 5 segundos
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- PDF e Excel abrem corretamente em Acrobat Reader e Microsoft Excel
- Dados do relatório batem com os registros no banco
- Geração em menos de 5 segundos para o volume máximo (150 alunos, 1 ano)
- Coordenador consegue gerar relatório sem ajuda técnica (UX clara)
