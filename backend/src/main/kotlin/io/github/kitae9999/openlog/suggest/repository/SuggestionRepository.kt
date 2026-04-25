package io.github.kitae9999.openlog.suggest.repository

import io.github.kitae9999.openlog.suggest.entity.Suggestion
import org.springframework.data.jpa.repository.JpaRepository
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
    fun findByIdAndPostId(
        @Param("suggestionId") suggestionId: Long,
        @Param("postId") postId: Long,
    ): Suggestion?
}
