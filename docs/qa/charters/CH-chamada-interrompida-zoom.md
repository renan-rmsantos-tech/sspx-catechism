# CH-chamada-interrompida-zoom: Seu Joaquim, zoom em 150%, faz a chamada enquanto o pátio o interrompe — o app espera por ele

```yaml
charter:
  id: CH-chamada-interrompida-zoom
  mission: "Provar que a chamada respeita o ritmo de um catequista de 68 anos com fonte ampliada: interrupções não perdem marcações, alvos continuam tocáveis e todo botão mudo diz seu motivo."
  mode: charter-with-tour
  persona:
    name: Joaquim
    device: phone-large
    network: 4g
    locale: pt-BR
  journey: J-fazer-chamada-offline
  scenarios: [CHM-confirmar-diz-motivo, CHM-chamada-zoom-ampliado, CHM-dia-sem-aula]
  tour: Interrupt Tour
  time_box_minutes: 60
  guidance:
    must_try:
      - "Bloquear o celular por 5 minutos no meio da chamada; trocar para o WhatsApp e voltar — as marcações estão lá? A tela voltou ao mesmo lugar?"
      - "Zoom do sistema em 150% e 200%: a barra fixa de confirmação cobre a lista? O chip de rede some? Alvos de toque das linhas seguem ≥44px?"
      - "Com metade da turma marcada, ler o botão de confirmar em voz alta — ele diz 'Faltam N' ou é um cinza mudo?"
      - "Filtrar pela busca e usar 'Marcar todos presentes' — só os visíveis? Os contadores contam a turma toda?"
      - "Abrir a chamada num dia sem aula e ler o que a tela explica."
    must_avoid:
      - "Testes de rede além do 4G normal — a rede instável é território do CH-chamada-offline-rede-instavel."
```

<!-- The charter is durable and immutable: re-run it in later cycles; each run's debrief goes in that run's report (Session Debriefs), never here. -->
