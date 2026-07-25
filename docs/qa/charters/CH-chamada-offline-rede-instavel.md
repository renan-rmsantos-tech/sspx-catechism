# CH-chamada-offline-rede-instavel: A chamada de sábado sobrevive à rede do salão paroquial — nada se perde entre o toque e o relatório

```yaml
charter:
  id: CH-chamada-offline-rede-instavel
  mission: "Provar que a chamada feita com rede instável chega intacta ao histórico e ao relatório — e que nenhuma sessão é descartada em silêncio pelo sync."
  mode: charter-with-tour
  persona:
    name: Tereza
    device: phone-large
    network: flaky
    locale: pt-BR
  journey: J-fazer-chamada-offline
  scenarios: [CHM-chamada-feliz-online, CHM-chamada-offline-fila, CHM-sync-perda-silenciosa, CHM-reenvio-mesma-data, CHM-sessao-expira-na-chamada]
  tour: Network Tour
  time_box_minutes: 90
  guidance:
    must_try:
      - "Cortar a rede exatamente entre marcar o último aluno e tocar em Confirmar — o aviso 'salva no aparelho' aparece e o chip conta a pendente?"
      - "Confirmar offline e deixar a rede voltar sozinha (sync automático via window.online) vs. usar o botão Sincronizar agora — os dois zeram a fila?"
      - "Derrubar a rede no meio do POST de sincronização — a fila retém a chamada ou a perde?"
      - "Sincronizar uma chamada cuja data foi removida do calendário (skipped no servidor) — a fila local é limpa mesmo sem gravar? (defeito suspeito, attendance-sync.ts:38-40)"
      - "Reenviar a mesma turma+data já sincronizada e observar o que a catequista entende ter acontecido."
    must_avoid:
      - "Telas de admin — só o que a catequista alcança; o setup do ano/turma acontece antes da sessão."
```

<!-- The charter is durable and immutable: re-run it in later cycles; each run's debrief goes in that run's report (Session Debriefs), never here. -->
