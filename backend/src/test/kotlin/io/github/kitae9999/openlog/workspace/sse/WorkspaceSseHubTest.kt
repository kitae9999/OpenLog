package io.github.kitae9999.openlog.workspace.sse

import io.micrometer.core.instrument.simple.SimpleMeterRegistry
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.function.Consumer

class WorkspaceSseHubTest {
    @Test
    fun `publish is a no-op when no subscribers are registered`() {
        val hub = WorkspaceSseHub(SimpleMeterRegistry())

        hub.publish(3L, "workspace.changed", mapOf("workspaceId" to 3L))

        assertThat(hub.subscriberCount(3L)).isZero()
    }

    @Test
    fun `register and unregister track subscribers`() {
        val hub = WorkspaceSseHub(SimpleMeterRegistry())
        val emitter = SseEmitter(0L)

        hub.register(3L, emitter)
        assertThat(hub.subscriberCount(3L)).isEqualTo(1)

        hub.unregister(3L, emitter)
        assertThat(hub.subscriberCount(3L)).isZero()
    }

    @Test
    fun `active connection gauge tracks subscribers across workspaces`() {
        val meterRegistry = SimpleMeterRegistry()
        val hub = WorkspaceSseHub(meterRegistry)
        val firstEmitter = SseEmitter(0L)
        val secondEmitter = SseEmitter(0L)

        hub.register(3L, firstEmitter)
        hub.register(4L, secondEmitter)

        assertThat(hub.totalSubscriberCount()).isEqualTo(2)
        assertThat(
            meterRegistry.get("openlog.sse.connections.active").gauge().value(),
        ).isEqualTo(2.0)

        hub.unregister(3L, firstEmitter)
        assertThat(
            meterRegistry.get("openlog.sse.connections.active").gauge().value(),
        ).isEqualTo(1.0)

        hub.unregister(4L, secondEmitter)
        assertThat(
            meterRegistry.get("openlog.sse.connections.active").gauge().value(),
        ).isZero()
    }

    @Test
    fun `completion callback unregisters subscriber`() {
        val hub = WorkspaceSseHub(SimpleMeterRegistry())
        val emitter = RecordingSseEmitter()

        hub.register(3L, emitter)
        emitter.completionCallback.run()

        assertThat(hub.subscriberCount(3L)).isZero()
    }

    @Test
    fun `timeout callback unregisters subscriber`() {
        val hub = WorkspaceSseHub(SimpleMeterRegistry())
        val emitter = RecordingSseEmitter()

        hub.register(3L, emitter)
        emitter.timeoutCallback.run()

        assertThat(hub.subscriberCount(3L)).isZero()
    }

    @Test
    fun `error callback unregisters subscriber`() {
        val hub = WorkspaceSseHub(SimpleMeterRegistry())
        val emitter = RecordingSseEmitter()

        hub.register(3L, emitter)
        emitter.errorCallback.accept(IllegalStateException("disconnected"))

        assertThat(hub.subscriberCount(3L)).isZero()
    }

    private class RecordingSseEmitter : SseEmitter(0L) {
        lateinit var completionCallback: Runnable
        lateinit var timeoutCallback: Runnable
        lateinit var errorCallback: Consumer<Throwable>

        override fun onCompletion(callback: Runnable) {
            completionCallback = callback
        }

        override fun onTimeout(callback: Runnable) {
            timeoutCallback = callback
        }

        override fun onError(callback: Consumer<Throwable>) {
            errorCallback = callback
        }
    }
}
