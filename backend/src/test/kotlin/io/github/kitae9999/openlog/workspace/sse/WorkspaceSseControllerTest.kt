package io.github.kitae9999.openlog.workspace.sse

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.WorkspaceAccessResolver
import io.micrometer.core.instrument.simple.SimpleMeterRegistry
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class WorkspaceSseControllerTest {
    @Mock
    private lateinit var workspaceAccessResolver: WorkspaceAccessResolver

    @Test
    fun `subscribe applies configured emitter timeout`() {
        val hub = WorkspaceSseHub(SimpleMeterRegistry())
        val controller = WorkspaceSseController(
            workspaceAccessResolver = workspaceAccessResolver,
            workspaceSseHub = hub,
            emitterTimeoutMs = 600_000L,
        )

        val emitter = controller.subscribe(User(id = 7L), 3L)

        assertThat(emitter.timeout).isEqualTo(600_000L)
        assertThat(hub.subscriberCount(3L)).isEqualTo(1)
        verify(workspaceAccessResolver).requireOwnedWorkspace(7L, 3L)
        hub.unregister(3L, emitter)
    }
}
