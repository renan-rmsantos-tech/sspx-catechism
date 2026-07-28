# TechSpec — Fidelidade ao design system

> Iniciativa: `fidelidade-design-system` · PRD: [`_prd.md`](_prd.md)
> Contexto de negócio no PRD; aqui só o desenho técnico.

## Executive Summary

A iniciativa não introduz sistema novo: ela estende quatro trilhos existentes e adiciona um. A porta de fidelidade é um conjunto de **meta-testes Vitest** — mesmo idioma da guarda de cor literal que já vive em `frontend/src/test/color-literals.test.ts` — organizados num registro de regras onde cada regra declara seu nível de aplicação (`report` ou `block`) e carrega, obrigatoriamente no tipo, o fixture plantado que prova que ela funciona. Fechar uma fase do PRD é virar um campo de `report` para `block`.

A decisão de arquitetura que mais define o resultado é onde a porta roda. Este repo **não tem CI** — o GitHub Actions está dormente por bloqueio de conta, não há hook git algum e não há linter. Os dois únicos portões reais estão dentro de Dockerfiles e disparam em `git push production main`. A porta entra nesse trilho, ganha um `pre-push` versionado para feedback rápido, e não depende do Actions (ADR-002).

Os dois compromissos principais: a regra de classe morta deriva seu vocabulário da própria folha de referência do `design/`, em troca de uma dependência de caminho que exige uma linha no `Caddy.Dockerfile` (ADR-003); e a regra do número tabular sai da porta e vira API declarativa da tabela, porque mecanizá-la por varredura produziria o falso positivo que o ADR-001 proíbe (ADR-006).

## System Architecture

### Component Overview

| # | Componente | Responsabilidade | Estado |
|---|---|---|---|
| 1 | `frontend/src/test/design-fidelity/` | Registro de regras, varredor de arquivos e condutor da suíte | **novo** |
| 2 | `frontend/src/styles.css` | Anel de foco como regra sem camada | modificado |
| 3 | `frontend/src/components/ui/*` | Primitivos fiéis ao `design/` | modificados |
| 4 | `frontend/src/components/ui/anchor-components.test.tsx` | Contrato dos primitivos por renderização | modificado |
| 5 | `frontend/scripts/capture-baseline.ts` | Evidência visual das 12 superfícies | modificado |
| 6 | `scripts/pre-push.sh` | Portão local antes do push para `origin` | **novo** |
| 7 | `infra/Caddy.Dockerfile` | Disponibilizar a folha de referência ao portão | modificado |

### Fluxo de dados

As regras leem três fontes e nada mais:

- `design/assets/catequese-ds.css` — o vocabulário que o design system nomeia
- `frontend/src/styles.css` — o que o projeto de fato define
- `frontend/src/**/*.{ts,tsx}` — o uso

Sem rede, sem banco, sem DOM. É leitura de arquivo, como a guarda de cor literal já faz. Isso é requisito, não coincidência: o portão de deploy roda na droplet de produção (`infra/README.md:244-245`), competindo por CPU com os apps no ar.

### Fronteira

A porta **não renderiza** e não conhece React; o contrato dos primitivos **renderiza** e não lê arquivo. Uma responde "o que o código diz", a outra "o que o componente faz". A separação evita que o registro de regras acumule responsabilidade de teste de componente.

## Implementation Design

### Core Interfaces

O registro de regras. O campo `fixture` ser obrigatório é a decisão central: não é possível registrar uma regra sem entregar a prova de que ela pega o que promete.

```ts
type Enforcement = 'report' | 'block'
type Violation = { file: string; line: number; excerpt: string }

type RuleContext = {
  /** Classes que o design/ nomeia e o styles.css não traduziu. */
  legacyOnly: ReadonlySet<string>
  /** Classes que o styles.css de fato define. */
  defined: ReadonlySet<string>
}

type Rule = {
  name: string          // 'classe-inexistente'
  reason: string        // uma frase: por que isso é proibido
  enforcement: Enforcement
  inspect(file: string, source: string, ctx: RuleContext): Violation[]
  /** A violação plantada que prova que a regra funciona. Obrigatória. */
  fixture: { filename: string; source: string }
}
```

