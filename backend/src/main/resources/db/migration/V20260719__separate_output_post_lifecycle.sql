ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS unpublished_at TIMESTAMP;

UPDATE public.posts
SET published_at = created_at
WHERE published_at IS NULL;

ALTER TABLE public.posts
    DROP CONSTRAINT IF EXISTS posts_status_check;

ALTER TABLE public.posts
    ADD CONSTRAINT posts_status_check
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED'));

ALTER TABLE public.posts
    ALTER COLUMN status SET DEFAULT 'DRAFT';

CREATE INDEX IF NOT EXISTS posts_status_published_at_idx
    ON public.posts (status, published_at DESC, id DESC);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'outputs'
          AND column_name = 'published_at'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'outputs'
          AND column_name = 'exported_at'
    ) THEN
        ALTER TABLE public.outputs RENAME COLUMN published_at TO exported_at;
    END IF;
END $$;

UPDATE public.outputs output
SET status = 'EXPORTED',
    exported_at = COALESCE(output.exported_at, output.updated_at, output.created_at)
WHERE EXISTS (
    SELECT 1
    FROM public.posts post
    WHERE post.output_id = output.id
);

UPDATE public.outputs output
SET status = 'DRAFT',
    exported_at = NULL
WHERE status IN ('EXPORTED', 'PUBLISHED')
  AND NOT EXISTS (
      SELECT 1
      FROM public.posts post
      WHERE post.output_id = output.id
  );

ALTER TABLE public.outputs
    DROP CONSTRAINT IF EXISTS outputs_status_check;

ALTER TABLE public.outputs
    ADD CONSTRAINT outputs_status_check
        CHECK (status IN ('DRAFT', 'EXPORTED'));
