# PRD — Aplicar o Design System Catequese

## Overview

A aplicação Catequese SSPX ganhará sua identidade visual definitiva antes do lançamento, aplicando o design system "Catequese" (criado com OpenDesign, em `design/`) a toda a interface.

- **Problema que resolve:** o visual atual é um protótipo âmbar/creme com cores improvisadas (verde/vermelho inline na chamada), apenas dois componentes compartilhados e nenhuma marca — inconsistente, difícil de manter e sem identidade.
- **Para quem:** catequistas em campo (chamada no celular, muitas vezes offline), coordenação (gestão de turmas, inscrições, calendário e relatórios) e pais/responsáveis (inscrição pública).
- **Por que vale:** o produto estreia com um rosto oficial e cuidado; a dívida visual morre na raiz (tudo derivado de tokens, auditável); e as superfícies desenhadas mas inexistentes — inscrição em etapas, revisão em drawer, calendário litúrgico, gráficos — passam a existir de verdade. Como não há usuários ainda, este é o visual de estreia: sem custo de reaprendizado, sem PWAs instalados com ícone antigo.

## Goals

1. **Lançar com identidade própria** — o produto estreia com a marca e o visual definitivos, sem herdar o protótipo âmbar/creme.
2. **Eliminar a dívida visual na raiz** — zero cores literais fora de tokens; toda decisão de cor, tipo e espaço vem do design system, tornando a UI auditável e fácil de manter.
3. **Experiência de campo confiável para o catequista** — chamada com alvos de toque generosos, estado offline sempre visível e botões que explicam o que falta, seguindo as regras inegociáveis do design.
4. **Coordenação mais produtiva** — admin com navegação lateral organizada, revisão de inscrições em fluxo dedicado, calendário e relatórios visuais em vez de listas e contagens secas.
5. **Porta de entrada acolhedora** — inscrição pública em etapas curtas, menos intimidadora para pais e responsáveis do que o formulário único atual.

**Prazo:** sem data rígida — qualidade acima de velocidade; cada fase abre quando a anterior fechar.

## User Stories

**Catequista**

- Como catequista, quero fazer a chamada com botões grandes e claros de presente/ausente, para marcar rápido mesmo com o celular na mão e crianças ao redor.
- Como catequista, quero ver o quanto falta para concluir a chamada (e o botão me dizer "Faltam 4"), para nunca enviar uma lista incompleta sem perceber.
- Como catequista, quero ver sempre se estou online ou offline e o que ainda não sincronizou, para confiar que nenhuma chamada se perde na sala sem sinal.

**Coordenação**

- Como coordenadora, quero navegar os módulos do admin por uma barra lateral organizada com aviso de pendências, para saber de relance o que precisa da minha atenção.
- Como coordenadora, quero revisar cada inscrição num painel dedicado com os dados organizados e aprovar/rejeitar dali mesmo, para processar a fila com menos cliques e menos erros.
- Como coordenadora, quero ver o calendário do ano catequético com os dias santos destacados e os relatórios como gráficos, para enxergar o ano e a frequência sem decifrar listas de datas e números.

**Pais e responsáveis**

- Como responsável, quero inscrever meu filho num formulário dividido em etapas curtas com progresso visível, para não desistir diante de um formulário longo no celular.

**Todos**

- Como usuário, quero reconhecer a marca da catequese (brasão, cores) na tela de entrada, no ícone do app e em cada página, para sentir que estou num lugar oficial e cuidado.

## Core Features

**Fundação visual e marca**

- Toda a aplicação passa a usar a paleta, tipografia, espaçamento e movimento do design system — nenhuma cor fora dos tokens.
- Identidade completa: brasão e wordmark nas telas, favicon, ícones do app (incluindo instalação como PWA) e cores de tema do sistema operacional.
- Biblioteca de componentes consistente (botões, chips, campos, linhas de chamada, métricas, navegação, drawer) usada por todas as telas — fim dos botões e campos improvisados.

**Autenticação**

- Login e troca de senha no novo shell de entrada, com painel institucional (brasão sobre fundo escuro) ao lado do formulário.
- Regras de senha validadas ao vivo durante a digitação no primeiro acesso.

**Área do catequista**

- Dashboard com cartões de turma, medidores de presença e chip permanente de estado de rede.
- Folha de chamada com linhas de toque generosas, busca de aluno, marcar-todos, trilho de progresso, contagens honestas e botão de confirmação que informa quantos faltam; aviso visível de chamadas aguardando sincronização.

