# Task Memory: task_16.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
- Task 16 requires live production operations: Hetzner VPS/DNS/Storage Box,
  TLS, cron backup, restore proof, three-profile parity, and shutdown of
  Vercel/Supabase. No live Hetzner/DNS/GitHub/Vercel/Supabase credentials or
  target host details are present in the workspace, so completion cannot be
  claimed from repo-only verification.

## Important Decisions
- Keep task tracking pending unless live production evidence is produced.
- Repo-side work should be limited to deploy/backup/restore hardening and
  operational checklists that make the live run auditable.

## Learnings
- Pre-existing worktree is dirty before task_16 edits; do not revert unrelated
  tracking/memory changes. `_tasks.md` is deleted in the worktree, though it
  exists in HEAD, so final master tracking may be blocked unless restored by the
  owner/workflow.
- Backend `go.mod` currently requires Go 1.25.7, but the production Dockerfile
  and deploy workflow still pin Go 1.23; production builds may fail until aligned.
- `scripts/restore.sh` claims to overwrite the current DB, but backups are
  created without `pg_dump --clean --if-exists`; restoring into an existing DB
  may fail on existing objects.
- Frontend verification exposed a pre-existing async test race in
  `frontend/src/pages/admin/admin-page.test.tsx`: the class-creation test waited
  for the heading but not the asynchronously loaded catechist checkbox.
- Repo-side verification passed on 2026-06-24: shell syntax for backup/restore,
  Compose config with `.env.server.example`, backend `go test ./...`, frontend
  `npm run build`, frontend `npm test -- --run`, production image build for
  `api`/`caddy`, and isolated DB/API Compose smoke with healthy containers.

## Files / Surfaces
- Relevant infra surfaces: `infra/README.md`, `.env.server.example`,
  `docker-compose.yml`, `Caddyfile`, `backend/Dockerfile`,
  `.github/workflows/deploy.yml`, `scripts/backup.sh`, `scripts/restore.sh`.
- Verification touched `frontend/src/pages/admin/admin-page.test.tsx` only to
  wait for async fixture data before clicking the catechist checkbox.

## Errors / Corrections
- Corrected backend production toolchain mismatch by aligning Docker/CI with
  `backend/go.mod` instead of the stale Go 1.23 pin.
- Corrected backup/restore mismatch by adding clean/if-exists dump flags and an
  optional `STORAGEBOX_SSH_KEY` used by both backup and restore scripts.
- Created local commit `b61a5c1` (`Harden production deploy runbook`) containing
  only repo-side deploy hardening and the frontend async test fix. Workflow memory
  and unrelated task-tracking edits were intentionally left unstaged.

## Ready for Next Run
- Live task_16 requirements remain open: provision the Hetzner VPS/DNS/secrets,
  run first deploy with TLS, configure GitHub Actions secrets, schedule cron,
  run real off-site backup + restore, complete the three-profile parity checklist,
  verify cost <= $15/month, and shut down Vercel/Supabase. Do not mark
  `task_16.md` or the master task list complete without that production evidence.
- `_tasks.md` is still deleted in the pre-existing worktree state, so master
  tracking cannot be updated until that file is intentionally restored or the
  workflow confirms it has moved elsewhere.
