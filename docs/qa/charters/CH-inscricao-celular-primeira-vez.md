# CH-inscricao-celular-primeira-vez: Uma mãe que nunca viu o sistema inscreve o filho pelo celular — mesmo voltando, recuando e errando

```yaml
charter:
  id: CH-inscricao-celular-primeira-vez
  mission: "Provar que o wizard público de 4 passos não perde dados nem gera envio duplicado sob o uso real de celular: botão voltar, refresh, interrupções e erros de digitação."
  mode: charter-with-tour
  persona:
    name: Marta
    device: phone-small
    network: 4g
    locale: pt-BR
  journey: J-inscrever-catequizando
  scenarios: [INS-inscricao-feliz-celular, INS-validacao-preserva-dados, INS-abandono-e-retorno, INS-janela-fechada, INS-sem-ano-ativo]
  tour: Back-Button Tour
  time_box_minutes: 60
  guidance:
    must_try:
      - "Em cada passo, apertar o voltar do NAVEGADOR (não o do stepper), depois avançar de novo — as respostas persistem?"
      - "Refresh no passo de revisão e na tela de sucesso; voltar após o sucesso — reenvia? A tela de sucesso se sustenta?"
      - "Telefone em formatos errados (sem DDD, com traço, colado do WhatsApp) até acertar (11) 99999-9999 — o erro orienta?"
      - "Fechar o navegador no passo 3 e voltar ao link — o fim verdadeiro é conferir na fila do coordenador que existe UMA inscrição, com os dados certos."
    must_avoid:
      - "Rotas autenticadas; Marta não tem conta."
```

<!-- The charter is durable and immutable: re-run it in later cycles; each run's debrief goes in that run's report (Session Debriefs), never here. -->
