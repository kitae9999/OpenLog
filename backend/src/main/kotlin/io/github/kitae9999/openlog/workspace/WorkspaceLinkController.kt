package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateLogLinkRequest
import io.github.kitae9999.openlog.workspace.dto.CreateTaskLinkRequest
import io.github.kitae9999.openlog.workspace.entity.LogLinkResponse
import io.github.kitae9999.openlog.workspace.dto.TaskLinkResponse
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/workspaces")
class WorkspaceLinkController(
    private val workspaceLinkService: WorkspaceLinkService,
) {

    @GetMapping("/{workspaceId}/log-links")
    fun getLogLinks(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
    ): List<LogLinkResponse> {
        return workspaceLinkService.getLogLinks(
            userId = requireNotNull(user.id),
            workspaceId = workspaceId,
        )
    }

    @PostMapping("/{workspaceId}/log-links")
    fun createLogLink(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @Valid @RequestBody createLogLinkRequest: CreateLogLinkRequest,
    ): ResponseEntity<Void> {
        workspaceLinkService.createLogLink(
            userId = requireNotNull(user.id),
            workspaceId = workspaceId,
            fromLogId = createLogLinkRequest.fromLogId,
            toLogId = createLogLinkRequest.toLogId,
            relation = createLogLinkRequest.relation,
        )

        return ResponseEntity.status(201).build()
    }

    @DeleteMapping("/{workspaceId}/log-links/{logLinkId}")
    fun deleteLogLink(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable logLinkId: Long,
    ): ResponseEntity<Void> {
        workspaceLinkService.deleteLogLink(
            userId = requireNotNull(user.id),
            workspaceId = workspaceId,
            logLinkId = logLinkId,
        )

        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{workspaceId}/task-links")
    fun getTaskLinks(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
    ): List<TaskLinkResponse> {
        return workspaceLinkService.getTaskLinks(
            userId = requireNotNull(user.id),
            workspaceId = workspaceId,
        )
    }

    @PostMapping("/{workspaceId}/task-links")
    fun createTaskLink(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @Valid @RequestBody createTaskLinkRequest: CreateTaskLinkRequest,
    ): ResponseEntity<TaskLinkResponse> {
        val createdTaskLink = workspaceLinkService.createTaskLink(
            userId = requireNotNull(user.id),
            workspaceId = workspaceId,
            fromTaskId = createTaskLinkRequest.fromTaskId,
            toTaskId = createTaskLinkRequest.toTaskId,
            relation = createTaskLinkRequest.relation,
        )

        return ResponseEntity.status(201).body(createdTaskLink)
    }

    @DeleteMapping("/{workspaceId}/task-links/{taskLinkId}")
    fun deleteTaskLink(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable taskLinkId: Long,
    ): ResponseEntity<Void> {
        workspaceLinkService.deleteTaskLink(
            userId = requireNotNull(user.id),
            workspaceId = workspaceId,
            taskLinkId = taskLinkId,
        )

        return ResponseEntity.noContent().build()
    }
}
