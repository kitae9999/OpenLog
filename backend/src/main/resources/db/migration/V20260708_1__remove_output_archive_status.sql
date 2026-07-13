BEGIN;

UPDATE public.outputs
SET status = 'DRAFT'
WHERE status = 'ARCHIVED';

ALTER TABLE public.outputs
    DROP CONSTRAINT IF EXISTS outputs_status_check;

ALTER TABLE public.outputs
    ADD CONSTRAINT outputs_status_check
        CHECK (status IN ('DRAFT', 'EXPORTED', 'PUBLISHED'));

COMMIT;