O condutor derrama as duas suítes a partir do registro — a real e a auto-verificação:

```ts
describe.each(RULES)('$name', (rule) => {
  it('não tem violações', async () => {
    const found = await scan(SRC_ROOT, rule, ctx)
    if (rule.enforcement === 'report') return void report(rule, found)
    expect(found, format(rule, found)).toEqual([])
  })

  it('pega a violação plantada', async () => {
    const dir = await plant(rule.fixture)
    try { expect(await scan(dir, rule, ctx)).not.toEqual([]) }
    finally { await rm(dir, { recursive: true, force: true }) }
  })
})
```

A derivação do vocabulário legado, coração da regra de classe morta (ADR-003):

```ts
/** Seletores de classe do CSS de referência que o projeto nunca traduziu. */
function legacyOnlyClasses(referenceCss: string, projectCss: string): Set<string>
```

### Data Models

**Não se aplica.** A iniciativa não introduz entidade de domínio nem persistência. Os únicos tipos são `Rule`, `Violation` e `RuleContext`, declarados acima, e existem apenas dentro da suíte de testes.

### API Endpoints

**Não se aplica.** Nenhuma superfície de rede é criada ou alterada. O contrato com o backend permanece intocado — paridade funcional é restrição do PRD.

## Integration Points

Um único ponto de integração, e ele é com o caminho de deploy.

**`infra/Caddy.Dockerfile`.** O contexto de build já é a raiz do repo (`compose.traefik.yaml:48`), mas a linha 11 copia apenas `frontend/`. Uma linha de `COPY`, **antes** do `RUN npx vitest run` da linha 13, passa a trazer `design/assets/catequese-ds.css` para `/design/assets/`. Isso espelha o layout: como `COPY frontend/ ./` põe o frontend em `/app`, o caminho relativo `../design/assets/catequese-ds.css` resolve igual dentro da imagem e fora dela. O Dockerfile já copia de fora de `frontend/` — o `Caddyfile.traefik` vem da raiz.

**Tratamento de falha.** Se um teste reprova, a imagem não constrói, o `docker compose up --build` falha e o `post-receive.sh:107-111` faz apenas `git reset --hard`, sem tocar containers. As imagens novas nunca existiram, então a versão anterior segue no ar — impacto zero. Só falha de *health check* aciona o caminho de reconstrução, com ~90s fora do ar.

**Sem integração externa.** Nenhum serviço de terceiro, nenhuma autenticação nova, nenhuma política de retentativa.

## Impact Analysis

| Componente | Impacto | Descrição e risco | Ação necessária |
|---|---|---|---|
| `frontend/src/styles.css` | modificado | `:focus-visible` sai de `@layer base` para regra sem camada. Efeito global: o anel passa a aparecer em superfícies que hoje não o mostram. **Risco baixo, alcance total.** | Mover a regra com comentário; conferir as 12 superfícies |
| `components/ui/button.tsx` | modificado | Remove `focus-visible:outline-none`, adiciona afundamento no `:active`, remove as variantes-apelido. **Risco alto:** `outline` e `destructive` têm 17 usos — 15 em `admin-page.tsx`, 1 em `confirm-dialog.tsx` | Renomear os usos no mesmo passo; `tsc -b` reprova o que escapar |
| `components/ui/field.tsx` | modificado | Remove `focus:outline-none`, adiciona o anel de 3px do spec, ganha `SearchField` | — |
| `components/ui/table.tsx` | modificado | API passa a declarar colunas numéricas (ADR-006). Todas as chamadas do admin mudam | Alterar **antes** de migrar as views |
| `pages/admin/admin-page.tsx` | modificado, pesado | 1305 linhas. 28 controles, `Field` local removido, 2 botões crus, chips, tabular, rede, vazios. **Maior superfície de mudança; 20 testes acoplados à marcação atual** | Migrar view a view, rodando a suíte do admin a cada uma |
| `pages/dashboard/attendance-page.tsx` | modificado | Busca crua vira `SearchField`; lavagens de 5% e 4% na linha | — |
| `attendance-row`, `stepper`, `brand`, `auth-shell` | modificados | Lavagem, trilhos, SVG inline, gradiente. O brasão inline **remove** o filtro de inversão do `auth-shell` | Os dois últimos andam juntos |
| `src/test/color-literals.test.ts` | modificado | Absorvido pelo registro. **Risco:** perder a técnica de auto-teste na migração | Migrar preservando o fixture plantado |
| `components/ui/anchor-components.test.tsx` | modificado | Ganha afirmações de foco e de coluna tabular | — |
| `scripts/capture-baseline.ts` | modificado | +7 rotas do admin. Hoje mocka papel `catechist` em 4 pontos | Mock de papel de coordenação e fixtures dos sete módulos |
| `infra/Caddy.Dockerfile` | modificado | Uma linha de `COPY`. **Toca o caminho de deploy**, reconstruído esta semana | Exercitar num deploy real antes de fechar a Fase 1 |
| `src/test/design-fidelity/` | **novo** | Registro, varredor e condutor | — |
| `scripts/pre-push.sh` | **novo** | Hook versionado, instalação por cópia | Documentar em `infra/README.md` §8 |
| `docs/qa/`, `docs/visual-baseline/` | modificados | Evidência de conferência e imagens por fase | — |

