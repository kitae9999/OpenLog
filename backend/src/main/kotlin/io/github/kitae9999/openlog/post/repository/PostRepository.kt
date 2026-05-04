package io.github.kitae9999.openlog.post.repository

import io.github.kitae9999.openlog.post.entity.Post
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface PostRepository: JpaRepository<Post, Long> {
    fun existsByAuthorIdAndSlug(authorId: Long, slug: String): Boolean
    fun existsByAuthorIdAndSlugAndIdNot(authorId: Long, slug: String, id: Long): Boolean
    fun findByAuthorIdAndSlug(authorId: Long, slug: String): Post?
    fun findAllByAuthorIdAndTitle(authorId: Long, title: String): List<Post>
    fun findAllByAuthorIdOrderByCreatedAtDesc(authorId: Long): List<Post>

    @EntityGraph(attributePaths = ["author"])
    fun findAllByOrderByCreatedAtDescIdDesc(pageable: Pageable): List<Post>


    /**
     * createdAt과 커서값인 포스트의 pk값보다 작은 즉, 더 이전에 작성된 포스트들 불러옴
     */
    @EntityGraph(attributePaths = ["author"])
    @Query(
        """
        select p
        from Post p
        where p.createdAt < :createdAt
           or (p.createdAt = :createdAt and p.id < :id)
        order by p.createdAt desc, p.id desc
        """
    )
    fun findRecentPostsAfterCursor(
        @Param("createdAt") createdAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<Post>
}
