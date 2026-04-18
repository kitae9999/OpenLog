package io.github.kitae9999.openlog.suggest

import io.github.kitae9999.openlog.suggest.dto.SuggestionSummaryResponse
import io.github.kitae9999.openlog.suggest.repository.SuggestionRepository
import jakarta.transaction.Transactional
import org.springframework.stereotype.Service

@Service
class SuggestService(
    val suggestionRepository: SuggestionRepository
) {
    @Transactional
    fun getPostSuggestions(postId: Long): List<SuggestionSummaryResponse> {
        val suggestions = suggestionRepository.findAllWithUserByPostId(postId)

        return suggestions.map { suggestion ->
            SuggestionSummaryResponse(
                id = requireNotNull(suggestion.id),
                title = suggestion.title,
                status = suggestion.status,
                authorName = suggestion.user.nickname
                    ?: suggestion.user.username
                    ?: "Unknown",
                authorProfileImageUrl = suggestion.user.profileImageUrl,
                createdAt = suggestion.createdAt,
                commentCount = 0,
            )
        }
    }

    fun createPostSuggestion(){

    }
}
