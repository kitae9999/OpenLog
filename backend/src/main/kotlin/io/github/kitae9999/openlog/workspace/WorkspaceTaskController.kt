package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.task.entity.TaskStatus
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateTaskRequest
import io.github.kitae9999.openlog.workspace.dto.TaskDetailResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceTaskCursorResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceTaskResponse
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class WorkspaceTaskController(
    private val workspaceTaskService: WorkspaceTaskService,
) {
    @GetMapping("{workspaceId}/tasks")
    fun getTasks(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @RequestParam(required = false) status: TaskStatus?,
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "20") size: Int,
    ): WorkspaceTaskCursorResponse {
        return workspaceTaskService.getTasks(
            requireNotNull(user.id),
            workspaceId,
            status,
            cursor,
            size,
        )
    }

    @GetMapping("{workspaceId}/tasks/{taskId}")
    fun getTaskDetail(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable taskId: Long,
    ): TaskDetailResponse {
        return workspaceTaskService.getTaskDetail(
            requireNotNull(user.id),
            workspaceId,
            taskId,
        )
    }

    @PostMapping("{workspaceId}/tasks")
    fun createTasks(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @Valid @RequestBody createTaskRequest: CreateTaskRequest,
    ): ResponseEntity<WorkspaceTaskResponse> {
        val createdTask = workspaceTaskService.createTask(user, workspaceId, createTaskRequest)

        return ResponseEntity.status(201).body(createdTask)
    }
}
