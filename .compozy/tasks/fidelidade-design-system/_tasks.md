# Tasks — Fidelidade ao design system

> PRD: [`_prd.md`](_prd.md) · TechSpec: [`_techspec.md`](_techspec.md) · ADRs: [`adrs/`](adrs/)

Cinco tarefas, mapeando as quatro fases do PRD. A Task 1 entregou o relatório de divergências que serviu de backlog às demais — é a decisão do [ADR-001](adrs/adr-001.md).

**Iniciativa concluída em 2026-07-28.** As cinco regras da porta estão em `block` e verdes; o commit `8297e43` está em produção.

## Lista

| # | Arquivo | Título | Complexidade | Depende de | Status |
|---|---|---|---|---|---|
| 1 | [task_01.md](task_01.md) | A porta de fidelidade | high | — | completed |
| 2 | [task_02.md](task_02.md) | Foco visível em todo controle | medium | task_01 | completed |
| 3 | [task_03.md](task_03.md) | Primitivos habilitadores do admin | medium | task_01 | completed |
| 4 | [task_04.md](task_04.md) | Migração das sete views do admin | critical | task_02, task_03 | completed |
| 5 | [task_05.md](task_05.md) | Primitivos, marca e conferência visual | high | task_04 | completed |

## Cadeia de dependências

```
task_01 ──┬── task_02 ──┐
          │             ├── task_04 ── task_05
          └── task_03 ──┘
```

## Regras da porta

Todas em `block` e verdes. O nível de aplicação é um campo em `frontend/src/test/design-fidelity/rules.ts`; fechar a fase era virar o campo — ver [ADR-001](adrs/adr-001.md).

| Regra | Reprovava, na calibração | Virou `block` na |
|---|---|---|
| `cor-literal` | nada — já estava verde | task_01 |
| `foco-apagado` | 3 arquivos | task_02 |
| `classe-inexistente` | 31 ocorrências | task_04 |
| `controle-cru` | 39 controles | task_04 |
| `apelido-de-variante` | 17 usos | task_04 |

## Evidência

| O quê | Onde |
|---|---|
| Conferência do foco por teclado | `docs/qa/reports/2026-07-27-foco-visivel.md` |
| Checklist do `SKILL.md` nas 7 telas do admin | `docs/qa/reports/2026-07-28-admin-design-system.md` |
| Conferência de primitivos e marca | `docs/qa/reports/2026-07-28-fidelidade-primitivos-marca.md` |
| Baseline visual da fase | `docs/visual-baseline/fase-4-primitivos/` |
| Relatório de calibração da porta | `memory/task_01.md` — não virou relatório próprio em `docs/qa/`, ao contrário das outras fases |

## Precisões apuradas na execução

Corrigem números citados no PRD e no TechSpec; nenhuma contradiz o desenho.

- **São 31 controles com classe morta, não 28.** 28 com `className="input"` exato e 3 compostos.
- **`num-col` não é seletor de primeiro nível** em `design/assets/catequese-ds.css` — está aninhado como `.table .num-col`. A extração desce em seletores compostos, e há teste provando.
- **39 controles crus**, não os 36 estimados na decomposição.
- **13 dos 20 testes do admin** dependiam de `<label>` envolvente e foram migrados para associação por `id`.
- **Das 94 classes que só existem no `design/`, apenas `input` aparecia no código.**

## Fora de escopo

Registrado nos Non-Goals do PRD:

- O motivo de pontos `.dot-grid` — cortado por YAGNI
- Extrair as sete views do `admin-page.tsx` — os arquivos de entrada seguem como reexportações
- Filtros nas tabelas do admin — funcionalidade, não fidelidade
- Conformidade WCAG AA completa e o `BUG-20260725-chamada-sem-anuncios-leitor`
- Ativar as thresholds de cobertura de 80% de `vitest.config.ts`, que seguem letra morta porque nenhum portão passa `--coverage`
