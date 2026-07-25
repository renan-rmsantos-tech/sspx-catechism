# CH-primeiro-acesso-senha-provisoria: Da senha "graca-luz-altar-42" recebida por WhatsApp ao dashboard, sem beco sem saída

```yaml
charter:
  id: CH-primeiro-acesso-senha-provisoria
  mission: "Provar que o primeiro acesso da catequista nova — senha provisória, troca forçada, gerenciador de senhas se metendo — termina no dashboard certo, e que as regras de senha da tela são as mesmas do servidor."
  mode: charter-with-tour
  persona:
    name: Camila
    device: phone-large
    network: wifi-fast
    locale: pt-BR
  journey: J-primeiro-acesso-catequista
  scenarios: [AUTH-troca-forcada-primeiro-login, AUTH-regras-senha-divergentes, AUTH-usuario-inativo-bloqueado, AUTH-limite-tentativas-login, AUTH-senha-inicial-uma-vez]
  tour: Autofill Tour
  time_box_minutes: 60
  guidance:
    must_try:
      - "Deixar o gerenciador de senhas salvar a provisória no login e observar o que ele preenche (e sugere) na troca forçada — campo trocado, dupla-preenchida?"
      - "Testar a divergência: senha '123456' (recusada pela checklist, aceita pelo backend?) e observar as duas direções da regra."
      - "Navegar direto para /dashboard e /admin antes de trocar a senha — o guard segura tudo?"
      - "Errar a senha 10x no minuto e ler o aviso (429 ≠ 'senha errada'); logar com conta desativada e ler o aviso (403)."
      - "Setup como Anselmo no início: criar a Camila e verificar que a senha do banner só aparece UMA vez (settla AUTH-senha-inicial-uma-vez; registrar a troca de persona no debrief)."
    must_avoid:
      - "Fluxos de turma/chamada além de conferir que o dashboard mostra só as turmas vinculadas."
```

<!-- The charter is durable and immutable: re-run it in later cycles; each run's debrief goes in that run's report (Session Debriefs), never here. -->
