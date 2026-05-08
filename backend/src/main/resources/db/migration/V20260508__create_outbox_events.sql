CREATE TABLE IF NOT EXISTS public.outbox_events (
    id UUID PRIMARY KEY,
    event_domain VARCHAR(255) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_domain_entity
    ON public.outbox_events (event_domain, entity_id, occurred_at);
