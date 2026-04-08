package io.github.kitae9999.openlog.comment.repository

import io.github.kitae9999.openlog.comment.entity.Comment
import org.springframework.data.jpa.repository.JpaRepository

interface CommentRepository: JpaRepository<Comment,Long> {
    fun findAllByPostId(postId: Long) : List<Comment>
}