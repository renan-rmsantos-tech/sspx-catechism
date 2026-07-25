# Chamada offline → sincronização (E2E real)

- Source: J-fazer-chamada-offline / CHM-chamada-offline-fila; CHM-sync-perda-silenciosa; CHM-reenvio-mesma-data
- Why automate: high-value stable journey — é o núcleo do produto e o fluxo mais frágil (rede + fila local + idempotência); o script `frontend/scripts/capture-baseline.ts` já exercita o caminho com Playwright, mas contra API mockada — falta a versão contra backend real
- Suggested layer: E2E browser (Playwright, já em devDependencies)
- Spec sketch: sobe stack local (Postgres + API + Vite); seed de ano ativo/calendário/turma/catequista/alunos; login; `context.setOffline(true)`; marcar todos → confirmar → esperar `offline-saved-message`; `setOffline(false)` → sync; assert `GET /api/attendance` contém a sessão, fila IndexedDB vazia e reenvio da mesma data devolve skipped sem duplicar; assert que skipped>0 produz aviso visível (regressão do CHM-sync-perda-silenciosa)
- Status: proposed
