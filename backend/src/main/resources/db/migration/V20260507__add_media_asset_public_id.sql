CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.media_assets
    ADD COLUMN IF NOT EXISTS public_id UUID;

UPDATE public.media_assets
SET public_id = gen_random_uuid()
WHERE public_id IS NULL;

ALTER TABLE public.media_assets
    ALTER COLUMN public_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS media_assets_public_id_key
    ON public.media_assets (public_id);
