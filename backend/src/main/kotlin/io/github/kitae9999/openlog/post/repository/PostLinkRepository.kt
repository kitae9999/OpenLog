package io.github.kitae9999.openlog.post.repository

import io.github.kitae9999.openlog.post.entity.PostLink
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository

interface PostLinkRepository : JpaRepository<PostLink, Long> {
    fun findAllBySourcePostId(sourcePostId: Long): List<PostLink>

    fun deleteAllBySourcePostId(sourcePostId: Long)

    @EntityGraph(attributePaths = ["sourcePost", "targetPost"])
    fun findAllBySourcePostIdIn(sourcePostIds: Collection<Long>): List<PostLink>
}
