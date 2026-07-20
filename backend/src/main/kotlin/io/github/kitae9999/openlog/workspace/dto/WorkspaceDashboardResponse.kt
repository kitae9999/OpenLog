package io.github.kitae9999.openlog.workspace.dto

import io.github.kitae9999.openlog.activity.dto.WorkspaceActivityResponse
import io.github.kitae9999.openlog.memory.dto.MemoryResponse
import io.github.kitae9999.openlog.output.dto.OutputResponse
import io.github.kitae9999.openlog.todo.dto.TodoResponse
import io.github.kitae9999.openlog.workingbrief.dto.WorkingBriefResponse
import io.github.kitae9999.openlog.workspace.entity.LogLinkResponse

data class WorkspaceDashboardResponse(
    val tasks: List<WorkspaceTaskResponse>,
    val logs: List<WorkspaceLogResponse>,
    val taskLinks: List<TaskLinkResponse>,
    val logLinks: List<LogLinkResponse>,
    val crossLinks: List<CrossLinkResponse>,
    val todos: List<TodoResponse>,
    val outputs: List<OutputResponse>,
    val memories: List<MemoryResponse>,
    val workingBrief: WorkingBriefResponse?,
    val activity: WorkspaceActivityResponse,
    val navigationSummary: WorkspaceNavigationSummaryResponse,
)
