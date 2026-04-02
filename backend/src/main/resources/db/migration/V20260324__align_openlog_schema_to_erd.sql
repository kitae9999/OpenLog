BEGIN;

ALTER TABLE IF EXISTS public.blogs DROP CONSTRAINT IF EXISTS blogs_user_id_fkey;
ALTER TABLE IF EXISTS public.comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE IF EXISTS public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE IF EXISTS public.contributors DROP CONSTRAINT IF EXISTS contributors_post_id_fkey;
ALTER TABLE IF EXISTS public.contributors DROP CONSTRAINT IF EXISTS contributors_user_id_fkey;
ALTER TABLE IF EXISTS public.discussions DROP CONSTRAINT IF EXISTS discussions_suggestion_id_fkey;
ALTER TABLE IF EXISTS public.discussions DROP CONSTRAINT IF EXISTS discussions_user_id_fkey;
ALTER TABLE IF EXISTS public.follows DROP CONSTRAINT IF EXISTS follows_followed_user_id_fkey;
ALTER TABLE IF EXISTS public.follows DROP CONSTRAINT IF EXISTS follows_following_user_id_fkey;
ALTER TABLE IF EXISTS public.oauth_accounts DROP CONSTRAINT IF EXISTS oauth_accounts_user_id_fkey;
ALTER TABLE IF EXISTS public.post_likes DROP CONSTRAINT IF EXISTS post_likes_post_id_fkey;
ALTER TABLE IF EXISTS public.post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE IF EXISTS public.post_topics DROP CONSTRAINT IF EXISTS post_topics_post_id_fkey;
ALTER TABLE IF EXISTS public.post_topics DROP CONSTRAINT IF EXISTS post_topics_topic_id_fkey;
ALTER TABLE IF EXISTS public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
ALTER TABLE IF EXISTS public.posts DROP CONSTRAINT IF EXISTS posts_blog_id_fkey;
ALTER TABLE IF EXISTS public.suggestions DROP CONSTRAINT IF EXISTS suggestions_post_id_fkey;
ALTER TABLE IF EXISTS public.suggestions DROP CONSTRAINT IF EXISTS suggestions_user_id_fkey;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE public.users DROP COLUMN IF EXISTS username;
ALTER TABLE public.users ALTER COLUMN nickname DROP NOT NULL;

ALTER TABLE public.users ALTER COLUMN id TYPE BIGINT USING id::bigint;
ALTER TABLE public.blogs ALTER COLUMN id TYPE BIGINT USING id::bigint;
ALTER TABLE public.blogs ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint;
ALTER TABLE public.posts ALTER COLUMN id TYPE BIGINT USING id::bigint;
ALTER TABLE public.posts ALTER COLUMN blog_id TYPE BIGINT USING blog_id::bigint;
ALTER TABLE public.posts ALTER COLUMN author_id TYPE BIGINT USING author_id::bigint;
ALTER TABLE public.posts ALTER COLUMN version TYPE BIGINT USING version::bigint;
ALTER TABLE public.posts ALTER COLUMN version SET DEFAULT 0;
ALTER TABLE public.topics ALTER COLUMN id TYPE BIGINT USING id::bigint;
ALTER TABLE public.post_topics ALTER COLUMN post_id TYPE BIGINT USING post_id::bigint;
ALTER TABLE public.post_topics ALTER COLUMN topic_id TYPE BIGINT USING topic_id::bigint;
ALTER TABLE public.post_likes ALTER COLUMN id TYPE BIGINT USING id::bigint;
ALTER TABLE public.post_likes ALTER COLUMN post_id TYPE BIGINT USING post_id::bigint;
ALTER TABLE public.post_likes ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint;
ALTER TABLE public.contributors ALTER COLUMN post_id TYPE BIGINT USING post_id::bigint;
ALTER TABLE public.contributors ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint;
ALTER TABLE public.oauth_accounts ALTER COLUMN id TYPE BIGINT USING id::bigint;
ALTER TABLE public.oauth_accounts ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint;
ALTER TABLE public.suggestions ALTER COLUMN id TYPE BIGINT USING id::bigint;
ALTER TABLE public.suggestions ALTER COLUMN post_id TYPE BIGINT USING post_id::bigint;
ALTER TABLE public.suggestions ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint;
ALTER TABLE public.suggestions ALTER COLUMN post_base_version TYPE BIGINT USING post_base_version::bigint;
ALTER TABLE public.discussions ALTER COLUMN id TYPE BIGINT USING id::bigint;
ALTER TABLE public.discussions ALTER COLUMN suggestion_id TYPE BIGINT USING suggestion_id::bigint;
ALTER TABLE public.discussions ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint;
ALTER TABLE public.comments ALTER COLUMN id TYPE BIGINT USING id::bigint;
ALTER TABLE public.comments ALTER COLUMN post_id TYPE BIGINT USING post_id::bigint;
ALTER TABLE public.comments ALTER COLUMN user_id TYPE BIGINT USING user_id::bigint;
ALTER TABLE public.follows ALTER COLUMN following_user_id TYPE BIGINT USING following_user_id::bigint;
ALTER TABLE public.follows ALTER COLUMN followed_user_id TYPE BIGINT USING followed_user_id::bigint;

