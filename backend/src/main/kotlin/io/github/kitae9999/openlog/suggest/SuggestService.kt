package io.github.kitae9999.openlog.suggest

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.suggest.dto.SuggestionDetailResponse
import io.github.kitae9999.openlog.suggest.dto.SuggestionSummaryResponse
import io.github.kitae9999.openlog.suggest.entity.Suggestion
import io.github.kitae9999.openlog.suggest.entity.SuggestionAction
import io.github.kitae9999.openlog.suggest.entity.SuggestionStatus
import io.github.kitae9999.openlog.suggest.repository.SuggestionRepository
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
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
                updatedAt = suggestion.updatedAt,
                commentCount = 0,
            )
        }
    }

    @Transactional
    fun createPostSuggestion(
        userId: Long,
        postId: Long ,
        title: String,
        description: String,
        content: String
    ){
        val postToSuggest = postRepository.findById(postId).getOrNull() ?: throw NotFoundException("포스트가 존재하지 않습니다.")
        val author = userRepository.findById(userId).getOrNull()
            ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        suggestionRepository.save(
            Suggestion(
                post = postToSuggest,
                user = author,
                title = title,
                content = content,
                baseContent = postToSuggest.content,
                description = description,
                postBaseVersion = postToSuggest.version
            )
        )
    }

    @Transactional
    fun getSuggestionDetail(
        postId: Long,
        suggestionId: Long
    ): SuggestionDetailResponse {
        val suggestion = suggestionRepository.findDetailWithUserByIdAndPostId(suggestionId, postId)
            ?: throw NotFoundException("포스트에 존재하지 않는 Suggestion입니다.")

        return SuggestionDetailResponse(
            id = requireNotNull(suggestion.id),
            title = suggestion.title,
            content = suggestion.content,
            baseContent = suggestion.baseContent,
            description = suggestion.description,
            status = suggestion.status,
            authorId = requireNotNull(suggestion.user.id),
            authorName = suggestion.user.nickname
                ?: suggestion.user.username
                ?: "Unknown",
            authorProfileImageUrl = suggestion.user.profileImageUrl,
            createdAt = suggestion.createdAt,
            postBaseVersion = suggestion.postBaseVersion,
        )
    }

    @Transactional
    fun manageSuggestion(
        userId: Long,
        postId: Long,
        suggestionId: Long,
        action: SuggestionAction
    ){
        when (action) {
            SuggestionAction.MERGE -> mergeSuggestion(userId, postId, suggestionId)
            SuggestionAction.CLOSE -> closeSuggestion(userId, postId, suggestionId)
            SuggestionAction.REJECT -> rejectSuggestion(userId, postId, suggestionId)
        }
    }

    private fun mergeSuggestion(
        userId: Long,
        postId: Long,
        suggestionId: Long
    ) {
        val suggestion = getPostAuthorManageableSuggestion(userId, postId, suggestionId)
        val post = suggestion.post

        if (suggestion.postBaseVersion != post.version) {
            throw BadRequestException("현재 글 버전과 제안 기준 버전이 다릅니다.")
        }

        post.updatePost(
            slug = post.slug,
            title = post.title,
            description = post.description,
            content = suggestion.content,
        )
        suggestion.markMerged()
        suggestionRepository.markOtherOpenSuggestionsOutdated(
            postId = postId,
            excludedSuggestionId = requireNotNull(suggestion.id),
        )
    }

    private fun closeSuggestion(
        userId: Long,
        postId: Long,
        suggestionId: Long
    ) {
        val suggestion = getOwnerManageableSuggestion(userId, postId, suggestionId)
        suggestion.markClosed()
    }

    private fun rejectSuggestion(
        userId: Long,
        postId: Long,
        suggestionId: Long
    ) {
        val suggestion = getPostAuthorManageableSuggestion(userId, postId, suggestionId)
        suggestion.markRejected()
    }

    private fun getPostAuthorManageableSuggestion(
        userId: Long,
        postId: Long,
        suggestionId: Long
    ): Suggestion {
        val suggestion = suggestionRepository.findManageableWithPostAuthorByIdAndPostId(suggestionId, postId)
            ?: throw NotFoundException("포스트에 존재하지 않는 Suggestion입니다.")

        if (suggestion.post.author.id != userId) {
            throw ForbiddenException("권한이 없습니다.")
        }

        if (suggestion.status != SuggestionStatus.OPEN) {
            throw BadRequestException("이미 처리된 Suggestion입니다.")
        }

        return suggestion
    }

    private fun getOwnerManageableSuggestion(
        userId: Long,
        postId: Long,
        suggestionId: Long
    ): Suggestion {
        val suggestion = suggestionRepository.findManageableWithPostAuthorByIdAndPostId(suggestionId, postId)
            ?: throw NotFoundException("포스트에 존재하지 않는 Suggestion입니다.")

        if (suggestion.user.id != userId) {
            throw ForbiddenException("권한이 없습니다.")
        }

        if (suggestion.status != SuggestionStatus.OPEN) {
            throw BadRequestException("이미 처리된 Suggestion입니다.")
        }

        return suggestion
    }

    @Transactional
    fun updateSuggestion(
        userId: Long,
        postId: Long,
        suggestionId: Long,
        title: String,
        description: String,
        content: String,
    ){
        val suggestion = getOwnerManageableSuggestion(userId, postId, suggestionId)

        suggestion.updateSuggestion(
            title = title,
            description = description,
            content = content
        )
    }
}