**O risco a destacar não é a porta — é o `admin-page.tsx`:** um arquivo de 1305 linhas com 20 testes acoplados, mudando em oito frentes. É onde o trabalho pode empacar.

## Testing Approach

### Unit Tests

Cinco regras, cada uma com o par que o tipo obriga — o teste real, que varre `frontend/src/`, e o teste de violação plantada.

| Regra | O que reprova | Estado hoje | Vira `block` na |
|---|---|---|---|
| `cor-literal` | `#hex`, `rgb()`, `hsl()`, `oklch()` fora dos tokens | Já verde | Fase 1 |
| `classe-inexistente` | Classe que o `design/` nomeia e o `styles.css` não define | Reprova 28 controles | Fase 3 |
| `controle-cru` | `<button>`, `<input>`, `<select>`, `<textarea>` fora de `components/ui/` | Reprova 5 botões e 31 campos | Fase 3 |
| `foco-apagado` | `outline-none` em qualquer variante | Reprova 3 arquivos | Fase 2 |
| `apelido-de-variante` | `variant="outline"` e `variant="destructive"` | Reprova 17 usos | Fase 3 |

Mais duas unidades sem DOM: `legacyOnlyClasses()` alimentada com CSS sintético, e o varredor contra uma árvore temporária.

**Técnica herdada de `color-literals.test.ts`, que deve ser preservada na migração:** varredura recursiva própria via `readdir(dir, { withFileTypes: true })`; reset explícito de `lastIndex` em regex global de módulo; e o fixture plantado montando o literal por concatenação (`['#', 'ff00aa'].join('')`) para que o próprio arquivo de teste não dispare a regra contra si mesmo.

### Integration Tests

**Contrato dos primitivos.** `anchor-components.test.tsx` já renderiza 18 primitivos e afirma classes de token, `min-h-touch` e `disabledReason`. Ganha: anel de foco em todo primitivo interativo, coluna declarada numérica saindo tabular, afundamento no botão, stepper em trilhos, lavagem da linha nos percentuais do spec.

**Páginas.** Os 20 testes de `admin-page.test.tsx` são o ponto sensível — acoplados à marcação atual e migrando em oito frentes. Regra de trabalho: migrar uma view por vez e rodar a suíte do admin a cada uma, nunca acumulando. Somam-se dois casos novos — o admin renderiza o indicador de rede, e os estados aparecem em português.

**Ambiente.** jsdom, execução serial (`fileParallelism: false`, `maxWorkers: 1`, já configurado), sem rede. `setupFiles: ['src/test/setup.ts']` continua limpando as tabelas Dexie entre casos. A porta lê `design/assets/catequese-ds.css` por caminho relativo à raiz do frontend — o mesmo caminho dentro e fora da imagem.

**Lacuna conhecida, fora de escopo:** as thresholds de cobertura de 80% em `vitest.config.ts:32-39` são letra morta — nenhum portão passa `--coverage`. Registrado, não endereçado.

## Development Sequencing

