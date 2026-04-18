package io.github.kitae9999.openlog.suggest.repository

import io.github.kitae9999.openlog.suggest.entity.Suggestion
import org.springframework.data.jpa.repository.JpaRepository

interface SuggestionRepository: JpaRepository<Suggestion, Long> {
    fun findAllByPostId(postId: Long) : List<Suggestion>
}