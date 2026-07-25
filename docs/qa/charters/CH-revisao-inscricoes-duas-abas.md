# CH-revisao-inscricoes-duas-abas: O coordenador processa a fila em duas abas sem estados fantasma nem aluno duplicado

```yaml
charter:
  id: CH-revisao-inscricoes-duas-abas
  mission: "Provar que a fila de revisão aguenta o jeito power-user de trabalhar — várias abas, filtros, busca — e que decisões concorrentes terminam em aviso claro, nunca em aluno duplicado."
  mode: charter-with-tour
  persona:
    name: Anselmo
    device: desktop
    network: wifi-fast
    locale: pt-BR
  journey: J-aprovar-inscricao
  scenarios: [INS-aprovar-cria-aluno, INS-aprovar-renovacao-transfere, INS-rejeitar-motivo-obrigatorio, INS-revisao-dupla-conflito]
  tour: Multi-Tab Tour
  time_box_minutes: 60
  guidance:
    must_try:
      - "Abrir a MESMA inscrição em duas abas: aprovar numa, rejeitar na outra — a segunda recebe '409 já foi processada' compreensível e a fila se atualiza?"
      - "Aprovar como renovação (aluno existente) e conferir a transferência de turma sem cadastro duplicado na busca de alunos."
      - "Badge de pendentes no menu após cada decisão, em ambas as abas."
      - "Rejeitar sem motivo (botão deve explicar) e depois com motivo; conferir o motivo no filtro de Rejeitadas."
      - "Fim verdadeiro: o aluno aprovado aparece na folha de chamada do catequista da turma."
    must_avoid:
      - "Editar alunos direto em /admin/alunos — fica para a jornada de preparação do ano."
```

<!-- The charter is durable and immutable: re-run it in later cycles; each run's debrief goes in that run's report (Session Debriefs), never here. -->
