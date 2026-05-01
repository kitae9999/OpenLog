package io.github.kitae9999.openlog.common.event

import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Component

@Component
class KafkaEventPublisher(
    private val kafkaTemplate: KafkaTemplate<String, Any>
) {
    fun <T : Any> publish(topic: String, key: String, event: T) {
        kafkaTemplate.send(topic, key, event) // Topic, Key, Value
    }
}
