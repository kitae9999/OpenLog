package io.github.kitae9999.openlog.workspace.sse

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.WorkspaceAccessResolver
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
@RequestMapping("/workspaces")
class WorkspaceSseController(
    private val workspaceAccessResolver: WorkspaceAccessResolver,
    private val workspaceSseHub: WorkspaceSseHub,
    @Value("\${openlog.workspace-sse.timeout-ms:600000}")
    private val emitterTimeoutMs: Long,
) {
    @GetMapping(
        path = ["/{workspaceId}/events"],
        produces = [MediaType.TEXT_EVENT_STREAM_VALUE],
    )
    fun subscribe(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
    ): SseEmitter {
        workspaceAccessResolver.requireOwnedWorkspace(requireNotNull(user.id), workspaceId)

        // 0L = no timeout; heartbeat keeps the connection alive
        // Use the configured finite timeout instead to bound orphaned connections.
        val emitter = SseEmitter(emitterTimeoutMs)
        workspaceSseHub.register(workspaceId, emitter)

        try {
            emitter.send(
                SseEmitter.event()
                    .name("workspace.subscribed")
                    .data(mapOf("workspaceId" to workspaceId)),
            )
        } catch (ex: Exception) {
            workspaceSseHub.unregister(workspaceId, emitter)
            emitter.completeWithError(ex)
        }

        return emitter
    }
}
