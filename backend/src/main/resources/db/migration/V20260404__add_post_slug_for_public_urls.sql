BEGIN;

ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS slug VARCHAR;

WITH normalized AS (
    SELECT
        id,
        author_id,
        COALESCE(
            NULLIF(
                trim(BOTH '-' FROM regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')),
                ''
            ),
            'post'
        ) AS base_slug
    FROM public.posts
),
ranked AS (
    SELECT
        id,
        CASE
            WHEN row_number() OVER (PARTITION BY author_id, base_slug ORDER BY id) = 1
                THEN base_slug
            ELSE base_slug || '-' || row_number() OVER (PARTITION BY author_id, base_slug ORDER BY id)
        END AS final_slug
    FROM normalized
)
UPDATE public.posts AS posts
SET slug = ranked.final_slug
FROM ranked
WHERE posts.id = ranked.id
  AND posts.slug IS NULL;

ALTER TABLE public.posts
    ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS posts_author_id_slug_key
    ON public.posts (author_id, slug);

COMMIT;
