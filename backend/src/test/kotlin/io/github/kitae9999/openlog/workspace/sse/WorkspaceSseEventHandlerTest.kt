package io.github.kitae9999.openlog.workspace.sse

import io.github.kitae9999.openlog.common.event.payload.WorkspaceChangedEventPayload
import io.github.kitae9999.openlog.workspace.WorkspaceChangeNotifier
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.Mockito.mockingDetails
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.junit.jupiter.MockitoExtension
import tools.jackson.databind.ObjectMapper
import java.nio.charset.StandardCharsets
import java.time.Instant

@ExtendWith(MockitoExtension::class)
class WorkspaceSseEventHandlerTest {
    @Mock
    private lateinit var workspaceSseHub: WorkspaceSseHub

    private lateinit var handler: WorkspaceSseEventHandler
    private val objectMapper = ObjectMapper()

    @BeforeEach
    fun setUp() {
        handler = WorkspaceSseEventHandler(
            workspaceSseHub = workspaceSseHub,
            objectMapper = objectMapper,
        )
    }

    @Test
    fun `handleWorkspaceEvents publishes payload to hub`() {
        val payload = WorkspaceChangedEventPayload(
            workspaceId = 3L,
            zone = "tasks",
            entityType = "TASK",
            entityId = "42",
            action = "CREATED",
            occurredAt = Instant.parse("2026-07-14T16:00:00Z"),
        )
        val record = ConsumerRecord(
            "workspace-events",
            0,
            0,
            "42",
            objectMapper.writeValueAsString(payload),
        )
        record.headers().add(
            "eventType",
            WorkspaceChangeNotifier.EVENT_TYPE.toByteArray(StandardCharsets.UTF_8),
        )

        handler.handleWorkspaceEvents(record)

        val invocation = mockingDetails(workspaceSseHub).invocations
            .single { it.method.name == "publish" }
        assertThat(invocation.arguments[0]).isEqualTo(3L)
        assertThat(invocation.arguments[1]).isEqualTo(WorkspaceSseEventHandler.EVENT_NAME)
        assertThat(invocation.arguments[2]).isInstanceOf(WorkspaceChangedEventPayload::class.java)
        assertThat((invocation.arguments[2] as WorkspaceChangedEventPayload).entityId)
            .isEqualTo("42")
    }

    @Test
    fun `handleWorkspaceEvents ignores unknown event types`() {
        val record = ConsumerRecord(
            "workspace-events",
            0,
            0,
            "42",
            "{}",
        )
        record.headers().add(
            "eventType",
            "OTHER".toByteArray(StandardCharsets.UTF_8),
        )

        handler.handleWorkspaceEvents(record)

        verifyNoInteractions(workspaceSseHub)
    }
}
