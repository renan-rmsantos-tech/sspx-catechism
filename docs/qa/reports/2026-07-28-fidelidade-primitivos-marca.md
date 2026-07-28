# Conferência visual — primitivos e marca

- Data: 2026-07-28
- Escopo: acesso, troca de senha, painel do catequista, folha de chamada, inscrição pública e `/admin/{anos,calendario,turmas,alunos,catequistas,inscricoes,relatorios}`.
- Referências abertas lado a lado: `design/preview/index.html`, fichas de marca, botões, dados, formulários e layout; regras em `design/SKILL.md` §9 e `design/DESIGN.md` §§5–7.
- Evidência: `docs/visual-baseline/fase-4-primitivos/` em 390×844 e 1280×800. A captura offline é complementar à folha de chamada.

## Veredito

**Aprovado.** A comparação é humana, conforme ADR-007; não há diff automático de imagem.

| Checklist `design/SKILL.md` | Acesso / senha | Painel / chamada | Inscrição | Admin (7 rotas) |
| --- | --- | --- | --- | --- |
| Zero hex ou cor crua fora de `:root` | ✓ | ✓ | ✓ | ✓ |
| Uma ação primária; desabilitado explica | ✓ | ✓ (`Faltam N`) | ✓ | ✓ |
| Números comparáveis em mono tabular | n/a | ✓ | ✓ | ✓ |
| `--font-logo` somente na wordmark | ✓ | ✓ | ✓ | ✓ |
| Controles catequista/público com ≥44px | ✓ | ✓ | ✓ | n/a (admin de mesa) |
| Rede visível onde há gravação | n/a | ✓ | ✓ | ✓ |
| Estado em chip, não card preenchido | ✓ | ✓ | ✓ | ✓ |
| Vazio explica próximo passo | ✓ | ✓ | ✓ | ✓ |
| `data-od-id` em regiões, títulos, CTAs e cards repetidos | ✓ | ✓ | ✓ | ✓ |

## Pontos específicos desta fase

- Botões afundam 1px em 60ms ao pressionar; o estado desabilitado não se move.
- O stepper usa quatro trilhos iguais e legenda mono; abaixo de 720px a legenda some e os trilhos continuam visíveis.
- A folha de chamada mostra lavagem de 5% em presente e 4% em ausente, preservando a leitura de lista.
- O brasão é SVG inline com `currentColor`, campo via `--mk-field` e filete dourado; em fundo de tinta a variante troca os tokens sem filtro CSS. A forma favicon é usada somente abaixo de 20px.
- O aside de autenticação aplica o gradiente tokenizado de 165°; `.dot-grid` não foi introduzido.
- As sete capturas administrativas mostram conteúdo das fixtures, sem banner de erro.

## Conferência por viewport

| Superfície | Telefone | Desktop |
| --- | --- | --- |
| Acesso | ✓ | ✓ |
| Troca de senha | ✓ | ✓ |
| Painel | ✓ | ✓ |
| Chamada | ✓ | ✓ |
| Inscrição | ✓ | ✓ |
| Anos | ✓ | ✓ |
| Calendário | ✓ | ✓ |
| Turmas | ✓ | ✓ |
| Alunos | ✓ | ✓ |
| Catequistas | ✓ | ✓ |
| Inscrições | ✓ | ✓ |
| Relatórios | ✓ | ✓ |

## Evidência técnica

- Captura: `BASELINE_URL=http://localhost:5174 npm run capture-baseline -- fase-4-primitivos` — 26 PNGs (24 das 12 superfícies e 2 adicionais do fluxo offline).
- Contratos dos primitivos e inscrição: 21 testes verdes.
- A porta de fidelidade permanece com 5 de 5 regras em `block`.
