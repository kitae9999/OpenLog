package io.github.kitae9999.openlog.notification

import io.github.kitae9999.openlog.notification.entity.Notification
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper
import java.sql.Types

@Component
class NotificationJdbcWriter(
    private val jdbcTemplate: JdbcTemplate,
    private val objectMapper: ObjectMapper,
) {
    fun insertIgnoringDuplicates(notifications: List<Notification>): Int {
        if (notifications.isEmpty()) {
            return 0
        }

        val results = jdbcTemplate.batchUpdate(
            INSERT_IGNORE_DUPLICATE_SQL,
            notifications,
            notifications.size,
        ) { preparedStatement, notification ->
            preparedStatement.setLong(1, requireNotNull(notification.recipient.id))

            val actorId = notification.actor?.id
            if (actorId == null) {
                preparedStatement.setNull(2, Types.BIGINT)
            } else {
                preparedStatement.setLong(2, actorId)
            }

            preparedStatement.setObject(3, notification.sourceEventId)
            preparedStatement.setString(4, notification.type.name)
            preparedStatement.setString(5, notification.targetDomain)
            preparedStatement.setString(6, notification.targetId)
            preparedStatement.setString(7, objectMapper.writeValueAsString(notification.payload))
            preparedStatement.setObject(8, notification.createdAt)
        }

        return results.sumOf { batchResult -> batchResult.sum() }
    }

    private companion object {
        private val INSERT_IGNORE_DUPLICATE_SQL = """
            INSERT INTO notifications (
                recipient_id,
                actor_id,
                source_event_id,
                type,
                target_domain,
                target_id,
                payload,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, ?)
            ON CONFLICT (recipient_id, source_event_id) DO NOTHING
        """.trimIndent()
    }
}
