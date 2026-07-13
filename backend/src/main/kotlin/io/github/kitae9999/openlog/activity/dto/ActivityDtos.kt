package io.github.kitae9999.openlog.activity.dto

import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogResponse

data class ActivityDayResponse(
    val date: String,
    val logCount: Int,
)

data class WorkspaceActivityResponse(
    val from: String,
    val to: String,
    val totalLogCount: Int,
    val days: List<ActivityDayResponse>,
)

data class ActivityDayLogsResponse(
    val date: String,
    val logs: List<WorkspaceLogResponse>,
)
