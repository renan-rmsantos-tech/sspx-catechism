# PRD — Fidelidade ao design system

> Iniciativa: `fidelidade-design-system`
> Sucede `.compozy/tasks/aplicar-design-system/`, cujo critério de saída da Onda 4 foi dado como cumprido sem verificação.

## Overview

O design system Catequese existe, está documentado em `design/` e é declarado fonte da verdade visual pelo `AGENTS.md`. O que não existe é a garantia de que o código o obedeça. O commit que declarou "design system aplicado em toda a UI" deixou o console da coordenação praticamente intocado — 139 de 1305 linhas —, apagou a indicação de foco por teclado das doze superfícies do produto e passou verde na única guarda que havia, porque essa guarda só sabia procurar cor literal.

Esta iniciativa fecha a distância entre o documento e o código, e instala o mecanismo que impede a distância de reabrir. Ela não redesenha nada: o `design/` está decidido, o que falta é cumpri-lo.

**Para quem:** o catequista que navega por teclado e hoje não enxerga onde está; o coordenador que preenche formulários sem estilo nas sete telas do admin; e todo agente ou pessoa que no futuro abrir o `design/` e precisar confiar que ele descreve o produto de verdade.

**Por que vale:** o foco invisível é falha de acessibilidade de nível AA, não questão de gosto — quem não usa mouse fica sem saber onde está em qualquer tela do sistema. O admin sem estilo desmente, na tela que a coordenação mais usa, o cuidado que o resto da UI transmite. E enquanto a conformidade depender de alguém lembrar, ela volta a se perder no commit seguinte: da última vez, "foco visível para teclado" estava escrito no PRD e mesmo assim regrediu.

**As 12 superfícies:** acesso, troca de senha, painel do catequista, folha de chamada, inscrição pública, e as sete da coordenação — anos, calendário, turmas, alunos, catequistas, inscrições, relatórios.

## Goals

1. **O `design/` volta a descrever o produto.** Toda regra mecanizável do `DESIGN.md` — token, classe existente, foco, alvo de toque, número tabular, marcação de estado — tem uma verificação que roda sozinha. *Medida:* zero divergências mecanizáveis nas 12 superfícies, com a porta verde.

2. **Foco visível em todo controle.** Botão, campo, seleção, área de texto, busca, item de navegação, aba do segmentado. *Medida:* fecha a falha WCAG 2.4.7 (nível AA); nenhum apagamento de foco sem substituto equivalente sobrevive no código.

3. **O console da coordenação entra no sistema.** As sete telas do admin passando a checklist do `design/SKILL.md` item a item. *Medida:* checklist respondida e registrada por tela, sem item em falha.

4. **Marca e primitivos fiéis ao especificado.** Brasão que herda os tokens, aside da autenticação como o `design/` desenha, stepper em trilhos, linha de chamada como lavagem e não como card preenchido. *Medida:* conferência visual contra `design/preview/` aprovada nas 12 superfícies.

5. **Divergir deixa de ser silencioso.** Classe inexistente, cor fora dos tokens, controle sem foco e alvo abaixo de 44px falham o build com arquivo e linha. *Medida:* a porta falha, hoje, apontando os 28 controles com classe inexistente e os três apagamentos de foco — se não falhar, está mal calibrada.

**Prazo:** sem data rígida. Qualidade acima de velocidade; cada fase abre quando a anterior fechar.

## User Stories

**Coordenação — o papel mais afetado hoje**

- Como coordenadora, quero que os formulários do admin tenham a mesma aparência do resto do sistema, para não desconfiar que a tela está quebrada quando vou cadastrar uma turma.
- Como coordenadora, quero ver o estado de cada inscrição em português e por cor — pendente, aprovada, rejeitada, renovação —, para não precisar traduzir `pending` de cabeça no meio da fila de revisão.
- Como coordenadora, quero que os números das tabelas e relatórios se alinhem em coluna, para comparar frequência entre turmas com o olho, sem contar dígito.
- Como coordenadora, quero saber se o sistema está online enquanto cadastro, porque estou gravando dados e hoje só as telas do catequista me avisam.

**Catequista**

- Como catequista navegando por teclado, quero enxergar em que campo estou, para conseguir fazer a chamada sem depender do toque na tela.
- Como catequista, quero que a linha marcada continue sendo uma linha com um tom de fundo, e não um bloco colorido, para bater o olho na lista inteira e achar quem falta.

**Responsável**

- Como responsável preenchendo a inscrição, quero ver em qual dos quatro passos estou de um jeito que sobreviva na tela do celular, para saber quanto falta antes de desistir no meio.

**Quem constrói — pessoa ou agente**

