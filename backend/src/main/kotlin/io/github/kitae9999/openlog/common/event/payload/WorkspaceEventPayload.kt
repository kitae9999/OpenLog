package io.github.kitae9999.openlog.common.event.payload

import java.time.Instant

data class WorkspaceChangedEventPayload(
    val workspaceId: Long,
    val zone: String,
    val entityType: String,
    val entityId: String,
    val action: String,
    val occurredAt: Instant,
)

enum class WorkspaceSyncZone(val wireValue: String) {
    TASKS("tasks"),
    LOGS("logs"),
    TODOS("todos"),
    BRIEF("brief"),
    OUTPUT("output"),
    MEMORY("memory"),
}

enum class WorkspaceEntityType(val wireValue: String) {
    TASK("TASK"),
    LOG("LOG"),
    TODO("TODO"),
    BRIEF("BRIEF"),
    OUTPUT("OUTPUT"),
    MEMORY("MEMORY"),
}

enum class WorkspaceChangeAction(val wireValue: String) {
    CREATED("CREATED"),
    UPDATED("UPDATED"),
    DELETED("DELETED"),
}
