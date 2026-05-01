package io.github.kitae9999.openlog.common.event

interface EventPublisher {
    fun <T: Any> publish(topic: String, key: String, event: T)
}