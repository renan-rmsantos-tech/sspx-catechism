# PRD: Formulário Público de Inscrição na Catequese

## Overview

O **Inscrição Catequese** é um formulário público acessível em `/inscricao` que permite pais ou responsáveis inscreverem seus filhos na catequese da paróquia, tanto para primeira matrícula quanto para renovação. O formulário funciona dentro de um período definido pelo coordenador (datas de abertura e fechamento configuradas no ano letivo). Fora do período, a página exibe uma mensagem informando que as inscrições estão encerradas. Após o envio, o pai vê uma mensagem de confirmação na tela. O coordenador revisa cada inscrição no painel admin, podendo aprovar (atribuindo turma) ou rejeitar.

**Para quem:** pais e responsáveis de catequizandos (lado público) e coordenadores de catequese (lado admin).

**Por que é valioso:** elimina o processo manual onde o coordenador cadastra cada aluno individualmente, digitaliza a ficha de inscrição e organiza a revisão num fluxo claro de aprovação com atribuição de turma.

---

## Goals

1. **Digitalizar a inscrição** — Eliminar o processo manual onde o coordenador cadastra cada aluno individualmente, permitindo que os pais façam a inscrição diretamente.
2. **Controlar o período de inscrição** — Permitir que o coordenador defina datas de abertura/fechamento automáticas, sem precisar ligar/desligar manualmente.
3. **Organizar a revisão** — Dar ao coordenador uma fila clara de inscrições pendentes para aprovar ou rejeitar, com atribuição de turma na aprovação.
4. **Suportar novos e renovações** — Atender ambos os cenários num único fluxo, com indicação de alunos que já frequentaram.

**Fora de escopo (MVP):**
- Email de confirmação ou notificação automática
- Consulta de status pelo pai (protocolo)
- Upload de documentos (certidão de batismo etc.)
- Pagamento de taxa de matrícula

---

## User Stories

### Pai/Responsável

- Como pai, quero acessar um formulário público para inscrever meu filho na catequese sem precisar criar conta.
- Como pai de aluno que já frequenta, quero indicar que é renovação para que o coordenador saiba que meu filho já é aluno.
- Como pai, quero ver uma mensagem de confirmação após enviar a inscrição para saber que deu certo.
- Como pai, quero ver uma mensagem clara caso o período de inscrições esteja encerrado.

### Coordenador/Admin

- Como coordenador, quero definir as datas de abertura e fechamento das inscrições no ano letivo.
- Como coordenador, quero ver uma lista de todas as inscrições pendentes para revisá-las.
- Como coordenador, quero aprovar uma inscrição e atribuir a turma ao mesmo tempo.
- Como coordenador, quero rejeitar uma inscrição com a opção de informar o motivo.
- Como coordenador, quero identificar quais inscrições são renovações para vincular ao aluno existente.

---

## Core Features

### F1 — Formulário Público de Inscrição (`/inscricao`)

Página pública sem autenticação. Campos coletados:

**Dados do Catequizando:**
- Nome completo
- Data de nascimento
- Cidade
- Já fez a Primeira Comunhão? (Sim/Não)
- Já recebeu o Crisma? (Sim/Não)
- Já fez catequese anteriormente? (Sim/Não — texto livre)
- Já leu algum livro de religião? Qual? (texto livre)

**Dados do Responsável:**
- Nome do pai
- Nome da mãe
- Telefone do responsável
- Email de contato

**Renovação:**
- Já frequentou a catequese aqui? (Sim/Não)
- Se sim: nome como estava cadastrado (campo condicional)

Validação de campos obrigatórios no envio. Mensagem de confirmação após envio bem-sucedido.

### F2 — Controle de Período de Inscrição

- Campos de data de abertura e data de fechamento no cadastro do ano letivo (painel admin)
- Fora do período: página `/inscricao` exibe mensagem informando que inscrições estão encerradas, sem mostrar o formulário

### F3 — Gestão de Inscrições no Painel Admin

- Nova seção no admin: lista de inscrições com filtros por status (pendente/aprovada/rejeitada)
- Indicação visual de quais são renovações
- Ação de aprovar: abre seletor de turma, ao confirmar cria o aluno na turma (ou vincula ao existente no caso de renovação)
- Ação de rejeitar: marca como rejeitada (motivo opcional)
- Contadores de inscrições por status no topo da lista

