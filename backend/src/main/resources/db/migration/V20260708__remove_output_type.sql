BEGIN;

ALTER TABLE public.outputs
    DROP CONSTRAINT IF EXISTS outputs_type_check;

ALTER TABLE public.outputs
    DROP COLUMN IF EXISTS type;

COMMIT;
