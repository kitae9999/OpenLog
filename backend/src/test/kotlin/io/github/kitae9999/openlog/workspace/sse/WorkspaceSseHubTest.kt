package io.github.kitae9999.openlog.workspace.sse

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

class WorkspaceSseHubTest {
    @Test
    fun `publish is a no-op when no subscribers are registered`() {
        val hub = WorkspaceSseHub()

        hub.publish(3L, "workspace.changed", mapOf("workspaceId" to 3L))

        assertThat(hub.subscriberCount(3L)).isZero()
    }

    @Test
    fun `register and unregister track subscribers`() {
        val hub = WorkspaceSseHub()
        val emitter = SseEmitter(0L)

        hub.register(3L, emitter)
        assertThat(hub.subscriberCount(3L)).isEqualTo(1)

        hub.unregister(3L, emitter)
        assertThat(hub.subscriberCount(3L)).isZero()
    }
}
