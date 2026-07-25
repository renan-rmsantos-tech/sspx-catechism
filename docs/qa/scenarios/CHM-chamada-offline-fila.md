---
id: CHM-chamada-offline-fila
area: CHM
title: Fazer a chamada sem sinal e sincronizar depois
persona: Tereza
journey: J-fazer-chamada-offline
expected: Aviso "Chamada salva no aparelho", chip de rede mostra as pendentes, e quando a rede volta a fila sincroniza (automático ou botão Sincronizar agora) até zerar
entry_points: /dashboard/turmas/:id/chamada
qa_status: pass
bug_ids: BUG-20260724-salvando-infinito-offline; BUG-20260725-marcacoes-somem-no-reload
fix_status: fixed
retest_status: pass
fix_commits: e62e6c9; f6b4c5d
evidence: ../evidence/2026-07-24-ciclo-full/S3-chamada-salva-offline.png; ../evidence/2026-07-24-ciclo-full/S3-offline-saved-message.png; ../evidence/2026-07-24-ciclo-full/S3-fila-aguardando.png
last_report: ../reports/2026-07-24-ciclo-full.md
overlaps:
---

Núcleo offline-first: fila em IndexedDB (Dexie, upsert por [classId+date]), Background Sync com fallback no evento window.online (Safari/iOS). Cortar a rede em momentos diferentes: antes de abrir a chamada (cache de datas), entre marcar e confirmar, e durante o POST de sincronização.
