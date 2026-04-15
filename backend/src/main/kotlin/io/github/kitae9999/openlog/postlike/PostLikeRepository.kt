package io.github.kitae9999.openlog.postlike

import io.github.kitae9999.openlog.postlike.entity.PostLike
import org.springframework.data.jpa.repository.JpaRepository

interface PostLikeRepository : JpaRepository<PostLike, Long> {
    fun findByPostIdAndUserId(postId: Long, userId: Long): PostLike?
}