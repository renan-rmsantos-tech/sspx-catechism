# J-inscrever-catequizando — Inscrever o catequizando pelo formulário público

```mermaid
flowchart TD
    A[Entrada: link /inscricao do boletim ou WhatsApp da paroquia] --> B[Passo 1: dados do catequizando]
    B -->|campo invalido| B2[Erro inline, campos preservados, passo nao avanca]
    B2 --> B
    B --> C[Passo 2: vida pastoral]
    C --> D[Passo 3: responsavel — telefone e e-mail obrigatorios]
    D -->|telefone fora de 11 99999-9999| D2[Erro inline apontando o campo]
    D2 --> D
    D --> E[Passo 4: revisao dos dados]
    E --> F[Enviar inscricao]
    F -->|janela fechada ou nao configurada — 400| F2[Aviso claro: inscricoes encerradas]
    F -->|sem ano letivo ativo — 404| F3[Aviso honesto: inscricoes indisponiveis]
    F --> G[Tela de sucesso]
    G --> H[Efeito: inscricao Pendente na fila do coordenador, badge no menu]
    H --> I[Fim verdadeiro: coordenador abre a inscricao e ve exatamente os dados enviados]
    C -.->|crianca chora, fecha o navegador| X1[Abandono: volta horas depois — retoma ou recomeca com clareza, nunca envia duplicado]
```

```yaml
journey:
  id: J-inscrever-catequizando
  name: Inscrever o catequizando na catequese
  value_statement: "A família matricula a criança sem ir à secretaria — e a paróquia recebe os dados completos e legíveis."
  personas: [Marta]
  entry_points:
    - url: /inscricao
      origin: external-share
  actions:
    - step: 1
      verb: Preenche os dados do catequizando (nome, nascimento)
      expected_observable: Stepper marca o passo 1; erros aparecem inline sem apagar o que foi digitado
    - step: 2
      verb: Responde a vida pastoral (catecismo anterior, sacramentos)
      expected_observable: Avança ao passo seguinte mantendo as respostas
    - step: 3
      verb: Informa o responsável (telefone no formato (11) 99999-9999, e-mail)
      expected_observable: Máscara/validação do telefone orienta em vez de só recusar
    - step: 4
      verb: Revisa tudo e envia
      expected_observable: Tela de sucesso em até 3s, sem dúvida se enviou
  goal:
    observable: Tela de sucesso confirmando a inscrição recebida
    side_effects: [record-created]
  true_end_state: A inscrição aparece como Pendente em /admin/inscricoes com todos os dados enviados; o badge de pendentes do coordenador incrementa.
  exit:
    natural: Tela de sucesso; a família fecha o navegador tranquila
  abandonment:
    - at_step: 2
      how: Interrompida pelos filhos, fecha o navegador no meio
      resume: Ao voltar, entende onde está — dados persistidos ou recomeço claro; nunca envio duplicado
  crosses: [formulário público sem auth → API de inscrição → fila do coordenador (ano ativo resolvido no servidor)]
```
