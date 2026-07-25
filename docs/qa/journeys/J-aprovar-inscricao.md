# J-aprovar-inscricao — Revisar a fila e materializar o aluno

```mermaid
flowchart TD
    A[Entrada: /admin/inscricoes, badge de pendentes no menu] --> B[Filtra Pendentes ou busca pelo nome]
    B --> C[Clica no nome — drawer com os dados da familia]
    C --> D{Decisao}
    D -->|Aprovar| E[Escolhe a turma + opcional aluno existente para renovacao]
    E --> F[Confirma aprovacao]
    F -->|ja processada em outra aba — 409| F2[Aviso 'ja foi processada' e fila atualizada, sem estado fantasma]
    F --> G[Efeito: aluno criado na turma, ou existente atualizado e transferido]
    D -->|Rejeitar| H[Motivo obrigatorio habilita o botao]
    H --> I[Inscricao Rejeitada — estado terminal com motivo guardado]
    G --> J[Badge de pendentes decrementa]
    J --> K[Fim verdadeiro: aluno listado na folha de chamada do catequista e na busca de /admin/alunos]
    C -.->|duvida, liga para a familia| X1[Abandono: fecha o drawer — inscricao segue Pendente intacta]
```

```yaml
journey:
  id: J-aprovar-inscricao
  name: Aprovar (ou rejeitar) inscrições da fila
  value_statement: "Cada inscrição vira um aluno na turma certa — ou uma rejeição com motivo — sem duplicar cadastros nem perder ninguém na fila."
  personas: [Anselmo]
  entry_points:
    - url: /admin/inscricoes
      origin: in-app-nav
  actions:
    - step: 1
      verb: Abre a fila pelos Pendentes (badge no menu)
      expected_observable: Lista filtrada por status, busca por nome funciona
    - step: 2
      verb: Abre o drawer de uma inscrição
      expected_observable: Todos os dados enviados pela família, legíveis
    - step: 3
      verb: Aprova escolhendo turma (e aluno existente, se renovação)
      expected_observable: Confirmação; a inscrição sai dos Pendentes
    - step: 4
      verb: Rejeita outra com motivo
      expected_observable: Botão de rejeitar só habilita com motivo preenchido
  goal:
    observable: Inscrição processada (aprovada ou rejeitada) e fila atualizada
    side_effects: [record-created]
  true_end_state: Aluno aprovado aparece na folha de chamada do catequista da turma escolhida e na busca de alunos; rejeitada guarda o motivo; estados são terminais (retentativa → aviso 409).
  exit:
    natural: Fila de pendentes zerada ou reduzida; badge reflete
  abandonment:
    - at_step: 2
      how: Fecha o drawer para confirmar um dado por telefone
      resume: Inscrição continua Pendente com os dados intactos
  crosses: [fila do coordenador → transação de aprovação (FOR UPDATE) → cadastro de alunos → dashboard do catequista]
```
