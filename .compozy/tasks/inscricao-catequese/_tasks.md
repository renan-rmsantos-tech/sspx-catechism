# Tasks: Inscrição Catequese

## Task List

| # | Título | Status | Complexidade | Dependências |
|---|--------|--------|-------------|-------------|
| 01 | Migration: tabela enrollments + alterações em academic_years e students | completed | medium | — |
| 02 | Zod schemas e helpers para enrollments | completed | low | 01 |
| 03 | Formulário público de inscrição (`/inscricao`) | completed | high | 01, 02 |
| 04 | Painel admin — lista de inscrições (`/admin/inscricoes`) | completed | medium | 01, 02 |
| 05 | Painel admin — detalhe e ações aprovar/rejeitar (`/admin/inscricoes/[id]`) | completed | high | 04 |
| 06 | Configuração do período de inscrição no ano letivo | completed | medium | 01 |
| 07 | Integração: campo guardian_email em students + sidebar admin | pending | low | 01, 05 |

## Dependency Graph

```
01 ─┬─► 02 ─┬─► 03
    │        └─► 04 ──► 05 ──► 07
    └─► 06
    └──────────────────► 07
```

## References

- PRD: `_prd.md`
- TechSpec: `_techspec.md`
- ADRs: `adrs/adr-001.md` through `adrs/adr-004.md`
