package io.github.kitae9999.openlog.post.repository

import io.github.kitae9999.openlog.post.entity.Post
import org.springframework.data.jpa.repository.JpaRepository

interface PostRepository: JpaRepository<Post, Long> {
    fun existsByAuthorIdAndSlug(authorId: Long, slug: String): Boolean
    fun existsByAuthorIdAndSlugAndIdNot(authorId: Long, slug: String, id: Long): Boolean
    fun findByAuthorIdAndSlug(authorId: Long, slug: String): Post?
    fun findAllByAuthorIdOrderByCreatedAtDesc(authorId: Long): List<Post>
}
