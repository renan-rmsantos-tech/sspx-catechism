-- name: IsClassCatechist :one
-- Fine-grained authz check replacing Supabase RLS private.is_class_catechist():
-- true when the catechist is assigned to the class via class_catechists.
SELECT EXISTS (
    SELECT 1 FROM class_catechists
    WHERE class_id = $1 AND catechist_id = $2
) AS is_member;