**Inscrição pública**

- Formulário em etapas curtas com indicador de progresso e campos de escolha em blocos tocáveis; mesmos dados coletados hoje, sem burocracia nova.

**Console da coordenação**

- Barra lateral com módulos agrupados e selo de pendências.
- Revisão de inscrições em drawer dedicado com dados organizados e ações de aprovar/rejeitar (rejeição exige motivo).
- Calendário do ano com dias santos em dourado litúrgico, substituindo a lista de datas.
- Relatórios com gráficos de barras e cartões de estatística em vez de contagens em texto.
- Tabelas padronizadas com filtros nos módulos de anos, turmas, alunos e catequistas.

**Em toda parte**

- Estados vazios que dizem o próximo passo em vez de mensagens secas.
- Todos os números comparáveis em fonte tabular, alvos de toque de 44px, foco visível e respeito a preferência de movimento reduzido.

## User Experience

**Os fluxos não mudam — o visual sim.** Quem aprendeu o caminho (entrar → escolher turma → fazer chamada → confirmar) percorre exatamente os mesmos passos; a iniciativa troca a roupa, não o mapa. A única exceção deliberada é a inscrição pública, que passa de formulário único para etapas — uma melhoria de primeiro contato, não um novo processo.

**Uma ação primária por tela.** Cada tela tem um único botão em teal dizendo o que fazer agora; ações secundárias ficam visualmente subordinadas. Botão desabilitado sempre explica o motivo.

**Honestidade de estado.** A interface nunca esconde a realidade: chip de rede permanente, fila de sincronização visível com ação de sincronizar, contagens de presença que refletem exatamente o que foi marcado, e estados vazios que orientam ("Nenhuma turma ainda — fale com a coordenação") em vez de becos sem saída.

**Voz em português claro e pastoral.** Textos curtos, diretos e respeitosos, no tom já definido pelo design system — sem jargão técnico para catequistas e famílias.

**Confortável na mão e acessível.** Pensado primeiro para o celular do catequista em campo: alvos de 44px, contraste garantido pela paleta, foco visível para teclado, movimento reduzido respeitado, e o dourado litúrgico usado só como sinal — nunca competindo com a ação principal.

## High-Level Technical Constraints

- O design system em `design/` é a fonte da verdade de **especificação**: os arquivos de referência definem comportamento e aparência, e a implementação final é adaptada ao stack existente do projeto (regra já registrada no `AGENTS.md` — não importar a folha de referência crua).
- As sete regras inegociáveis do `AGENTS.md`/`DESIGN.md` §9 valem como requisito de produto (zero cor literal, um único teal para ação/presença, serifa só na marca, um primário por tela com desabilitado explicado, 44px de toque, números tabulares, offline visível).
- A capacidade offline existente da chamada (registrar sem sinal e sincronizar depois) deve permanecer intacta em todas as fases.
- Interface inteira em português (pt-BR), tom pastoral definido no design system.
- Funciona como PWA instalável com a identidade nova (ícones, cores de tema, atalhos de "Fazer chamada" e "Inscrição").

## Non-Goals (Out of Scope)

- **Nenhuma funcionalidade de negócio nova** além das superfícies definidas no design system — sem novos módulos, relatórios inéditos, permissões ou fluxos que o design não desenha.
- **Sem mudança de navegação ou arquitetura de informação** fora do que o design define (a estrutura de rotas e papéis permanece).
- **Sem tema escuro** — o design system define uma aparência; modo escuro fica para iniciativa futura se houver demanda.
- **Sem alterações de backend/dados** — a iniciativa é de interface; dados coletados e regras de negócio permanecem os mesmos.
- **Sem comunicação de rebranding a usuários** — não há usuários ainda; materiais de aviso de mudança visual não são necessários.

## Phased Rollout Plan

### Fase 0 — Fundação (MVP da iniciativa)

- Tokens do design system viram o tema da aplicação (a paleta âmbar/creme desaparece de uma vez).
- Marca completa aplicada: brasão, favicon, ícones de app, manifest com atalhos.
- Biblioteca de componentes-âncora construída e conferida contra as telas de referência do design.
- **Critério de saída:** nenhuma cor literal fora dos tokens no tema e nos componentes; componentes visualmente fiéis às referências (`design/ui_kits/app/*.html`).

### Onda 1 — Autenticação

- Login e troca de senha no shell institucional, com regras de senha ao vivo.
- A menor área — valida a fundação em telas reais antes das áreas críticas.
- **Critério de saída:** checklist do `design/SKILL.md` + fluxos de login/troca de senha funcionando como antes.

