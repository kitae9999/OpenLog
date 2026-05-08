package io.github.kitae9999.openlog.common.outbox

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

@Component
class OutboxEventWriter(
    private val jdbcTemplate: JdbcTemplate,
    private val objectMapper: ObjectMapper,
) {
    fun write(
        eventDomain: String,
        entityId: String,
        eventType: String,
        payload: Any,
        occurredAt: Instant = Instant.now(),
    ): UUID {
        val eventId = UUID.randomUUID()
        val payloadJson = objectMapper.writeValueAsString(payload) // json 형식의 문자열로 변환

        jdbcTemplate.update(
            """
            INSERT INTO outbox_events (
                id,
                event_domain,
                entity_id,
                event_type,
                payload,
                occurred_at
            )
            VALUES (?, ?, ?, ?, ?::jsonb, ?)
            """.trimIndent(),
            eventId,
            eventDomain,
            entityId,
            eventType,
            payloadJson,
            OffsetDateTime.ofInstant(occurredAt, ZoneOffset.UTC),
        )

        return eventId
    }
}
