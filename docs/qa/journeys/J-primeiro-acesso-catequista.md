# J-primeiro-acesso-catequista — Da senha provisória ao dashboard

```mermaid
flowchart TD
    A[Entrada: coordenador em /admin/catequistas] --> B[Cria catequista: nome + e-mail]
    B --> C[Banner com a senha memoravel — exibida UMA unica vez]
    C --> D[Coordenador repassa a senha por WhatsApp]
    D --> E[Catequista abre /login no celular]
    E -->|senha errada 10x no minuto — 429| E2[Aviso claro: aguarde e tente novamente]
    E -->|conta desativada — 403| E3[Aviso de conta inativa com proximo passo, nao 'senha errada']
    E --> F[Login ok: guard forca /trocar-senha e bloqueia toda outra rota]
    F --> G[Checklist viva das 3 regras; botao desabilitado diz Faltam N]
    G -->|senha aceita na tela mas recusada no servidor| G2[RISCO: regras divergem — front exige letra+numero, backend so minimo de 6]
    G --> H[Senha trocada; token reemitido]
    H --> I[Fim verdadeiro: cai no /dashboard e ve exatamente as turmas as quais foi vinculada]
    F -.->|fecha o app sem trocar| X1[Abandono: proximo login exige a troca de novo, sem beco sem saida]
```

```yaml
journey:
  id: J-primeiro-acesso-catequista
  name: Cadastrar catequista e completar o primeiro acesso
  value_statement: "A catequista nova entra sozinha: senha provisória → troca obrigatória → sua turma na tela, sem chamar o coordenador de volta."
  personas: [Camila, Anselmo]
  entry_points:
    - url: /admin/catequistas
      origin: in-app-nav
    - url: /login
      origin: external-share
  actions:
    - step: 1
      verb: Coordenador cria a catequista (nome + e-mail)
      expected_observable: Banner com a senha provisória, avisando que não será mostrada de novo
    - step: 2
      verb: Catequista faz login com a senha recebida
      expected_observable: Redirecionada à força para /trocar-senha; nenhuma outra rota abre
    - step: 3
      verb: Cria a senha definitiva guiada pela checklist
      expected_observable: Checklist reage ao vivo; botão desabilitado diz "Faltam N"
    - step: 4
      verb: Entra no dashboard
      expected_observable: Apenas as turmas às quais foi vinculada; nada de telas de coordenação
  goal:
    observable: Login com a senha nova cai direto no /dashboard
    side_effects: [record-created, token-reemitido]
  true_end_state: A flag de troca obrigatória foi limpa (novo login não força mais /trocar-senha); a senha provisória deixou de valer; o escopo do papel se mantém (rotas /admin redirecionam).
  exit:
    natural: /dashboard com as turmas da catequista
  abandonment:
    - at_step: 3
      how: Fecha o app sem concluir a troca
      resume: Próximo login volta a exigir a troca; a senha provisória segue válida até ser trocada
  crosses: [admin de catequistas → geração de senha no backend → guard de rotas do front → dashboard escopado por vínculo de turma]
```
