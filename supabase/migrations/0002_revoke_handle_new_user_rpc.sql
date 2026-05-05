-- PostgREST exposes functions granted to PUBLIC via /rest/v1/rpc/.
-- handle_new_user is trigger-only (SECURITY DEFINER); anon must not call it.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