- Como quem vai mexer numa tela amanhã, quero que o `design/` descreva o produto de verdade, para não implementar contra um documento que mente.
- Como quem abre um pull request, quero que o build me diga na hora que usei uma classe que não existe ou apaguei um foco, para não descobrir isso numa auditoria seis meses depois.

**Caso de borda**

- Como pessoa que ativou "reduzir movimento" no sistema operacional, quero que o produto respeite a preferência em toda transição, inclusive nas superfícies novas do admin.

## Core Features

### Prioridade 0 — O mecanismo de fidelidade

**A porta de fidelidade.** Verificação que roda no build e reprova o que o `design/` proíbe, apontando arquivo e linha: classe de estilo que não existe no resultado final, cor fora dos tokens, controle que apaga o foco sem repor equivalente, alvo de toque abaixo de 44px em superfície de catequista, e número comparável fora do tabular. Precisa reprovar o estado atual do código nos casos já conhecidos — senão está mal calibrada e não serve.

**A conferência visual por superfície.** Cada uma das 12 telas é comparada com a referência de `design/preview/` e responde a checklist do fim do `design/SKILL.md` item a item. O resultado entra na árvore viva de `docs/qa/`. É o que pega o que a porta não vê: proporção, ritmo, hierarquia.

### Prioridade 1 — Foco visível

**Um anel de foco, em todo controle.** Botão, campo, seleção, área de texto, busca, item de navegação, aba do segmentado e fechar-gaveta. Anel de 2px na cor de ação, deslocado 2px, sempre visível pelo teclado — como o `design/` já especifica. Nenhuma superfície pode optar por não ter.

### Prioridade 2 — O console da coordenação entra no sistema

- **Campos do sistema nos formulários do admin**, com rótulo associado ao controle, altura de toque e erro amarrado ao estado de acessibilidade em vez de a uma marcação visual paralela.
- **Estado como chip, em português.** Pendente, aprovada e rejeitada substituem os termos técnicos em inglês; renovação ganha o dourado litúrgico, que é o papel que o `design/` reserva para ele.
- **Números que alinham.** Colunas numéricas das tabelas e dos relatórios em tabular, para comparação a olho.
- **Estado de rede visível também na coordenação**, porque é uma superfície que grava dados.
- **Vazio que diz o próximo passo**, no lugar de "Nenhum registro encontrado."
- **Escolhas do sistema** no lugar dos marcadores nativos, e busca com o ícone dentro do controle.

### Prioridade 3 — Primitivos e marca fiéis ao desenho

- **Botão** com o afundamento de 1px na pressão, e as variantes reduzidas aos quatro nomes do sistema — hoje existem apelidos herdados que deixam alguém emitir um segundo botão primário sem perceber.
- **Stepper em trilhos** de largura igual, como o `design/` desenha, em vez de bolinhas numeradas.
- **Linha de chamada como lavagem** de 5% e 4%, não como bloco preenchido.
- **Brasão em SVG inline**, herdando os tokens — o que elimina o filtro de inversão que a tela de acesso precisa hoje —, e o aside da autenticação com o gradiente especificado.

## User Experience

**Nenhum fluxo muda.** Quem já aprendeu o caminho — entrar → escolher turma → fazer chamada → confirmar, ou entrar → inscrições → revisar na gaveta → aprovar — percorre exatamente os mesmos passos, com os mesmos rótulos, na mesma ordem. Não há nada a reaprender e não há onboarding: a iniciativa troca a roupa e conserta o que está quebrado, não mexe no mapa.

**O que a coordenação percebe.** Abre o admin e os campos passam a ter a mesma aparência dos campos que ela já viu na inscrição pública: altura confortável, borda do sistema, erro que aparece junto do campo em vez de solto. A fila de inscrições deixa de mostrar o termo técnico em inglês e passa a mostrar **Pendente**; a renovação vira um selo dourado que se acha de relance. As colunas de número param de dançar. E aparece, no alto, o mesmo indicador de rede que as telas do catequista sempre tiveram — porque cadastrar também é gravar dado.

**O que o catequista percebe.** Ao navegar por teclado, enxerga onde está — o que hoje simplesmente não acontece em nenhuma tela. A linha marcada continua sendo uma linha com fundo tingido, não um bloco de cor, o que devolve a leitura de varredura na lista de 22 nomes.

**O que o responsável percebe.** O indicador de passo da inscrição passa a ser trilho, que sobrevive em tela estreita, em vez de bolinhas numeradas que se espremem.

**Acessibilidade, no recorte que o `design/` define.** Foco visível de 2px em todo controle, alvos de 44px nas superfícies de catequista e nas públicas, estado de erro amarrado a `aria-invalid` para que o visual e o anúncio não possam divergir, gráficos com papel de imagem e descrição da série inteira, e preferência de movimento reduzido respeitada também nas superfícies do admin.

