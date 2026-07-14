package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.event.payload.WorkspaceChangeAction
import io.github.kitae9999.openlog.common.event.payload.WorkspaceChangedEventPayload
import io.github.kitae9999.openlog.common.event.payload.WorkspaceEntityType
import io.github.kitae9999.openlog.common.event.payload.WorkspaceSyncZone
import io.github.kitae9999.openlog.common.outbox.OutboxEventWriter
import org.springframework.stereotype.Component
import java.time.Instant

@Component
class WorkspaceChangeNotifier(
    private val outboxEventWriter: OutboxEventWriter,
) {
    fun notify(
        workspaceId: Long,
        zone: WorkspaceSyncZone,
        entityType: WorkspaceEntityType,
        entityId: Long,
        action: WorkspaceChangeAction,
        occurredAt: Instant = Instant.now(),
    ) {
        outboxEventWriter.write(
            eventDomain = EVENT_DOMAIN,
            entityId = entityId.toString(),
            eventType = EVENT_TYPE,
            payload = WorkspaceChangedEventPayload(
                workspaceId = workspaceId,
                zone = zone.wireValue,
                entityType = entityType.wireValue,
                entityId = entityId.toString(),
                action = action.wireValue,
                occurredAt = occurredAt,
            ),
            occurredAt = occurredAt,
        )
    }

    companion object {
        const val EVENT_DOMAIN = "workspace"
        const val EVENT_TYPE = "WORKSPACE_CHANGED"
    }
}
