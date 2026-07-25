# J-preparar-ano-letivo — Montar o ano: ano ativo, calendário, turmas

```mermaid
flowchart TD
    A[Entrada: /admin/anos] --> B[Cria o ano: Ativo, dias de aula Dom-Sab, janela de inscricao]
    B -->|fim da janela <= inicio| B2[Erro claro na criacao]
    B -->|segundo ano tambem Ativo| B3[RISCO: nada impede dois anos ativos — qual rege /inscricao?]
    B --> C[/admin/calendario: escolhe o ano]
    C --> D[Cola as datas de aula, uma por linha, vindas de planilha]
    D -->|data fora dos dias permitidos — 400| D2[Erro lista exatamente as datas rejeitadas]
    D -->|tenta remover data travada por chamada — 400| D3[Erro diz qual data e por que nao sai]
    D --> E[Salva; grid de 12 meses reflete as datas]
    E --> F[/admin/turmas: cria turma com checkboxes de catequistas]
    F -->|catequista promovida a coordenador| F2[RISCO: some da lista e das checkboxes]
    F --> G[Efeitos: turma no dashboard da catequista; janela abre o formulario publico]
    G --> H[Fim verdadeiro: catequista ve a turma ao logar e a familia consegue inscrever em /inscricao]
    D -.->|interrompido no meio da colagem| X1[Abandono: sai sem salvar — nada e gravado pela metade e isso fica claro]
```

```yaml
journey:
  id: J-preparar-ano-letivo
  name: Preparar o ano letivo completo
  value_statement: "O ano montado uma vez — ano ativo, calendário, turmas, vínculos — faz todo o resto do produto funcionar: inscrição, chamada e relatório dependem daqui."
  personas: [Anselmo]
  entry_points:
    - url: /admin/anos
      origin: in-app-nav
  actions:
    - step: 1
      verb: Cria o ano letivo ativo com dias de aula e janela de inscrição
      expected_observable: Ano na tabela com badge de ativo; validações claras
    - step: 2
      verb: Cola o calendário de datas (uma por linha) e salva
      expected_observable: Grid de 12 meses reflete; datas inválidas são recusadas com lista exata
    - step: 3
      verb: Cria a turma e marca as catequistas
      expected_observable: Turma listada com ano, nível e catequistas
    - step: 4
      verb: Confere o efeito nas outras pontas
      expected_observable: Catequista vê a turma no /dashboard; /inscricao aceita inscrições na janela
  goal:
    observable: Ano ativo com calendário salvo e turma vinculada
    side_effects: [record-created]
  true_end_state: A catequista vinculada vê a turma ao logar; o formulário público aceita inscrição dentro da janela; datas com chamada ficam travadas contra remoção.
  exit:
    natural: Painel refletindo o ano pronto
  abandonment:
    - at_step: 2
      how: Interrompido no meio da colagem das datas; sai da tela sem salvar
      resume: Nada gravado pela metade; ao voltar, o estado anterior está íntegro e o recomeço é claro
  crosses: [anos letivos → trigger de validação de datas no Postgres → turmas/vínculos → dashboard do catequista → formulário público]
```
