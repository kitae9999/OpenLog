package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateWorkspaceLogRequest
import io.github.kitae9999.openlog.workspace.dto.UpdateWorkspaceLogRequest
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogCursorResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogDetailResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogResponse
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/workspaces")
class WorkspaceLogController(
    private val workspaceLogService: WorkspaceLogService,
) {
    @GetMapping("/{workspaceId}/logs")
    fun getLogs(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @RequestParam(required = false) taskId: Long?,
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "20") size: Int,
    ): WorkspaceLogCursorResponse {
        return workspaceLogService.getLogs(
            requireNotNull(user.id),
            workspaceId,
            taskId,
            cursor,
            size,
        )
    }

    @GetMapping("/{workspaceId}/logs/{logId}")
    fun getLogDetail(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable logId: Long,
    ): WorkspaceLogDetailResponse {
        return workspaceLogService.getLogDetail(
            requireNotNull(user.id),
            workspaceId,
            logId,
        )
    }

    @PostMapping("/{workspaceId}/logs")
    fun createLog(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @Valid @RequestBody createLogRequest: CreateWorkspaceLogRequest,
    ): ResponseEntity<WorkspaceLogResponse> {
        val createdLog = workspaceLogService.createLog(user, workspaceId, createLogRequest)

        return ResponseEntity.status(201).body(createdLog)
    }

    @PutMapping("/{workspaceId}/logs/{logId}")
    fun updateLog(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable logId: Long,
        @Valid @RequestBody updateLogRequest: UpdateWorkspaceLogRequest,
    ): WorkspaceLogDetailResponse {
        return workspaceLogService.updateLog(
            requireNotNull(user.id),
            workspaceId,
            logId,
            updateLogRequest,
        )
    }

    @DeleteMapping("/{workspaceId}/logs/{logId}")
    fun deleteLog(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable logId: Long,
    ): ResponseEntity<Void> {
        workspaceLogService.deleteLog(
            requireNotNull(user.id),
            workspaceId,
            logId,
        )

        return ResponseEntity.noContent().build()
    }
}
