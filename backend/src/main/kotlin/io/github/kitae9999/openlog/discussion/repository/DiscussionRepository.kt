package io.github.kitae9999.openlog.discussion.repository

import io.github.kitae9999.openlog.discussion.entity.Discussion
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface DiscussionRepository : JpaRepository<Discussion, Long> {
    @Query(
        """
        select d
        from Discussion d
        join fetch d.user
        where d.suggestion.id = :suggestionId
        order by d.createdAt asc
        """
    )
    fun findAllWithUserBySuggestionId(@Param("suggestionId") suggestionId: Long): List<Discussion>

    @Query(
        """
        select d
        from Discussion d
        join fetch d.user
        where d.id = :discussionId
          and d.suggestion.id = :suggestionId
          and d.suggestion.post.id = :postId
        """
    )
    fun findWithUserByIdAndSuggestionIdAndPostId(
        @Param("discussionId") discussionId: Long,
        @Param("suggestionId") suggestionId: Long,
        @Param("postId") postId: Long,
    ): Discussion?

    fun countBySuggestionId(suggestionId: Long): Long
}