**Descoberta.** Nada de novo a descobrir para quem usa. Para quem constrói, a descoberta é a porta: ela ensina a regra no momento do erro, com arquivo e linha, em vez de exigir que alguém tenha lido as 21 mil palavras do `DESIGN.md` antes de tocar numa tela.

## High-Level Technical Constraints

- **O `design/` é a fonte da verdade e o código cede.** Onde implementação e documento divergem, o documento prevalece — decisão registrada no ADR-001.
- **O sistema de referência não entra cru.** O `AGENTS.md` já determina que a folha de referência não seja importada diretamente: os tokens são traduzidos para o tema do projeto e os componentes de referência são adaptados aos primitivos existentes. A iniciativa opera dentro dessa tradução, não em volta dela.
- **Paridade funcional é obrigatória.** Nenhum comportamento, rota, texto de navegação ou contrato com o backend muda. A camada offline da chamada e a fila de sincronização permanecem intactas.
- **Acessibilidade no recorte do `design/`.** Foco visível, alvos de 44px, `aria-invalid` como gancho de estado, descrição de série nos gráficos, movimento reduzido. Conformidade WCAG AA completa está fora — ver Non-Goals.
- **Sem prazo externo.** A iniciativa não é comandada por janela de inscrição nem por início de ano letivo.

## Non-Goals (Out of Scope)

- **Redesenhar qualquer coisa.** O `design/` está decidido; esta iniciativa cumpre, não propõe.
- **Mudar fluxo, funcionalidade ou texto de navegação.** Os passos são os mesmos.
- **O motivo de pontos (`.dot-grid`) no aside da autenticação.** Único item puramente decorativo do inventário; não corrige defeito e não desbloqueia ninguém. Cortado por YAGNI.
- **Conformidade WCAG AA completa.** Contraste integral, nomes acessíveis e ordem de foco auditados por inteiro ficam para iniciativa própria.
- **O bug de leitor de tela já aberto** (`BUG-20260725-chamada-sem-anuncios-leitor` — a folha de chamada não anuncia nada). É real e está registrado, mas pertence à iniciativa de acessibilidade, não a esta.
- **Filtros nas tabelas do admin.** Prometidos no PRD anterior e ainda pendentes; são funcionalidade, não fidelidade visual.
- **Extrair as sete telas do arquivo monolítico do admin.** Dívida estrutural declarada na iniciativa anterior; os arquivos de entrada de tela continuam sendo reexportações. Reorganizar código não é objetivo deste PRD.
- **Fonte de dias santos para o calendário.** Já decidido fora de escopo pelo ADR-005 da iniciativa anterior; o dourado continua alimentado apenas por dado existente.

## Phased Rollout Plan

A porta nasce em **modo relatório** — lista o que está fora do sistema sem travar ninguém. A cada fase, as regras que aquela fase fechou passam a **barrar o merge**. Ao fim, a porta inteira é bloqueante e a fidelidade deixa de depender de vigilância.

### Fase 1 — A porta (MVP da iniciativa)

- Verificações de classe inexistente, cor fora dos tokens, foco apagado sem substituto, alvo abaixo de 44px e número comparável fora do tabular.
- Calibração contra o estado atual do código e emissão do relatório de divergências, que passa a ser o backlog das fases seguintes.

**Critério de saída:** a porta reprova o código de hoje apontando, no mínimo, os 28 controles com classe inexistente do admin e os três apagamentos de foco. Cada regra explica a falha em uma frase e nenhuma produz falso positivo. O relatório está publicado e ordenado por superfície.

### Fase 2 — Foco visível

- Um anel de foco único, aplicado de forma que nenhuma superfície consiga optar por não tê-lo.
- Conferência por teclado nas 12 superfícies.

**Critério de saída:** a regra de foco fica verde nas 12 e passa a barrar merge. A falha WCAG 2.4.7 está fechada, com a conferência por teclado registrada em `docs/qa/`.

### Fase 3 — O console da coordenação

- As sete telas do admin: campos do sistema, estado em chip e em português, dourado na renovação, números tabulares, indicador de rede, vazios que dizem o próximo passo, escolhas e busca do sistema.

**Critério de saída:** as sete telas com porta verde e a checklist do `design/SKILL.md` respondida item a item, sem item em falha. As regras de classe, token, tabular e marcação de estado passam a barrar merge.

### Fase 4 — Primitivos e marca

- Botão, stepper, lavagem da linha de chamada, brasão inline e aside da autenticação.
- Conferência visual das 12 superfícies contra `design/preview/`.

**Critério de saída:** conferência visual aprovada nas 12, com evidência registrada. A porta inteira passa a barrar merge. A partir daqui, qualquer divergência nova reprova antes de entrar.

## Success Metrics

