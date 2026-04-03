BEGIN;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS username VARCHAR;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_key
    ON public.users (username);

COMMIT;
