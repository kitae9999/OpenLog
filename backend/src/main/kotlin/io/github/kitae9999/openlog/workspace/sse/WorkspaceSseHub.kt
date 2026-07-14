package io.github.kitae9999.openlog.workspace.sse

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArraySet

@Component
class WorkspaceSseHub {
    private val emittersByWorkspaceId =
        ConcurrentHashMap<Long, CopyOnWriteArraySet<SseEmitter>>()

    fun register(workspaceId: Long, emitter: SseEmitter) {
        val emitters = emittersByWorkspaceId.computeIfAbsent(workspaceId) {
            CopyOnWriteArraySet()
        }
        emitters.add(emitter)

        emitter.onCompletion { unregister(workspaceId, emitter) }
        emitter.onTimeout { unregister(workspaceId, emitter) }
        emitter.onError { unregister(workspaceId, emitter) }
    }

    fun unregister(workspaceId: Long, emitter: SseEmitter) {
        emittersByWorkspaceId[workspaceId]?.let { emitters ->
            emitters.remove(emitter)
            if (emitters.isEmpty()) {
                emittersByWorkspaceId.remove(workspaceId, emitters)
            }
        }
    }

    fun publish(workspaceId: Long, eventName: String, data: Any) {
        val emitters = emittersByWorkspaceId[workspaceId] ?: return
        for (emitter in emitters) {
            try {
                emitter.send(
                    SseEmitter.event()
                        .name(eventName)
                        .data(data),
                )
            } catch (ex: IOException) {
                logger.debug("SSE send failed for workspaceId={}: {}", workspaceId, ex.message)
                unregister(workspaceId, emitter)
                emitter.completeWithError(ex)
            } catch (ex: IllegalStateException) {
                logger.debug("SSE emitter already closed for workspaceId={}: {}", workspaceId, ex.message)
                unregister(workspaceId, emitter)
            }
        }
    }

    fun heartbeat() {
        emittersByWorkspaceId.forEach { (workspaceId, emitters) ->
            for (emitter in emitters) {
                try {
                    emitter.send(SseEmitter.event().comment("heartbeat"))
                } catch (ex: Exception) {
                    logger.debug("SSE heartbeat failed for workspaceId={}: {}", workspaceId, ex.message)
                    unregister(workspaceId, emitter)
                    try {
                        emitter.completeWithError(ex)
                    } catch (_: Exception) {
                        // already closed
                    }
                }
            }
        }
    }

    fun subscriberCount(workspaceId: Long): Int {
        return emittersByWorkspaceId[workspaceId]?.size ?: 0
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(WorkspaceSseHub::class.java)
    }
}
