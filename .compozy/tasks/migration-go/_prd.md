# PRD: Migração para VPS/Docker com Backend em Go

**Slug:** migration-go
**Data:** 2026-06-23
**Status:** Aprovado para especificação técnica

## Overview

O sistema de catequese da paróquia roda hoje sobre duas plataformas gerenciadas — **Vercel** (frontend Next.js/React) e **Supabase** (Auth, Postgres, RLS). Esse arranjo traz custo recorrente difícil de prever e dependência de fornecedor (lock-in), riscos relevantes para um projeto de orçamento paroquial.

Este projeto rehospeda a aplicação em **infraestrutura própria de baixo custo (um VPS Hetzner com Docker)**, reescreve o **backend em Go** e mantém o **frontend em React/Next.js**. Para o usuário final, a migração é **invisível**: inscrição pública, chamada offline dos catequistas, gestão pela coordenação e relatórios continuam idênticos. O ganho é operacional e financeiro.

**Para quem é valioso:**
- **Operador/responsável técnico:** custo fixo previsível (~$10–15/mês), controle total de dados e stack, sem lock-in.
- **Usuários finais (responsáveis, catequistas, coordenadores):** continuidade total das funcionalidades.

**Por que agora:** o sistema ainda não está em produção — é o momento de menor risco para trocar a fundação, sem dados reais nem usuários ativos a migrar.

## Goals

**Objetivos de negócio / operacionais:**
1. **Reduzir e tornar previsível o custo** — meta de ~$10–15/mês fixo.
2. **Eliminar o lock-in** — controle total sobre dados, autenticação e deploy.
3. **Preservar 100% das funcionalidades atuais** — sem remover ou degradar nada para o usuário final.
4. **Padronizar o backend em Go**, mantendo o frontend em React/Next.js.

**Critérios de sucesso mensuráveis:**
- Custo mensal de infraestrutura ≤ $15.
- Paridade funcional completa (suíte de testes + teste manual dos 3 perfis).
- Zero dependência de Vercel e Supabase no ambiente final.
- Deploy reproduzível com um comando + backup automático com restauração testada.

**Timeline / marco:** sistema ainda não está em produção; não há janela de corte nem migração de dados. O alvo é entrar em produção já na nova fundação.

## User Stories

**Operador / Responsável técnico:**
- Como operador, quero rodar todo o sistema em um único servidor com um comando, para ter deploy simples e reproduzível.
- Como operador, quero custo mensal fixo e baixo, para previsibilidade orçamentária.
- Como operador, quero backups automáticos e off-site do banco, para restaurar dados sem perda em caso de falha.
- Como operador, quero controle total sobre dados e autenticação, para não depender de plataformas externas.

**Responsável / Público:**
- Como responsável, quero enviar a inscrição de um catequizando por um formulário público, para matriculá-lo sem ir presencialmente.

**Catequista:**
- Como catequista, quero fazer a chamada da minha turma pelo celular, inclusive sem internet, para registrar presença offline e sincronizar depois.
- Como catequista, quero trocar minha senha no primeiro acesso, para usar o sistema com segurança.

**Coordenador / Admin:**
- Como coordenador, quero gerir anos letivos, turmas, alunos e catequistas, para organizar a catequese.
- Como coordenador, quero revisar (aprovar/rejeitar) inscrições, para controlar matrículas.
- Como coordenador, quero gerar relatórios de presença (PDF/Excel), para acompanhar a frequência.

## Core Features

**A) Capacidades preservadas — paridade obrigatória (prioridade máxima):**

1. **Inscrição pública** — formulário aberto com validação e status (pendente/aprovado/rejeitado), incluindo renovação.
2. **Autenticação e perfis** — login por e-mail/senha, papéis (coordenador/catequista/admin), troca obrigatória de senha no 1º acesso, criação de catequista pelo coordenador, seed do admin inicial.
3. **Chamada offline-first (PWA)** — registro de presença no celular sem internet, com fila local e sincronização idempotente ao reconectar.
4. **Gestão acadêmica** — CRUD de anos letivos, turmas, alunos, catequistas e calendário (com validação de dias de aula permitidos).
5. **Revisão de inscrições** — aprovar/rejeitar com motivo e vínculo a turma/aluno.
6. **Relatórios de presença** — exportação em PDF e Excel.

**B) Capacidades da migração — a nova fundação:**

7. **Backend próprio em Go** — API HTTP que substitui Supabase (Auth + acesso ao Postgres), com a autorização antes baseada em RLS movida para a camada de aplicação (regras de coordenador e de catequista da turma preservadas).
8. **Banco de dados próprio** — Postgres auto-hospedado, mesmo modelo de dados, runner de migrações apontando para ele.
9. **Empacotamento e deploy** — toda a stack (Next.js, API Go, Postgres, proxy/SSL) sobe via Docker Compose em um VPS.
10. **Backup e recuperação** — `pg_dump` noturno cifrado, enviado off-site, com restauração testada.

## User Experience

