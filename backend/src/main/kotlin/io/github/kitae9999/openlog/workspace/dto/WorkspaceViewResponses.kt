package io.github.kitae9999.openlog.workspace.dto

import io.github.kitae9999.openlog.activity.dto.ActivityDayLogsResponse
import io.github.kitae9999.openlog.activity.dto.WorkspaceActivityResponse
import io.github.kitae9999.openlog.memory.dto.MemoryResponse
import io.github.kitae9999.openlog.output.dto.OutputResponse
import io.github.kitae9999.openlog.todo.dto.TodoResponse
import io.github.kitae9999.openlog.workspace.entity.LogLinkResponse

data class WorkspacePlannerViewResponse(
    val tasks: List<WorkspaceTaskResponse>,
    val todos: List<TodoResponse>,
)

data class WorkspaceGraphViewResponse(
    val tasks: List<WorkspaceTaskResponse>,
    val logs: List<WorkspaceLogResponse>,
    val outputs: List<OutputResponse>,
    val memories: List<MemoryResponse>,
    val taskLinks: List<TaskLinkResponse>,
    val logLinks: List<LogLinkResponse>,
    val crossLinks: List<CrossLinkResponse>,
)

data class WorkspaceActivityViewResponse(
    val activity: WorkspaceActivityResponse,
    val selectedDay: ActivityDayLogsResponse,
)
