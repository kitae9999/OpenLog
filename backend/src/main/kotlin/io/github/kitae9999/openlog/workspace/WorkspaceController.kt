package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateWorkspaceRequest
import io.github.kitae9999.openlog.workspace.dto.UpdateWorkspaceRequest
import io.github.kitae9999.openlog.workspace.dto.WorkspaceResponse
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
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("workspaces")
class WorkspaceController(
    private val workspaceService: WorkspaceService,
) {
    @GetMapping
    fun getWorkspaces(
        @AuthenticationPrincipal user: User,
    ): List<WorkspaceResponse> {
        return workspaceService.getWorkspaces(requireNotNull(user.id))
    }

    @GetMapping("{workspaceId}")
    fun getWorkspace(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
    ): WorkspaceResponse {
        return workspaceService.getWorkspace(requireNotNull(user.id), workspaceId)
    }

    @PostMapping
    fun createWorkspace(
        @AuthenticationPrincipal user: User,
        @Valid @RequestBody createWorkspaceRequest: CreateWorkspaceRequest,
    ): ResponseEntity<WorkspaceResponse> {
        val createdWorkspace = workspaceService.createWorkspace(user, createWorkspaceRequest)

        return ResponseEntity.status(201).body(createdWorkspace)
    }

    @PutMapping("{workspaceId}")
    fun updateWorkspace(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @Valid @RequestBody updateWorkspaceRequest: UpdateWorkspaceRequest,
    ): WorkspaceResponse {
        return workspaceService.updateWorkspace(
            requireNotNull(user.id),
            workspaceId,
            updateWorkspaceRequest,
        )
    }

    @DeleteMapping("{workspaceId}")
    fun deleteWorkspace(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
    ): ResponseEntity<Void> {
        workspaceService.deleteWorkspace(requireNotNull(user.id), workspaceId)

        return ResponseEntity.noContent().build()
    }
}
