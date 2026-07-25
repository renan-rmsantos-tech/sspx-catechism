# CH-preparar-ano-colando-datas: Montar o ano letivo colando a planilha da secretaria — e não deixar o calendário mentir

```yaml
charter:
  id: CH-preparar-ano-colando-datas
  mission: "Provar que o setup do ano (ano ativo, datas coladas de planilha, turmas e vínculos) sobrevive a colagem suja e estados ambíguos — porque inscrição, chamada e relatório dependem do que se salva aqui."
  mode: charter-with-tour
  persona:
    name: Anselmo
    device: desktop
    network: wifi-fast
    locale: pt-BR
  journey: J-preparar-ano-letivo
  scenarios: [ADM-criar-ano-dias-aula, ADM-colar-datas-calendario, ADM-data-travada-permanece, ADM-criar-turma-vincular-catequista, ADM-dois-anos-ativos, ADM-promovido-some-da-lista, ADM-remocao-bloqueada-protegidos]
  tour: Paste Tour
  time_box_minutes: 90
  guidance:
    must_try:
      - "Colar as datas direto do Excel (tabs, linhas em branco, espaços) e do Word (aspas curvas) — o que salva, o que é recusado, o erro lista as datas?"
      - "Colar datas em formato brasileiro (DD/MM/AAAA) onde se espera ISO — o erro orienta ou só recusa?"
      - "Incluir uma quarta-feira quando só sábado é dia permitido; tentar apagar da textarea uma data travada por chamada — o resto da edição sobrevive à recusa?"
      - "Criar um SEGUNDO ano ativo e observar qual deles rege /inscricao e a fila de revisão (defeito suspeito: nada impede dois ativos)."
      - "Promover uma catequista a Coordenador e procurá-la na lista e nas checkboxes de turma (defeito suspeito: ela some); tentar remover o admin e um catequista com chamadas (409 com aviso claro?)."
    must_avoid:
      - "Fila de inscrições além do necessário para ver qual ano a rege — é o território do CH-revisao-inscricoes-duas-abas."
```

<!-- The charter is durable and immutable: re-run it in later cycles; each run's debrief goes in that run's report (Session Debriefs), never here. -->