### Onda 2 — Catequista

- Dashboard e folha de chamada completos: chip de rede, trilho de progresso, "Faltam N", fila de sincronização visível.
- O coração do produto, feito com a fundação já validada.
- **Critério de saída:** checklist do `design/SKILL.md` + chamada online e offline (com sincronização posterior) funcionando como antes.

### Onda 3 — Inscrição pública

- Formulário em etapas com stepper e campos de escolha em blocos.
- **Critério de saída:** checklist do `design/SKILL.md` + inscrição coletando os mesmos dados de hoje, envio de ponta a ponta funcionando.

### Onda 4 — Admin

- Sidebar agrupada com pendências, tabelas padronizadas, drawer de revisão, calendário litúrgico, relatórios com gráficos.
- A maior onda, por último — se beneficia de tudo que as anteriores estabilizaram.
- **Critério de saída:** checklist do `design/SKILL.md` + todos os módulos do admin funcionando; aprovar/rejeitar inscrição pelo drawer de ponta a ponta.

## Success Metrics

**Fidelidade ao design (auditável)**

- 100% das telas passam na checklist do `design/SKILL.md`.
- Zero cores literais (hex/rgb soltos) fora da camada de tokens — verificável por busca automática no código.
- Zero ocorrências dos anti-padrões listados no design (serifa em título, dourado como botão, mais de um primário por tela, desabilitado mudo).

**Paridade funcional (nada regride)**

- Todos os fluxos de hoje funcionam igual após cada onda: login, troca de senha, chamada com confirmação, chamada offline com sincronização posterior, inscrição enviada com sucesso, todos os módulos do admin.
- A inscrição em etapas coleta exatamente os mesmos dados do formulário atual, com envio funcionando de ponta a ponta.

**Marca completa**

- Ícone, favicon, cor de tema e tela de instalação exibem o brasão e as cores novas em pelo menos um Android e um desktop.
- Nenhum vestígio da paleta âmbar/creme ou do ícone provisório em qualquer superfície.

**Superfícies novas em uso real**

- Revisão de inscrições acontece pelo drawer (aprovar e rejeitar com motivo funcionando).
- Calendário visual e gráficos de relatórios exibindo dados reais do sistema.
- Baseline visual registrado: capturas de tela de todas as telas ao fechar cada onda, servindo de referência contra regressões futuras.

## Risks and Mitigations

- **Deriva em relação ao design ao adaptar as referências** — o resultado "quase igual" corrói a coerência que justifica a iniciativa. *Mitigação:* as telas de referência (`design/ui_kits/app/*.html`) e a folha `catequese-ds.css` servem de oráculo visual; conferência lado a lado ao fechar cada onda, com a checklist do `SKILL.md` como critério objetivo.
- **Fundação mal calibrada contamina as ondas** — componentes-âncora imprecisos forçariam retoques em cadeia. *Mitigação:* Fase 0 só fecha após validar os componentes contra as referências; Onda 1 (a menor área) atua como piloto antes das áreas críticas.
- **Escopo crescer durante as ondas** ("já que estamos mexendo, vamos adicionar…"). *Mitigação:* Non-Goals explícitos; qualquer funcionalidade fora do que o design define vira iniciativa separada.
- **Iniciativa longa sem prazo perder tração** — sem data-alvo, as últimas ondas podem se arrastar. *Mitigação:* ondas pequenas com critério de saída objetivo e valor entregue a cada fechamento; o lançamento do produto é o incentivo natural de conclusão.

## Architecture Decision Records

- [ADR-001: Aplicar o design system via fundação + ondas verticais](adrs/adr-001.md) — Fase 0 de tokens/marca/componentes seguida de quatro ondas verticais por área (auth → catequista → inscrição → admin), cada onda entregando telas completas que passam na checklist do design; rejeitados big-bang total e "reskin primeiro, superfícies depois".

## Open Questions

- **Conteúdo dos relatórios gráficos:** o design define barras e cartões de estatística; quais recortes exatos (por turma, por período, por aluno) a coordenação quer ver primeiro pode ser refinado na Onda 4 com feedback real.
- **Dias santos do calendário:** a fonte da lista de dias litúrgicos destacados (fixa por ano? cadastrada pela coordenação?) precisa ser confirmada antes da Onda 4.
- **Baseline visual:** definir quem guarda e onde ficam as capturas de tela de referência ao fechar cada onda (sugerido: junto da documentação do projeto).
