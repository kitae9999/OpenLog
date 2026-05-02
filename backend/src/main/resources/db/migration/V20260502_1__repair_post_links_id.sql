ALTER TABLE public.post_links
    ADD COLUMN IF NOT EXISTS id BIGINT;

CREATE SEQUENCE IF NOT EXISTS public.post_links_id_seq AS BIGINT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'post_links'
          AND column_name = 'id'
          AND is_identity = 'NO'
    ) THEN
        ALTER TABLE public.post_links
            ALTER COLUMN id SET DEFAULT nextval('public.post_links_id_seq'::regclass);
    END IF;
END $$;

UPDATE public.post_links
SET id = nextval('public.post_links_id_seq'::regclass)
WHERE id IS NULL;

SELECT setval(
    'public.post_links_id_seq',
    COALESCE((SELECT MAX(id) FROM public.post_links), 1),
    (SELECT MAX(id) IS NOT NULL FROM public.post_links)
);

ALTER TABLE public.post_links
    ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.post_links'::regclass
          AND conname = 'post_links_pkey'
    ) THEN
        ALTER TABLE public.post_links
            ADD CONSTRAINT post_links_pkey PRIMARY KEY (id);
    END IF;
END $$;
