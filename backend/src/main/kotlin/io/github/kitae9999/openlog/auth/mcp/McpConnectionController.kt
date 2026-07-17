package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.user.entity.User
import jakarta.validation.Valid
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/auth/mcp/connections")
@ConditionalOnProperty(prefix = "auth.mcp", name = ["enabled"], havingValue = "true")
class McpConnectionController(
    private val connectionService: McpConnectionService,
) {
    @GetMapping
    fun list(@AuthenticationPrincipal user: User): List<McpConnectionResponse> =
        connectionService.list(requireNotNull(user.id))

    @PatchMapping("/{connectionId}")
    fun update(
        @AuthenticationPrincipal user: User,
        @PathVariable connectionId: UUID,
        @Valid @RequestBody request: UpdateMcpConnectionRequest,
    ): McpConnectionResponse = connectionService.update(
        userId = requireNotNull(user.id),
        connectionId = connectionId,
        profile = McpPermissionProfile.fromWireValue(request.permissionProfile),
    )

    @DeleteMapping("/{connectionId}")
    fun revoke(
        @AuthenticationPrincipal user: User,
        @PathVariable connectionId: UUID,
    ): ResponseEntity<Void> {
        connectionService.revoke(requireNotNull(user.id), connectionId)
        return ResponseEntity.noContent().build()
    }
}
