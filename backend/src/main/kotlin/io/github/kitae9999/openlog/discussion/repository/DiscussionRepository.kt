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

    fun countBySuggestionId(suggestionId: Long): Long
}
