package io.github.kitae9999.openlog.post.repository

import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.entity.PostStatus
import jakarta.persistence.LockModeType
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface PostRepository: JpaRepository<Post, Long> {
    fun existsByAuthorIdAndSlug(authorId: Long, slug: String): Boolean
    fun existsByAuthorIdAndSlugAndIdNot(authorId: Long, slug: String, id: Long): Boolean
    fun findByAuthorIdAndSlug(authorId: Long, slug: String): Post?
    fun findByAuthorIdAndSlugAndStatus(authorId: Long, slug: String, status: PostStatus): Post?
    fun findByIdAndStatus(id: Long, status: PostStatus): Post?
    fun existsByIdAndStatus(id: Long, status: PostStatus): Boolean
    fun findByOutputId(outputId: Long): Post?
    fun findAllByAuthorIdAndTitle(authorId: Long, title: String): List<Post>
    fun findAllByAuthorIdAndTitleAndStatus(authorId: Long, title: String, status: PostStatus): List<Post>
    fun findAllByAuthorIdOrderByCreatedAtDesc(authorId: Long): List<Post>
    fun findAllByAuthorIdAndStatusOrderByPublishedAtDesc(authorId: Long, status: PostStatus): List<Post>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        """
        select p
        from Post p
        where p.id = :postId
        """
    )
    fun findByIdForUpdate(@Param("postId") postId: Long): Post?

    @EntityGraph(attributePaths = ["author"])
    fun findAllByOrderByCreatedAtDescIdDesc(pageable: Pageable): List<Post>

    @EntityGraph(attributePaths = ["author"])
    fun findAllByStatusOrderByPublishedAtDescIdDesc(status: PostStatus, pageable: Pageable): List<Post>

    @EntityGraph(attributePaths = ["author"])
    fun findAllByAuthorIdOrderByCreatedAtDescIdDesc(authorId: Long, pageable: Pageable): List<Post>

    @EntityGraph(attributePaths = ["author"])
    fun findAllByAuthorIdAndStatusOrderByPublishedAtDescIdDesc(
        authorId: Long,
        status: PostStatus,
        pageable: Pageable,
    ): List<Post>

    @EntityGraph(attributePaths = ["author"])
    fun findAllByAuthorIdAndStatusInOrderByUpdatedAtDescIdDesc(
        authorId: Long,
        statuses: Collection<PostStatus>,
        pageable: Pageable,
    ): List<Post>

    @EntityGraph(attributePaths = ["author"])
    @Query(
        """
        select p
        from Post p
        where p.author.id = :authorId
          and p.status = :status
          and (
            p.publishedAt < :publishedAt
            or (p.publishedAt = :publishedAt and p.id < :id)
          )
        order by p.publishedAt desc, p.id desc
        """
    )
    fun findPublishedAuthoredPostsAfterCursor(
        @Param("authorId") authorId: Long,
        @Param("status") status: PostStatus,
        @Param("publishedAt") publishedAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<Post>

    @EntityGraph(attributePaths = ["author"])
    @Query(
        """
        select p
        from Post p
        where p.author.id = :authorId
          and p.status in :statuses
          and (
            p.updatedAt < :updatedAt
            or (p.updatedAt = :updatedAt and p.id < :id)
          )
        order by p.updatedAt desc, p.id desc
        """
    )
    fun findPrivateAuthoredPostsAfterCursor(
        @Param("authorId") authorId: Long,
        @Param("statuses") statuses: Collection<PostStatus>,
        @Param("updatedAt") updatedAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<Post>

    @EntityGraph(attributePaths = ["author"])
    @Query(
        """
        select p
        from Post p
        where p.author.id = :authorId
          and (
            p.createdAt < :createdAt
            or (p.createdAt = :createdAt and p.id < :id)
          )
        order by p.createdAt desc, p.id desc
        """
    )
    fun findAuthoredPostsAfterCursor(
        @Param("authorId") authorId: Long,
        @Param("createdAt") createdAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<Post>

    @EntityGraph(attributePaths = ["author"])
    @Query(
        """
        select p
        from Post p
        where p.author.id in (
            select f.followedUser.id
            from Follow f
            where f.followingUser.id = :userId
        )
        order by p.createdAt desc, p.id desc
        """
    )
    fun findFollowingPostsByUserId(
        @Param("userId") userId: Long,
        pageable: Pageable,
    ): List<Post>

    @EntityGraph(attributePaths = ["author"])
    @Query(
        """
        select p
        from Post p
        where p.author.id in (
            select f.followedUser.id
            from Follow f
            where f.followingUser.id = :userId
        )
          and (
            p.createdAt < :createdAt
            or (p.createdAt = :createdAt and p.id < :id)
          )
        order by p.createdAt desc, p.id desc
        """
    )
    fun findFollowingPostsAfterCursor(
        @Param("userId") userId: Long,
        @Param("createdAt") createdAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<Post>

    @EntityGraph(attributePaths = ["author"])
    @Query(
        """
        select p
        from Post p
        where p.status = :status
          and p.author.id in (
            select f.followedUser.id
            from Follow f
            where f.followingUser.id = :userId
        )
        order by p.publishedAt desc, p.id desc
        """
    )
    fun findPublishedFollowingPostsByUserId(
        @Param("userId") userId: Long,
        @Param("status") status: PostStatus,
        pageable: Pageable,
    ): List<Post>

    @EntityGraph(attributePaths = ["author"])
    @Query(
        """
        select p
        from Post p
        where p.status = :status
          and p.author.id in (
            select f.followedUser.id
            from Follow f
            where f.followingUser.id = :userId
        )
          and (
            p.publishedAt < :publishedAt
            or (p.publishedAt = :publishedAt and p.id < :id)
          )
        order by p.publishedAt desc, p.id desc
        """
    )
    fun findPublishedFollowingPostsAfterCursor(
        @Param("userId") userId: Long,
        @Param("status") status: PostStatus,
        @Param("publishedAt") publishedAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<Post>

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

    @EntityGraph(attributePaths = ["author"])
    @Query(
        """
        select p
        from Post p
        where p.status = :status
          and (
            p.publishedAt < :publishedAt
            or (p.publishedAt = :publishedAt and p.id < :id)
          )
        order by p.publishedAt desc, p.id desc
        """
    )
    fun findPublishedPostsAfterCursor(
        @Param("status") status: PostStatus,
        @Param("publishedAt") publishedAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<Post>
}
