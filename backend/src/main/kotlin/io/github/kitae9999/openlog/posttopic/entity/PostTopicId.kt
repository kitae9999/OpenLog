package io.github.kitae9999.openlog.posttopic.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import java.io.Serializable

@Embeddable
data class PostTopicId(
    @Column(name = "post_id")
    val postId: Long = 0L,
    @Column(name = "topic_id")
    val topicId: Long = 0L,
) : Serializable
