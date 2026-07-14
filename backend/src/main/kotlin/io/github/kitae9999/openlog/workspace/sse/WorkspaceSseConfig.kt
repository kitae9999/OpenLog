package io.github.kitae9999.openlog.workspace.sse

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.Scheduled
import java.net.InetAddress

@Configuration
class WorkspaceSseConfig(
    private val workspaceSseHub: WorkspaceSseHub,
) {
    @Bean("workspaceSseConsumerGroupId")
    fun workspaceSseConsumerGroupId(
        @Value("\${openlog.instance-id:}") configuredInstanceId: String,
    ): String {
        val instanceId = configuredInstanceId.ifBlank {
            runCatching { InetAddress.getLocalHost().hostName }.getOrDefault("local")
        }
        return "openlog-workspace-sse-$instanceId"
    }

    // SSE 연결 유지용 heartbeat (약 15초)
    @Scheduled(fixedDelayString = "\${openlog.workspace-sse.heartbeat-ms:15000}")
    fun sendHeartbeats() {
        workspaceSseHub.heartbeat()
    }
}
