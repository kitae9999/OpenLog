package io.github.kitae9999.openlog.log

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.log.dto.WorkspaceLogCursorResponse
import io.github.kitae9999.openlog.log.dto.WorkspaceLogResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping
class WorkspaceLogController(
    private val workspaceLogService: WorkspaceLogService,
    private val currentUserResolver: CurrentUserResolver
) {
    @GetMapping("{workspaceId}/logs")
    fun getLogs(
        request: HttpServletRequest,
        @PathVariable workspaceId: Long,
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "20") size: Int,
    ): WorkspaceLogCursorResponse {
        val user = currentUserResolver.resolveCurrentUser(request)
        
        return workspaceLogService.getLogs(requireNotNull(user.id), workspaceId, cursor, size)
    }
    
    
    @GetMapping("{workspaceId}/{taskId}/logs")
    fun getLogsByTask(
        request: HttpServletRequest,
        @PathVariable workspaceId: Long,
        @PathVariable taskId: Long,
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "20") size: Int,
    ): WorkspaceLogCursorResponse {
        val user = currentUserResolver.resolveCurrentUser(request)

        return workspaceLogService.getLogsByTask(
            requireNotNull(user.id),
            taskId,
            workspaceId,
            cursor,
            size
        )
    }
    
    @PostMapping
    fun createLog(
        request: HttpServletRequest,
        @PathVariable workspaceId: Long,
        @Valid @RequestBody createLogRequest: CreateLogRequest,
    ): ResponseEntity<WorkspaceLogResponse> {
        val user = currentUserResolver.resolveCurrentUser(request)
        val createdLog = workspaceLogService.createLog(user, workspaceId, createLogRequest)

        return ResponseEntity.status(201).body(createdLog)
    }
}
