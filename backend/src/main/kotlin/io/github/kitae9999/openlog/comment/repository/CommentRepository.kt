package io.github.kitae9999.openlog.comment.repository

import io.github.kitae9999.openlog.comment.entity.Comment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface CommentRepository : JpaRepository<Comment, Long> {
    //Todo: @EntityGraph로 수정
    @Query(
        """
        select c
        from Comment c
        join fetch c.user
        where c.post.id = :postId
        order by c.createdAt asc
        """
    )
    fun findAllWithUserByPostId(@Param("postId") postId: Long): List<Comment>
}
