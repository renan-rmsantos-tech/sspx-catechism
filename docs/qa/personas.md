# Personas — sspx-catechism

Instâncias deste projeto (metodologia e catálogo-semente: skill `qa-report`, `references/personas.md`). Duráveis: atualizar apenas quando o público do produto mudar.

## Marta — a mãe que inscreve

```yaml
persona:
  name: Marta
  base: New User
  goal: Inscrever o filho na catequese pelo formulário público, no celular, sem ajuda de ninguém
  device: phone-small
  network: 4g
  modality: touch
  locale: pt-BR
  patience_seconds: 60
```

Nunca viu o sistema; chegou pelo link divulgado no boletim ou no grupo de WhatsApp da paróquia. Digita devagar, aceita o autofill do navegador, é interrompida pelos filhos no meio do formulário. Se travar, liga para a secretaria — e a inscrição vira papel de novo.

## Tereza — a catequista de sábado

```yaml
persona:
  name: Tereza
  base: Mobile User
  goal: Fazer a chamada da turma no pátio da igreja, com a rede que houver, e confiar que ela chegou
  device: phone-large
  network: flaky
  modality: touch
  locale: pt-BR
  patience_seconds: 30
```

Usa o app todo sábado, uma mão no celular e a outra organizando as crianças. O salão paroquial tem sinal instável — ela já aprendeu a desconfiar de "salvou?". Se a chamada sumir uma vez, volta para a caderneta de papel.

## Padre Anselmo — o coordenador

```yaml
persona:
  name: Anselmo
  base: Power User
  goal: Montar o ano letivo, processar a fila de inscrições e fechar relatórios sem retrabalho
  device: desktop
  network: wifi-fast
  modality: mouse-keyboard
  locale: pt-BR
  patience_seconds: 120
```

Vive no `/admin`, muitas abas abertas, cola dados de planilhas da secretaria. Conhece cada tela e nota qualquer regressão de fluxo ou de velocidade. Tolera aparência imperfeita; não tolera fila de inscrição travada em pleno período de matrícula.

## Camila — a catequista nova

```yaml
persona:
  name: Camila
  base: New User
  goal: Sair da senha provisória recebida por WhatsApp e chegar à sua turma sem pedir socorro
  device: phone-large
  network: wifi-fast
  modality: touch
  locale: pt-BR
  patience_seconds: 45
```

Acabou de ser cadastrada pelo coordenador; recebeu `graca-luz-altar-42` por mensagem. Primeiro login, troca forçada de senha, primeira vista do dashboard. Se o primeiro acesso tiver beco sem saída, quem resolve é o coordenador — multiplicando o custo de cada defeito aqui.

## Seu Joaquim — o catequista veterano

```yaml
persona:
  name: Joaquim
  base: Accessibility-Reliant
  goal: Fazer a chamada no seu ritmo, com a fonte ampliada, sem que nada suma ou mude de lugar
  device: phone-large
  network: 4g
  modality: touch
  locale: pt-BR
  patience_seconds: 90
```

68 anos, 20 de catequese, zoom do sistema em 150%. Navega devagar e com pausas longas — o pátio o interrompe a cada minuto. Alvos pequenos, texto que some atrás de barras fixas e botões mudos ("por que não posso confirmar?") o fazem desistir e ditar a chamada para um colega mais novo.
