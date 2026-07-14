package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.UpdateWorkspaceAgentGuideRequest
import io.github.kitae9999.openlog.workspace.dto.WorkspaceAgentGuideResponse
import jakarta.validation.Valid
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/workspaces/{workspaceId}/agent-guide")
class WorkspaceAgentGuideController(
    private val guideService: WorkspaceAgentGuideService,
) {
    @GetMapping
    fun getGuide(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
    ): WorkspaceAgentGuideResponse {
        return guideService.getGuide(requireNotNull(user.id), workspaceId)
    }

    @PutMapping
    fun updateGuide(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @Valid @RequestBody request: UpdateWorkspaceAgentGuideRequest,
    ): WorkspaceAgentGuideResponse {
        return guideService.updateGuide(requireNotNull(user.id), workspaceId, request)
    }
}
