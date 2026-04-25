ALTER TABLE public.suggestions
    ADD COLUMN IF NOT EXISTS base_content TEXT;

UPDATE public.suggestions AS suggestion
SET base_content = post.content
FROM public.posts AS post
WHERE suggestion.post_id = post.id
  AND suggestion.base_content IS NULL;

UPDATE public.suggestions
SET base_content = content
WHERE base_content IS NULL;

ALTER TABLE public.suggestions
    ALTER COLUMN base_content SET NOT NULL;
