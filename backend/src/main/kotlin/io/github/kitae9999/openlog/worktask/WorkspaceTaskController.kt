package io.github.kitae9999.openlog.worktask

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.task.entity.TaskStatus
import io.github.kitae9999.openlog.worktask.dto.WorkspaceTaskCursorResponse
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class WorkspaceTaskController(
    private val currentUserResolver: CurrentUserResolver,
    private val workspaceTaskService: WorkspaceTaskService,
) {
    @GetMapping("{workspaceId}/tasks")
    fun getTasks(
        request: HttpServletRequest,
        @PathVariable workspaceId: Long,
        @RequestParam(required = false) status: TaskStatus?,
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "20") size: Int,
    ): WorkspaceTaskCursorResponse {
        val user = currentUserResolver.resolveCurrentUser(request)

        return workspaceTaskService.getTasks(
            requireNotNull(user.id),
            workspaceId,
            status,
            cursor,
            size,
        )
    }

    @PostMapping("{workspaceId}/tasks")
    fun createTasks(
        request: HttpServletRequest,
    ) {
    }
}
