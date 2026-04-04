package io.github.kitae9999.openlog.posttopic.repository

import io.github.kitae9999.openlog.posttopic.entity.PostTopic
import io.github.kitae9999.openlog.posttopic.entity.PostTopicId
import org.springframework.data.jpa.repository.JpaRepository

interface PostTopicRepository : JpaRepository<PostTopic, PostTopicId> {
    fun findAllByPostId(postId: Long): List<PostTopic>
}
