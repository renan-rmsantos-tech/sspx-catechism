-- +goose Up
-- Um único ano letivo ativo por vez (BUG-20260724-dois-anos-ativos-sem-aviso):
-- normaliza dados existentes mantendo ativo só o ano mais recente e garante a
-- unicidade com um índice parcial — ativar um novo ano exige desativar o atual
-- (o serviço faz a troca atômica).
UPDATE academic_years SET is_active = FALSE
WHERE is_active AND id NOT IN (
    SELECT id FROM academic_years WHERE is_active ORDER BY year DESC LIMIT 1
);

CREATE UNIQUE INDEX academic_years_single_active ON academic_years ((TRUE)) WHERE is_active;

-- +goose Down
DROP INDEX academic_years_single_active;
