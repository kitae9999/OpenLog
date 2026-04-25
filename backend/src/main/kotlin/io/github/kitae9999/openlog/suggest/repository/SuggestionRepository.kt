package io.github.kitae9999.openlog.suggest.repository

import io.github.kitae9999.openlog.suggest.entity.Suggestion
import io.github.kitae9999.openlog.suggest.entity.SuggestionStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface SuggestionRepository: JpaRepository<Suggestion, Long> {

    @Query(
        """
        select s
        from Suggestion s
        join fetch s.user
        where s.post.id = :postId
        order by s.createdAt desc
        """
    )
    fun findAllWithUserByPostId(@Param("postId") postId: Long) : List<Suggestion>

    @Query(
        """
        select s
        from Suggestion s
        join fetch s.user
        where s.id = :suggestionId
          and s.post.id = :postId
        """
    )
    fun findDetailWithUserByIdAndPostId(
        @Param("suggestionId") suggestionId: Long,
        @Param("postId") postId: Long,
    ): Suggestion?

    fun findByIdAndPostId(suggestionId: Long, postId: Long): Suggestion?

    @Query(
        """
        select s
        from Suggestion s
        join fetch s.post p
        join fetch p.author
        where s.id = :suggestionId
          and p.id = :postId
        """
    )
    fun findManageableWithPostAuthorByIdAndPostId(
        @Param("suggestionId") suggestionId: Long,
        @Param("postId") postId: Long,
    ): Suggestion?

    @Modifying
    @Query(
        """
        update Suggestion s
        set s.status = :outdatedStatus,
            s.updatedAt = CURRENT_TIMESTAMP
        where s.post.id = :postId
          and s.status = :openStatus
        """
    )
    fun markOpenSuggestionsOutdated(
        @Param("postId") postId: Long,
        @Param("openStatus") openStatus: SuggestionStatus = SuggestionStatus.OPEN,
        @Param("outdatedStatus") outdatedStatus: SuggestionStatus = SuggestionStatus.OUTDATED,
    ): Int

    @Modifying
    @Query(
        """
        update Suggestion s
        set s.status = :outdatedStatus,
            s.updatedAt = CURRENT_TIMESTAMP
        where s.post.id = :postId
          and s.id <> :excludedSuggestionId
          and s.status = :openStatus
        """
    )
    fun markOtherOpenSuggestionsOutdated(
        @Param("postId") postId: Long,
        @Param("excludedSuggestionId") excludedSuggestionId: Long,
        @Param("openStatus") openStatus: SuggestionStatus = SuggestionStatus.OPEN,
        @Param("outdatedStatus") outdatedStatus: SuggestionStatus = SuggestionStatus.OUTDATED,
    ): Int
}
