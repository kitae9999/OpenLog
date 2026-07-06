package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.user.entity.User
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
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
        @PathVariable workspaceId: Long,
    ): ResponseEntity<Void> {
        TODO("createLogLink 구현 필요")
    }
}