### Build Order

**Fase 1 — A porta**

1. Varredor, tipos e condutor em `src/test/design-fidelity/` — sem dependências
2. `legacyOnlyClasses()` e o `COPY` no `Caddy.Dockerfile` — depende de 1
3. As cinco regras, todas nascendo em `report` — depende de 1 e 2
4. Migrar `color-literals.test.ts` para o registro já em `block` — depende de 3
5. `scripts/pre-push.sh` e instalação documentada em `infra/README.md` §8 — depende de 3
6. Exercitar um deploy real para validar o `COPY` — depende de 2

**Fase 2 — Foco**

7. `styles.css`: a regra sai da camada
8. Remover os três `outline-none`; anel de 3px no campo — depende de 7
9. Afirmações de foco nos primitivos — depende de 8
10. `foco-apagado` vira `block` — depende de 8 e 9
11. Conferência por teclado nas 12, registrada em `docs/qa/`

**Fase 3 — Admin**

12. `Table` com colunas numéricas declaradas, mais o contrato — **precede** a migração das views
13. `SearchField` no `field.tsx` — precede também
14. Migração view a view: anos → calendário → turmas → alunos → catequistas → inscrições → relatórios. A cada uma, a suíte do admin roda antes de passar à seguinte
15. Indicador de rede no shell; `Section` sobre tokens; as 17 variantes-apelido renomeadas, `confirm-dialog.tsx` incluído
16. `classe-inexistente`, `controle-cru` e `apelido-de-variante` viram `block`
17. Checklist do `design/SKILL.md` por tela, registrada

**Fase 4 — Primitivos e marca**

18. Afundamento no botão; trilhos no stepper; lavagens de 5% e 4% na linha de chamada
19. Brasão em SVG inline e gradiente no `auth-shell` — o inline remove o filtro de inversão, então andam juntos
20. `capture-baseline.ts` com as sete rotas do admin e mock de sessão de coordenação
21. Captura das 12 superfícies em telefone e desktop; conferência contra `design/preview/`; registro
22. Registro inteiro em `block`

O passo 12 vir antes do 14 não é preferência de ordem: é o que evita migrar as sete tabelas duas vezes.

### Technical Dependencies

- **Deploy real validando o `COPY`**, antes de fechar a Fase 1. Se falhar, `classe-inexistente` não roda no único portão que existe e a Fase 3 perde sua rede.
- **Fixtures do admin para a captura.** Hoje `capture-baseline.ts` mocka só papel `catechist` e dados de turma; sete módulos precisam de dados de coordenação.
- **Quem faz a conferência visual.** Open Question do PRD, necessária antes da Fase 2 fechar — senão a evidência da primeira fase nasce sem dono.

## Monitoring and Observability

Não há serviço em execução para observar; o que existe é registro de verificação.

- **Saída da porta.** Em `report`, cada regra imprime as violações agrupadas por superfície — arquivo, linha e trecho. É esse texto que constitui o backlog previsto no ADR-001.
- **Log de deploy.** `~/deploy-sspx-catechism.log` na droplet, escrito pelo `post-receive.sh`, registra build, teste, health check e rollback. É onde uma reprovação da porta em produção aparece.
- **Árvore viva de QA.** `docs/qa/` recebe a checklist do `SKILL.md` respondida por tela e a conferência por teclado. É o registro auditável exigido pelas métricas do PRD.
- **Baseline visual.** `docs/visual-baseline/<fase>/` acumula as imagens por fase, sem comparação automatizada (ADR-007).

**Indicador de saúde da iniciativa:** o número de regras em `block` sobre o total. Fase 1 fecha com 1 de 5; Fase 2 com 2 de 5; Fase 3 com 5 de 5.

## Technical Considerations

### Key Decisions

Cada decisão tem ADR próprio; o resumo com as trocas:

