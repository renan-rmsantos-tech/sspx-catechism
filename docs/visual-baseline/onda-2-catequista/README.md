# Onda 2 — Catequista

Capturas em 390×844 e 1280×800 do dashboard e da folha de chamada. As imagens `attendance-offline-*` registram o navegador com a rede simulada como offline.

Roteiro de teste manual offline: com a rede indisponível, marcar todos os alunos e confirmar a chamada deve manter a sessão na fila local, mostrar a confirmação de salvamento e a contagem pendente; ao restaurar a rede, `Sincronizar agora` deve enviar a sessão e zerar a fila. A mesma sequência é coberta pelo teste de integração da página.
