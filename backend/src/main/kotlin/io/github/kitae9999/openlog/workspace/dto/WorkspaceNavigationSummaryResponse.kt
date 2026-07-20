package io.github.kitae9999.openlog.workspace.dto

data class WorkspaceNavigationSummaryResponse(
    val activeTaskCount: Long,
    val logsCount: Long,
    val openIssuesCount: Long,
)
