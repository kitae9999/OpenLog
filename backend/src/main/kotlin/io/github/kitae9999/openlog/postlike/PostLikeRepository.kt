package io.github.kitae9999.openlog.postlike

import io.github.kitae9999.openlog.postlike.entity.PostLike
import io.github.kitae9999.openlog.post.entity.PostStatus
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface PostLikeRepository : JpaRepository<PostLike, Long> {
    fun findByPostIdAndUserId(postId: Long, userId: Long): PostLike?
    fun existsByPostIdAndUserId(postId: Long, userId: Long): Boolean
    fun countByPostId(postId: Long): Long

    @Modifying
    @Query(
        value = """
            INSERT INTO post_likes (post_id, user_id)
            VALUES (:postId, :userId)
            ON CONFLICT (post_id, user_id) DO NOTHING
        """,
        nativeQuery = true,
    )
    fun insertIgnoringDuplicate(
        @Param("postId") postId: Long,
        @Param("userId") userId: Long,
    ): Int

    @Modifying
    @Query(
        """
        delete from PostLike pl
        where pl.post.id = :postId
          and pl.user.id = :userId
        """
    )
    fun deleteByPostIdAndUserId(
        @Param("postId") postId: Long,
        @Param("userId") userId: Long,
    ): Int

    @Query(
        """
        select pl
        from PostLike pl
        join fetch pl.post p
        join fetch p.author
        where pl.user.id = :userId
        order by pl.createdAt desc, pl.id desc
        """
    )
    fun findLikedPostsByUserId(
        @Param("userId") userId: Long,
        pageable: Pageable,
    ): List<PostLike>

    @Query(
        """
        select pl
        from PostLike pl
        join fetch pl.post p
        join fetch p.author
        where pl.user.id = :userId
          and (
            pl.createdAt < :createdAt
            or (pl.createdAt = :createdAt and pl.id < :id)
          )
        order by pl.createdAt desc, pl.id desc
        """
    )
    fun findLikedPostsAfterCursor(
        @Param("userId") userId: Long,
        @Param("createdAt") createdAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<PostLike>

    @Query(
        """
        select pl
        from PostLike pl
        join fetch pl.post p
        join fetch p.author
        where pl.user.id = :userId
          and p.status = :status
        order by pl.createdAt desc, pl.id desc
        """
    )
    fun findPublishedLikedPostsByUserId(
        @Param("userId") userId: Long,
        @Param("status") status: PostStatus,
        pageable: Pageable,
    ): List<PostLike>

    @Query(
        """
        select pl
        from PostLike pl
        join fetch pl.post p
        join fetch p.author
        where pl.user.id = :userId
          and p.status = :status
          and (
            pl.createdAt < :createdAt
            or (pl.createdAt = :createdAt and pl.id < :id)
          )
        order by pl.createdAt desc, pl.id desc
        """
    )
    fun findPublishedLikedPostsAfterCursor(
        @Param("userId") userId: Long,
        @Param("status") status: PostStatus,
        @Param("createdAt") createdAt: LocalDateTime,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<PostLike>

    @Query(
        """
        select pl.post.id as postId, count(pl) as count
        from PostLike pl
        where pl.post.id in :postIds
        group by pl.post.id
        """
    )
    fun countAllByPostIdIn(@Param("postIds") postIds: Collection<Long>): List<PostLikeCount>
}

interface PostLikeCount {
    val postId: Long
    val count: Long
}