**Fidelidade auditável.** As 12 superfícies com a porta verde e zero divergência mecanizável — classe inexistente, cor fora dos tokens, foco apagado, alvo abaixo de 44px, número comparável fora do tabular. Ao fim, a porta é bloqueante, não consultiva.

**Acessibilidade no recorte do `design/`.** Falha WCAG 2.4.7 fechada: 100% dos controles com foco visível pelo teclado, conferência registrada em `docs/qa/`. Erro de formulário amarrado a `aria-invalid` em toda superfície; gráficos com papel de imagem e descrição da série; movimento reduzido respeitado inclusive no admin.

**Fidelidade não-mecanizável.** Checklist do `design/SKILL.md` respondida item a item nas 12 superfícies, sem item em falha, e conferência visual contra `design/preview/` aprovada. É o que mede proporção, ritmo e hierarquia — o que teste nenhum alcança.

**Paridade funcional.** Nada regride: a suíte de testes permanece verde e nenhum cenário do `docs/qa/state.csv` abre bug funcional novo por causa desta iniciativa. Os fluxos são os mesmos, com os mesmos passos.

**Durabilidade da guarda.** Cada regra da porta tem um teste de falha plantada — a mesma técnica que a guarda de cor literal já usa — provando que a regra realmente pega o que promete pegar. A medida real vem depois: a próxima divergência introduzida reprova antes do merge, em vez de aparecer numa auditoria meses depois.

## Risks and Mitigations

**A porta virar ruído** — regra que produz falso positivo ensina a equipe a ignorar o alerta, e aí ela não vale nada. *Mitigação:* nenhuma regra entra sem falhar por um motivo real e verificável no código de hoje; regra que não sabe explicar a própria falha em uma frase não entra.

**Confiar na porta e pular a conferência visual** — a porta não vê proporção, ritmo nem hierarquia, e é confortável tratar o verde como se fosse o veredito inteiro. *Mitigação:* a conferência visual é critério de saída de cada fase, não item opcional; sem evidência registrada, a fase não fecha.

**A conferência visual virar carimbo** — se quem implementa também confere, o julgamento herda o viés de quem fez. *Mitigação:* está em Open Questions quem confere; a decisão precisa sair antes da Fase 2.

**Escopo crescer durante as fases** — "já que estamos mexendo, vamos aproveitar e adicionar". Foi o risco nomeado na iniciativa anterior e continua valendo. *Mitigação:* Non-Goals explícitos; qualquer funcionalidade fora do que o `design/` define vira iniciativa separada.

**O backlog da porta ser maior do que o previsto** — a Fase 1 pode revelar divergências que a auditoria manual não viu. *Mitigação:* a ausência de prazo rígido absorve isso; o relatório vem ordenado por superfície e a correção segue essa ordem.

**Estranhamento da coordenação** — o admin muda de aparência de uma vez, e quem usa todo dia pode sentir como se algo tivesse quebrado. *Mitigação:* nenhum passo de fluxo muda, e a troca dos termos técnicos por português torna a tela mais legível, não menos; vale avisar a coordenação antes da Fase 3 entrar.

**A acessibilidade permanecer aberta durante a Fase 1** — a abordagem escolhida constrói a porta antes de consertar o foco. *Mitigação:* a Fase 2 é a primeira correção e não depende de nada além da Fase 1; se a Fase 1 se alongar, a regra de foco pode ser destacada e a Fase 2 antecipada.

## Architecture Decision Records

- [ADR-001: A porta automática escreve o backlog](adrs/adr-001.md) — a verificação de fidelidade é construída primeiro e calibrada para falhar no código atual; a lista de falhas que ela emite é o backlog da iniciativa, em vez de um inventário derivado de auditoria humana.

## Open Questions

- **Quem faz a conferência visual?** A mesma pessoa que implementa, ou uma revisão independente? Precisa estar decidido antes da Fase 2 fechar, porque é o que separa evidência de carimbo.
- **O `DESIGN.md` fala em nomes que o projeto não usa.** O documento descreve componentes por nomes de classe da folha de referência, enquanto o produto os expressa como primitivos próprios. Vale registrar essa tradução dentro do próprio `design/`, para quem for ler amanhã não se confundir como o admin se confundiu? Não foi decidido — e mexer no `design/` tensiona a decisão de que o código é quem cede.
- **Os rótulos de estado precisam de validação da coordenação?** Pendente, aprovada, rejeitada e renovação parecem óbvios, mas quem revisa a fila todo dia pode ter vocabulário próprio.
- **`design/ui_kits/` e o pacote compactado versionado em `design/` entram na conferência?** São artefatos do design não auditados nesta análise; não está claro se são referência viva ou resíduo.
- **A conferência visual produz baseline capturado ou é julgamento registrado?** A iniciativa anterior deixou a captura do baseline do admin pendente; se a conferência reaproveita esse caminho, é decisão da especificação técnica.
