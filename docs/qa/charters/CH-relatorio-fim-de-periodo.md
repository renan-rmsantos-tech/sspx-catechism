# CH-relatorio-fim-de-periodo: Os números que o coordenador apresenta à paróquia batem com as chamadas feitas

```yaml
charter:
  id: CH-relatorio-fim-de-periodo
  mission: "Provar que prévia, PDF e XLSX contam a mesma história — a das chamadas realmente sincronizadas — e que períodos errados ou vazios terminam em aviso, não em tela quebrada."
  mode: charter-with-tour
  persona:
    name: Anselmo
    device: desktop
    network: wifi-fast
    locale: pt-BR
  journey: J-emitir-relatorio
  scenarios: [REL-previa-e-download, REL-periodo-invalido-claro, REL-turma-sem-registros]
  tour: Feature Tour
  time_box_minutes: 30
  guidance:
    must_try:
      - "Comparar os totais da prévia com o PDF e o XLSX do mesmo período — e com as sessões visíveis no histórico de chamadas."
      - "Período com De depois de Até; De igual a Até (deve valer um dia); período futuro sem nenhuma chamada."
      - "Conferir o nome do arquivo baixado (relatorio-<de>-<até>) e se ele abre fora do navegador."
    must_avoid:
      - "Criar dados novos durante a sessão — usar as chamadas produzidas pelos charters de chamada."
```

<!-- The charter is durable and immutable: re-run it in later cycles; each run's debrief goes in that run's report (Session Debriefs), never here. -->
