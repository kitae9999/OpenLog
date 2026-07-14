package io.github.kitae9999.openlog.workspace.sse

import io.github.kitae9999.openlog.common.event.payload.WorkspaceChangedEventPayload
import io.github.kitae9999.openlog.workspace.WorkspaceChangeNotifier
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.slf4j.LoggerFactory
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper
import java.nio.charset.StandardCharsets

@Component
class WorkspaceSseEventHandler(
    private val workspaceSseHub: WorkspaceSseHub,
    private val objectMapper: ObjectMapper,
) {
    @KafkaListener(
        topics = [TOPIC],
        groupId = "#{@workspaceSseConsumerGroupId}",
        properties = ["auto.offset.reset:latest"],
    )
    fun handleWorkspaceEvents(record: ConsumerRecord<String, String>) {
        val eventType = record.headerValue("eventType") ?: return
        if (eventType != WorkspaceChangeNotifier.EVENT_TYPE) {
            return
        }

        val payload = try {
            objectMapper.readValue(record.value(), WorkspaceChangedEventPayload::class.java)
        } catch (ex: Exception) {
            logger.warn("Failed to parse workspace-events payload: {}", ex.message)
            return
        }

        workspaceSseHub.publish(
            workspaceId = payload.workspaceId,
            eventName = EVENT_NAME,
            data = payload,
        )
    }

    private fun ConsumerRecord<String, String>.headerValue(name: String): String? {
        return headers().lastHeader(name)
            ?.value()
            ?.let { String(it, StandardCharsets.UTF_8) }
    }

    companion object {
        const val TOPIC = "workspace-events"
        const val EVENT_NAME = "workspace.changed"

        private val logger = LoggerFactory.getLogger(WorkspaceSseEventHandler::class.java)
    }
}
