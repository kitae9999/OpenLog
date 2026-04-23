BEGIN;

ALTER TABLE IF EXISTS public.discussions DROP CONSTRAINT IF EXISTS discussions_suggestion_id_fkey;
ALTER TABLE IF EXISTS public.contributors DROP CONSTRAINT IF EXISTS contributors_post_id_fkey;
ALTER TABLE IF EXISTS public.comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE IF EXISTS public.post_likes DROP CONSTRAINT IF EXISTS post_likes_post_id_fkey;
ALTER TABLE IF EXISTS public.post_topics DROP CONSTRAINT IF EXISTS post_topics_post_id_fkey;
ALTER TABLE IF EXISTS public.suggestions DROP CONSTRAINT IF EXISTS suggestions_post_id_fkey;

ALTER TABLE IF EXISTS public.discussions
    ADD CONSTRAINT discussions_suggestion_id_fkey
    FOREIGN KEY (suggestion_id) REFERENCES public.suggestions(id)
    ON DELETE CASCADE DEFERRABLE;

ALTER TABLE IF EXISTS public.contributors
    ADD CONSTRAINT contributors_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES public.posts(id)
    ON DELETE CASCADE DEFERRABLE;

ALTER TABLE IF EXISTS public.comments
    ADD CONSTRAINT comments_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES public.posts(id)
    ON DELETE CASCADE DEFERRABLE;

ALTER TABLE IF EXISTS public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES public.posts(id)
    ON DELETE CASCADE DEFERRABLE;

ALTER TABLE IF EXISTS public.post_topics
    ADD CONSTRAINT post_topics_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES public.posts(id)
    ON DELETE CASCADE DEFERRABLE;

ALTER TABLE IF EXISTS public.suggestions
    ADD CONSTRAINT suggestions_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES public.posts(id)
    ON DELETE CASCADE DEFERRABLE;

COMMIT;
