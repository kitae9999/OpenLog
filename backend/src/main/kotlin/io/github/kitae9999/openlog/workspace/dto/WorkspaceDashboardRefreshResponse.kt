package io.github.kitae9999.openlog.workspace.dto

import io.github.kitae9999.openlog.activity.dto.WorkspaceActivityResponse

enum class WorkspaceDashboardRefreshZone {
    TASKS,
    LOGS,
}

enum class WorkspaceDashboardRefreshMode {
    PATCH,
    REPLACE,
}

data class WorkspaceDashboardRefreshResponse(
    val zone: WorkspaceDashboardRefreshZone,
    val mode: WorkspaceDashboardRefreshMode,
    val task: TaskDetailResponse? = null,
    val tasks: List<WorkspaceTaskResponse> = emptyList(),
    val log: WorkspaceLogDetailResponse? = null,
    val logs: List<WorkspaceLogResponse> = emptyList(),
    val linkedTask: TaskDetailResponse? = null,
    val navigationSummary: WorkspaceNavigationSummaryResponse,
    val activity: WorkspaceActivityResponse? = null,
)