---

## User Experience

### Fluxo do Pai

1. Acessa `/inscricao` — vê o nome da paróquia e o formulário (ou mensagem de "inscrições encerradas" se fora do período)
2. Preenche os dados do filho e do responsável
3. Se marca "já frequentou a catequese aqui", aparece campo para informar o nome anterior
4. Clica em "Enviar inscrição"
5. Vê tela de confirmação: "Inscrição enviada com sucesso! O coordenador entrará em contato."

### Fluxo do Coordenador

1. No painel admin, acessa "Inscrições" — vê lista com contadores (ex: 12 pendentes, 8 aprovadas, 2 rejeitadas)
2. Filtra por status ou busca por nome
3. Clica numa inscrição pendente — vê todos os dados preenchidos pelo pai
4. Se é renovação, vê a indicação e o nome anterior informado; busca o aluno existente para vincular
5. Clica "Aprovar" — seleciona a turma e confirma. O aluno é criado (ou atualizado) no sistema
6. Ou clica "Rejeitar" — opcionalmente informa motivo

### Considerações de UX

- Formulário em página única (sem steps/wizard) — são poucos campos, não justifica dividir
- Campos agrupados visualmente: "Dados do Catequizando" e "Dados do Responsável"
- Mobile-first — muitos pais acessarão pelo celular
- Feedback imediato de validação nos campos obrigatórios
- Linguagem em português brasileiro, vocabulário paroquial e acolhedor

---

## Phased Rollout Plan

### Fase 1 — MVP

- Formulário público em `/inscricao` com todos os campos definidos
- Controle de período por datas no ano letivo
- Lista de inscrições no admin com aprovar/rejeitar e atribuição de turma
- Suporte a renovações via flag "já frequentou"

**Critérios para próxima fase:**
- >80% das inscrições chegam pelo formulário (não mais cadastro manual)
- Coordenador processa inscrições sem suporte técnico

### Fase 2 — Comunicação

- Email automático de confirmação ao pai após envio
- Notificação ao coordenador quando nova inscrição chega
- Email ao pai quando inscrição é aprovada/rejeitada

### Fase 3 — Autoatendimento

- Número de protocolo para consulta de status
- Página pública de consulta por protocolo + data de nascimento
- Upload de documentos (certidão de batismo)

---

## Success Metrics

1. **Taxa de adoção** — % de inscrições que chegam pelo formulário vs cadastradas manualmente pelo admin (meta: >80% após primeiro ciclo).
2. **Taxa de conclusão do formulário** — % de visitantes de `/inscricao` que completam o envio (meta: >70%).
3. **Tempo de processamento** — tempo médio entre recebimento da inscrição e aprovação/rejeição pelo coordenador (meta: <48h).
4. **Volume de inscrições** — total de inscrições recebidas por período, comparado ao total de alunos do ano anterior.
5. **Renovações identificadas** — % de inscrições marcadas como renovação que o admin conseguiu vincular a alunos existentes.

---

## Risks and Mitigations

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Envios spam ou inválidos por ser formulário público | Média | Validação de campos obrigatórios; possível CAPTCHA em fase futura |
| Pai envia e não sabe se foi aceito | Média | Coordenador comunica por telefone (tem o contato); email na Fase 2 |
| Duplicatas de inscrição (pai envia duas vezes) | Baixa | Admin identifica na lista; alerta visual de possível duplicata por nome similar |
| Renovações não vinculadas ao aluno existente | Média | Busca flexível no painel admin por nome aproximado |
| Dados de menores sem consentimento LGPD | Baixa | Incluir aviso de privacidade no formulário informando finalidade e tratamento dos dados |

---

## Architecture Decision Records

- [ADR-001: Formulário Público Simples sem Autenticação](adrs/adr-001.md) — Formulário público em `/inscricao` sem login do pai; admin revisa e aprova internamente.
- [ADR-002: Formulário Único com Flag de Renovação](adrs/adr-002.md) — Fluxo único para novos e renovações, com campo "já frequentou" e nome anterior para o admin vincular.

---

## Open Questions

- **LGPD:** é necessário checkbox de consentimento explícito no formulário, ou o aviso de privacidade é suficiente?
- **Duplicatas:** deve haver algum controle automático para evitar inscrições duplicadas (ex: mesmo nome + data de nascimento)?
