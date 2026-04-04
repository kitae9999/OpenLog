package io.github.kitae9999.openlog.topic.repository

import io.github.kitae9999.openlog.topic.entity.Topic
import org.springframework.data.jpa.repository.JpaRepository

interface TopicRepository : JpaRepository<Topic, Long> {
    fun findByNameIn(names: Collection<String>): List<Topic>
}