**Princípio central:** para o usuário final, nada muda — mesmas URLs, telas, PWA instalável e comportamento offline. Sem reonboarding nem aviso de "novo sistema"; login, sessão e troca de senha no 1º acesso seguem idênticos. Sem regressão de performance percebida.

**Jornada do operador (nova):**
1. **Provisionar** o VPS Hetzner e apontar o domínio.
2. **Configurar** variáveis de ambiente (banco, admin inicial, domínio).
3. **Subir** com `docker compose up`: Caddy emite SSL automático, migrações rodam, admin é semeado.
4. **Operar** com quase zero toque — backups automáticos; atualizar = novo deploy.
5. **Recuperar** restaurando o último `pg_dump` off-site por procedimento documentado.

**Acessibilidade/UX:** mantidas as do app atual (Tailwind/shadcn, mobile-first na chamada).

## High-Level Technical Constraints

- **Compatibilidade funcional:** o ambiente novo deve reproduzir todos os fluxos atuais sem regressão.
- **Privacidade e segurança de dados:** o sistema trata dados pessoais de menores e responsáveis (nomes, telefones, e-mails). Embora os dados possam residir no exterior (sem exigência formal de residência LGPD), exigem-se: tráfego sob HTTPS, senhas com hash forte, autorização por papel preservada, e backups cifrados.
- **Desempenho percebido:** tempos de resposta comparáveis ao ambiente atual, mesmo com servidor na Europa.
- **Integridade offline:** a sincronização de presença deve ser idempotente (sem duplicar registros).
- **Operação por uma pessoa:** a solução deve ser operável por um único responsável técnico, com automação de SSL, deploy e backups.

## Non-Goals (Out of Scope)

- Alta disponibilidade / cluster / multi-servidor.
- Multi-tenant (múltiplas paróquias).
- Armazenamento de arquivos/mídia (Supabase Storage não é usado hoje).
- Realtime via websockets (não usado; offline é via fila local).
- Painel de métricas/observabilidade avançada.
- Migração de dados de produção (não há dados reais).
- Residência de dados no Brasil (não é requisito).
- Qualquer nova funcionalidade de produto além da paridade.

## Phased Rollout Plan

### Fase 1 — Fundação e Autenticação (MVP)
- Esqueleto Docker Compose: Postgres + API Go + Caddy + Next.js consumindo a API.
- Portar modelo de dados (migrações no novo Postgres) e autenticação (login, papéis, troca de senha obrigatória, seed do admin, criação de catequista) + autorização na camada Go.
- **Critério para avançar:** login dos 3 perfis funcionando ponta a ponta no Docker, com autorização correta.

### Fase 2 — Gestão e Inscrição
- Portar CRUD de anos letivos, turmas, alunos, catequistas, calendário; inscrição pública e revisão; relatórios PDF/Excel.
- **Critério para avançar:** todos os fluxos de gestão e inscrição validados (testes + manual).

### Fase 3 — Chamada Offline e Finalização
- Portar chamada offline-first e sincronização idempotente; validar PWA no novo backend.
- Ativar backups automáticos off-site e testar restauração.
- Desligar Vercel/Supabase.
- **Critério de sucesso final:** paridade funcional total, custo ≤ $15/mês, backup+restore comprovados, zero dependência de Vercel/Supabase.

## Success Metrics

**Custo:**
- Infraestrutura ≤ $15/mês, fixo e previsível.
- Zero faturas de Vercel e Supabase após o corte.

**Paridade funcional:**
- 100% dos fluxos atuais funcionando no novo ambiente.
- Suíte de testes existente (25 arquivos) passando contra o novo backend.
- Teste manual dos 3 perfis sem regressão.

**Confiabilidade / operação:**
- Backup noturno off-site automático + restauração testada com sucesso ao menos uma vez.
- Ambiente recriável do zero em outro servidor com um comando, em < 30 min.
- SSL válido com renovação automática.

**Performance percebida:**
- Tempo de resposta comparável ao atual; sincronização offline idempotente (sem duplicação).

**Independência:**
- Nenhuma chamada de runtime a Vercel/Supabase no ambiente final.

## Architecture Decision Records

- [ADR-001: Hospedagem em VPS único com Docker Compose (backend Go, frontend Next.js)](adrs/adr-001.md) — Hospedar tudo em um VPS Hetzner (classe CPX22) via Docker Compose (Caddy + Next.js + Go + Postgres + backup off-site), rejeitando frontend em CDN separada e AWS/GCP por custo.

## Open Questions

- **Substituição da autenticação:** definir na TechSpec a estratégia exata de auth em Go (sessão vs. JWT, biblioteca de hash) preservando os fluxos atuais — decisão técnica, fora do escopo deste PRD.
- **Destino do backup off-site:** Cloudflare R2 vs. Hetzner Storage Box (custo/efeito ~ $1–4/mês) — definir na implementação.
- **Estratégia de deploy/CI:** `git push` + script SSH vs. GitHub Actions — definir na TechSpec.
- **Reaproveitamento do frontend Next.js:** confirmar na TechSpec quanto dos Server Components/Server Actions vira chamada à API Go e o impacto no runtime Node do container.
