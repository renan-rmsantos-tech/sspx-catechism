import { defineProtoConfig } from "@compozy/proto/config";

/** Galeria de protótipos: `npm run proto dev` (veja docs/design/prototyping.md). */
export default defineProtoConfig({
  title: "Catequese",
  locale: "pt-BR",
  // Seções da galeria.
  specs: {
    acesso: "Acesso",
    catequista: "Área do catequista",
    coordenacao: "Coordenação",
  },
  guards: {
    // Protótipos e drafts renderizam views com fixtures: nunca alcançam a API,
    // a sessão, o IndexedDB da fila offline nem o service worker.
    forbidRuntimeImports: [
      "src/lib/api.ts",
      "src/lib/*-api.ts",
      "src/lib/attendance-sync.ts",
      "src/lib/class-dates-cache.ts",
      "src/lib/db.ts",
      "src/contexts",
      "src/service-worker.ts",
      "dexie",
      "workbox-precaching",
    ],
  },
  dev: { port: 4470 },
});
