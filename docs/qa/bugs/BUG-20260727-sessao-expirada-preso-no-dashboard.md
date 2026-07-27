# BUG-20260727-sessao-expirada-preso-no-dashboard: Depois que a sessão expira, "Entre novamente" devolve ao dashboard quebrado

- **Status:** verified
- **Impact (user-side):** Friction
- **Severity:** Medium · **Priority:** P1
- **Persona Affected:** Tereza
- **Journey Step:** J-fazer-chamada-offline, step 3-4 (recuperação após sessão expirada)
- **Scenarios:** CHM-sessao-expira-na-chamada
- **Found:** 2026-07-27 · **Report:** ../reports/2026-07-27-fixes-decisoes.md

## Summary

Com a sessão expirada, a chamada é guardada e a tela orienta "Entre novamente" (fix de [[BUG-20260724-sessao-expirada-sem-caminho]]) — mas o link não chega ao login: o app ainda se considera autenticado, o guard trata `/login` como rota de quem já entrou e devolve a catequista ao `/dashboard`, que aparece com o erro cru "não autenticado" e a fila parada. Ela fica dando voltas até descobrir sozinha que recarregar a página resolve. A promessa da mensagem não se cumpre no clique seguinte.

Depois do reload + login, a fila sincroniza sozinha e nada se perde — o dado está a salvo; o que falha é o caminho de volta.

## Reproduction

- **Charter:** CH-chamada-offline-rede-instavel · **Tour:** Network
- **Environment:** phone-large 390×844 / pt-BR (dev local; expiração simulada limpando o cookie de sessão)

1. Abrir a folha de chamada, marcar todos, deixar a sessão expirar
2. Confirmar → mensagem "Sua sessão expirou… Entre novamente"
3. Clicar em **Entre novamente**

**Expected:** cai na tela de login.
**Actual:** volta ao `/dashboard`, que mostra "não autenticado"; só um reload manual leva ao login.

## Evidence

- ../evidence/2026-07-27-fixes-decisoes/S5-sessao-expirada.png (mensagem e link)
- ../evidence/2026-07-27-fixes-decisoes/S5-loop-nao-autenticado.png (dashboard com "não autenticado")

## Fix

- **Root cause:** ver Summary.
- **Fix commit:** 740887f — qualquer 401 da API emite `auth:unauthorized`, o AuthProvider zera a sessão local e o guard leva ao login; o aviso de chamada guardada passou a viver na tela de login (a mensagem equivalente na folha virou inalcançável e foi removida).
- **Regression test:** testes novos em `admin-page.test.tsx`, `auth-context.test.tsx` e `dashboard-page.test.tsx` (vermelhos contra o código anterior).

## Verification

- **Retested:** 2026-07-27, sessão nova em persona. · **Report:** ../reports/2026-07-27-fixes-decisoes.md
- **Result:** Com a sessão morta, confirmar a chamada levou direto ao login exibindo "Sua chamada está guardada no aparelho. Entre para enviá-la."; após entrar, a fila drenou sozinha e a chamada consta no servidor. Login normal (sem fila) não mostra o aviso.
