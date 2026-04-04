package io.github.kitae9999.openlog.posttopic.entity

import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.topic.entity.Topic
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.MapsId
import jakarta.persistence.Table

@Entity
@Table(name = "post_topics")
class PostTopic(
    post: Post,
    topic: Topic,
) {
    @EmbeddedId
    var id: PostTopicId = PostTopicId(
        postId = requireNotNull(post.id),
        topicId = requireNotNull(topic.id),
    )
        protected set

    @MapsId("postId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    var post: Post = post
        protected set

    @MapsId("topicId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    var topic: Topic = topic
        protected set
}
