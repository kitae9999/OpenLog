BEGIN;

ALTER TABLE IF EXISTS public.posts
    DROP CONSTRAINT IF EXISTS posts_blog_id_fkey;

ALTER TABLE IF EXISTS public.posts
    DROP COLUMN IF EXISTS blog_id;

ALTER TABLE IF EXISTS public.blogs
    DROP CONSTRAINT IF EXISTS blogs_user_id_fkey;

DROP TABLE IF EXISTS public.blogs;

COMMIT;
