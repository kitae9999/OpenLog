ALTER TABLE public.suggestions
    ADD COLUMN IF NOT EXISTS title VARCHAR(255);

UPDATE public.suggestions
SET title = LEFT(COALESCE(NULLIF(TRIM(description), ''), 'Untitled suggestion'), 255)
WHERE title IS NULL;

ALTER TABLE public.suggestions
    ALTER COLUMN title SET NOT NULL;
