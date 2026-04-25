package io.github.kitae9999.openlog.suggest

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.suggest.dto.SuggestionSummaryResponse
import io.github.kitae9999.openlog.suggest.entity.Suggestion
import io.github.kitae9999.openlog.suggest.repository.SuggestionRepository
import io.github.kitae9999.openlog.user.repository.UserRepository
import jakarta.transaction.Transactional
import org.springframework.stereotype.Service
import kotlin.jvm.optionals.getOrNull

@Service
class SuggestService(
    val userRepository: UserRepository,
    val postRepository: PostRepository,
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

    fun createPostSuggestion(userId: Long, postId: Long ,title: String, description: String, content: String){
        val postToSuggest = postRepository.findById(postId).getOrNull() ?: throw NotFoundException("포스트가 존재하지 않습니다.")
        val author = userRepository.findById(userId).getOrNull()
            ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        suggestionRepository.save(
            Suggestion(
                post = postToSuggest,
                user = author,
                title = title,
                content = content,
                description = description,
                postBaseVersion = postToSuggest.version
            )
        )
    }
}
