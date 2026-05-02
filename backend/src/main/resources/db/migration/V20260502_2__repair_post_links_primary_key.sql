DO $$
DECLARE
    primary_key_columns TEXT;
BEGIN
    UPDATE public.post_links
    SET id = nextval('public.post_links_id_seq'::regclass)
    WHERE id IS NULL;

    ALTER TABLE public.post_links
        ALTER COLUMN id SET NOT NULL;

    SELECT string_agg(attribute.attname, ',' ORDER BY key_column.ordinality)
    INTO primary_key_columns
    FROM pg_constraint constraint_info
    JOIN unnest(constraint_info.conkey) WITH ORDINALITY AS key_column(attribute_number, ordinality)
        ON TRUE
    JOIN pg_attribute attribute
        ON attribute.attrelid = constraint_info.conrelid
       AND attribute.attnum = key_column.attribute_number
    WHERE constraint_info.conrelid = 'public.post_links'::regclass
      AND constraint_info.conname = 'post_links_pkey'
      AND constraint_info.contype = 'p';

    IF primary_key_columns IS NOT NULL AND primary_key_columns <> 'id' THEN
        ALTER TABLE public.post_links
            DROP CONSTRAINT post_links_pkey;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.post_links'::regclass
          AND conname = 'post_links_pkey'
          AND contype = 'p'
    ) THEN
        ALTER TABLE public.post_links
            ADD CONSTRAINT post_links_pkey PRIMARY KEY (id);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS post_links_source_target_label_key
    ON public.post_links (source_post_id, target_post_id, label);
