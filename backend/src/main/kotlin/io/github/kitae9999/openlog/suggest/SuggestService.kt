package io.github.kitae9999.openlog.suggest

import io.github.kitae9999.openlog.suggest.repository.SuggestionRepository
import org.springframework.stereotype.Service

@Service
class SuggestService(
    val suggestionRepository: SuggestionRepository
) {
    fun getPostSuggestions(postId: Long){
        val suggestions = suggestionRepository.findAllByPostId(postId)

    }

    fun createPostSuggestion(){

    }
}