ALTER TABLE public.oauth_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE public.oauth_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
UPDATE public.oauth_accounts
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);
ALTER TABLE public.oauth_accounts ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.oauth_accounts ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id' AND is_identity = 'NO'
    ) THEN
        EXECUTE 'ALTER TABLE public.users ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'blogs' AND column_name = 'id' AND is_identity = 'NO'
    ) THEN
        EXECUTE 'ALTER TABLE public.blogs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'id' AND is_identity = 'NO'
    ) THEN
        EXECUTE 'ALTER TABLE public.posts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'topics' AND column_name = 'id' AND is_identity = 'NO'
    ) THEN
        EXECUTE 'ALTER TABLE public.topics ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'post_likes' AND column_name = 'id' AND is_identity = 'NO'
    ) THEN
        EXECUTE 'ALTER TABLE public.post_likes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'oauth_accounts' AND column_name = 'id' AND is_identity = 'NO'
    ) THEN
        EXECUTE 'ALTER TABLE public.oauth_accounts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'suggestions' AND column_name = 'id' AND is_identity = 'NO'
    ) THEN
        EXECUTE 'ALTER TABLE public.suggestions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'discussions' AND column_name = 'id' AND is_identity = 'NO'
    ) THEN
        EXECUTE 'ALTER TABLE public.discussions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'id' AND is_identity = 'NO'
    ) THEN
        EXECUTE 'ALTER TABLE public.comments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY';
    END IF;
END $$;

SELECT setval(pg_get_serial_sequence('public.users', 'id'), COALESCE((SELECT MAX(id) FROM public.users), 1), (SELECT MAX(id) IS NOT NULL FROM public.users));
SELECT setval(pg_get_serial_sequence('public.blogs', 'id'), COALESCE((SELECT MAX(id) FROM public.blogs), 1), (SELECT MAX(id) IS NOT NULL FROM public.blogs));
SELECT setval(pg_get_serial_sequence('public.posts', 'id'), COALESCE((SELECT MAX(id) FROM public.posts), 1), (SELECT MAX(id) IS NOT NULL FROM public.posts));
SELECT setval(pg_get_serial_sequence('public.topics', 'id'), COALESCE((SELECT MAX(id) FROM public.topics), 1), (SELECT MAX(id) IS NOT NULL FROM public.topics));
SELECT setval(pg_get_serial_sequence('public.post_likes', 'id'), COALESCE((SELECT MAX(id) FROM public.post_likes), 1), (SELECT MAX(id) IS NOT NULL FROM public.post_likes));
SELECT setval(pg_get_serial_sequence('public.oauth_accounts', 'id'), COALESCE((SELECT MAX(id) FROM public.oauth_accounts), 1), (SELECT MAX(id) IS NOT NULL FROM public.oauth_accounts));
SELECT setval(pg_get_serial_sequence('public.suggestions', 'id'), COALESCE((SELECT MAX(id) FROM public.suggestions), 1), (SELECT MAX(id) IS NOT NULL FROM public.suggestions));
SELECT setval(pg_get_serial_sequence('public.discussions', 'id'), COALESCE((SELECT MAX(id) FROM public.discussions), 1), (SELECT MAX(id) IS NOT NULL FROM public.discussions));
SELECT setval(pg_get_serial_sequence('public.comments', 'id'), COALESCE((SELECT MAX(id) FROM public.comments), 1), (SELECT MAX(id) IS NOT NULL FROM public.comments));

ALTER TABLE public.blogs
    ADD CONSTRAINT blogs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) DEFERRABLE;
ALTER TABLE public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) DEFERRABLE,
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) DEFERRABLE;
ALTER TABLE public.contributors
    ADD CONSTRAINT contributors_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) DEFERRABLE,
    ADD CONSTRAINT contributors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) DEFERRABLE;
ALTER TABLE public.discussions
    ADD CONSTRAINT discussions_suggestion_id_fkey FOREIGN KEY (suggestion_id) REFERENCES public.suggestions(id) DEFERRABLE,
    ADD CONSTRAINT discussions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) DEFERRABLE;
ALTER TABLE public.follows
    ADD CONSTRAINT follows_followed_user_id_fkey FOREIGN KEY (followed_user_id) REFERENCES public.users(id) DEFERRABLE,
    ADD CONSTRAINT follows_following_user_id_fkey FOREIGN KEY (following_user_id) REFERENCES public.users(id) DEFERRABLE;
ALTER TABLE public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) DEFERRABLE;
ALTER TABLE public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) DEFERRABLE,
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) DEFERRABLE;
ALTER TABLE public.post_topics
    ADD CONSTRAINT post_topics_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) DEFERRABLE,
    ADD CONSTRAINT post_topics_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id) DEFERRABLE;
ALTER TABLE public.posts
    ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) DEFERRABLE,
    ADD CONSTRAINT posts_blog_id_fkey FOREIGN KEY (blog_id) REFERENCES public.blogs(id) DEFERRABLE;
ALTER TABLE public.suggestions
    ADD CONSTRAINT suggestions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) DEFERRABLE,
    ADD CONSTRAINT suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) DEFERRABLE;

COMMIT;
