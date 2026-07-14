package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateWorkspaceProjectRequest
import io.github.kitae9999.openlog.workspace.dto.UpdateWorkspaceProjectRequest
import io.github.kitae9999.openlog.workspace.dto.WorkspaceAgentContextResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceProjectResponse
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class WorkspaceProjectController(
    private val projectService: WorkspaceProjectService,
) {
    @GetMapping("/workspaces/{workspaceId}/projects")
    fun listProjects(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
    ): List<WorkspaceProjectResponse> {
        return projectService.listProjects(requireNotNull(user.id), workspaceId)
    }

    @PostMapping("/workspaces/{workspaceId}/projects")
    fun createProject(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @Valid @RequestBody request: CreateWorkspaceProjectRequest,
    ): ResponseEntity<WorkspaceProjectResponse> {
        return ResponseEntity.status(201).body(projectService.createProject(user, workspaceId, request))
    }

    @GetMapping("/workspace-projects/{projectId}")
    fun getProject(
        @AuthenticationPrincipal user: User,
        @PathVariable projectId: Long,
    ): WorkspaceProjectResponse {
        return projectService.getProject(requireNotNull(user.id), projectId)
    }

    @GetMapping("/workspace-projects/resolve")
    fun resolveProject(
        @AuthenticationPrincipal user: User,
        @RequestParam repositoryFullName: String,
    ): WorkspaceProjectResponse {
        return projectService.resolveProject(requireNotNull(user.id), repositoryFullName)
    }

    @GetMapping("/workspace-projects/{projectId}/agent-context")
    fun getAgentContext(
        @AuthenticationPrincipal user: User,
        @PathVariable projectId: Long,
    ): WorkspaceAgentContextResponse {
        return projectService.getAgentContext(requireNotNull(user.id), projectId)
    }

    @PatchMapping("/workspace-projects/{projectId}")
    fun updateProject(
        @AuthenticationPrincipal user: User,
        @PathVariable projectId: Long,
        @Valid @RequestBody request: UpdateWorkspaceProjectRequest,
    ): WorkspaceProjectResponse {
        return projectService.updateProject(requireNotNull(user.id), projectId, request)
    }

    @DeleteMapping("/workspace-projects/{projectId}")
    fun deleteProject(
        @AuthenticationPrincipal user: User,
        @PathVariable projectId: Long,
    ): ResponseEntity<Void> {
        projectService.deleteProject(requireNotNull(user.id), projectId)
        return ResponseEntity.noContent().build()
    }
}
