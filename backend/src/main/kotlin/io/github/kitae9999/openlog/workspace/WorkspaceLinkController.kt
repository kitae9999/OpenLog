package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateLogLinkRequest
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
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
    @PostMapping("/{workspaceId}/log-links")
    fun createLogLink(
        @AuthenticationPrincipal user: User,
        @PathVariable("workspaceId") workspaceId: Long,
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
}