- **Porta como meta-testes Vitest, mais `pre-push`** (ADR-002). *Por quê:* não existe CI, e o único portão real já hospeda a guarda de cor. *Troca:* o `pre-push` exige instalação manual por máquina; o portão real roda em produção.
- **Vocabulário legado derivado do `design/`** (ADR-003). *Por quê:* fonte da verdade única, zero falso positivo, custo desprezível. *Troca:* dependência de caminho fora de `frontend/` e uma linha no caminho de deploy; não pega erro de digitação de utility.
- **Controle cru proibido fora de `components/ui/`** (ADR-004). *Por quê:* torna os 44px verdade por construção e impede outro `Field` local. *Troca:* 36 pontos de marcação a migrar; marcação trivial passa a custar um componente.
- **Foco como regra sem camada** (ADR-005). *Por quê:* vence toda utility, então não há classe que o desligue. *Troca:* padrão incomum em projeto Tailwind, que precisa de comentário para não ser "arrumado" de volta.
- **Tabular como API da tabela** (ADR-006). *Por quê:* varredura estática não distingue número comparável de identificador. *Troca:* muda a API de `Table`; não cobre número fora de tabela.
- **Conferência visual estendendo a captura** (ADR-007). *Por quê:* reaproveita trilho testado e mantém o portão de deploy leve. *Troca:* julgamento humano, com o viés que carrega.

### Known Risks

- **O `COPY` quebrar o deploy.** Probabilidade baixa, impacto alto — o caminho de deploy foi reconstruído esta semana. *Mitigação:* dependência bloqueante da Fase 1; e falha de build reverte sem impacto (`post-receive.sh:107-111`).
- **Os 20 testes do admin quebrarem em bloco.** Probabilidade média, impacto alto. *Mitigação:* migração view a view com a suíte rodando a cada uma.
- **Remover as variantes-apelido gerar 17 renomeações num arquivo de 1305 linhas.** *Mitigação:* `tsc -b` reprova toda variante inexistente — a mudança é mecânica e verificável.
- **A regra `controle-cru` esbarrar num caso que o primitivo não cobre.** Probabilidade média. *Mitigação:* estender o primitivo é a resposta prevista; `SearchField` já é uma extensão nascida assim. Não há allowlist por decisão (ADR-004).
- **O anel de foco colidir visualmente com gaveta, segmentado ou linha de chamada.** *Mitigação:* conferência por teclado nas 12 é critério de saída da Fase 2.
- **Uma regra ficar esquecida em `report` para sempre.** *Mitigação:* o indicador de saúde acima torna isso visível; cada fase declara qual regra vira `block`.

**Área que merece prototipagem antes de comprometer:** a extração de seletores de `catequese-ds.css`. A folha tem 25 KB e usa seletores compostos e `:has()`; convém validar a extração contra a lista conhecida (`input`, `btn`, `card`, `select`, `textarea`, `field`, `seg-btn`, `num-col`, `list-row`) antes de construir a regra em cima dela.

## Architecture Decision Records

- [ADR-001: A porta automática escreve o backlog](adrs/adr-001.md) — a verificação é construída primeiro e calibrada para falhar no código atual; a lista de falhas que ela emite é o backlog da iniciativa.
- [ADR-002: A porta são meta-testes Vitest no trilho existente, mais um hook pre-push](adrs/adr-002.md) — como não há CI, as regras entram no portão de deploy que já existe e ganham um `pre-push` versionado para feedback rápido.
- [ADR-003: O vocabulário de classe morta é derivado da folha de referência do `design/`](adrs/adr-003.md) — a lista de classes proibidas é o `design/` menos o `styles.css`, com uma linha de `COPY` levando a folha ao portão.
- [ADR-004: Controle HTML cru é proibido fora da biblioteca de primitivos](adrs/adr-004.md) — se só o primitivo emite controle e o primitivo carrega a altura, o alvo de 44px vale por construção.
- [ADR-005: O anel de foco é regra CSS fora de camada, com contrato nos primitivos](adrs/adr-005.md) — regra não-encamadada vence toda utility, tornando o foco impossível de desligar.
- [ADR-006: O número tabular vira API da tabela, não regra da porta](adrs/adr-006.md) — varredura estática não distingue número comparável de identificador, então a tabela passa a declarar suas colunas numéricas.
- [ADR-007: A conferência visual estende a captura existente, sem comparação automatizada](adrs/adr-007.md) — as sete rotas do admin entram no gerador de baseline; o veredito continua humano.
