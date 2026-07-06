package io.github.kitae9999.openlog.suggest

import io.github.kitae9999.openlog.suggest.dto.ManageSuggestionRequest
import io.github.kitae9999.openlog.suggest.dto.SuggestionDetailResponse
import io.github.kitae9999.openlog.suggest.dto.SuggestionSummaryResponse
import io.github.kitae9999.openlog.suggest.dto.WriteSuggestionRequest
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping
class SuggestController(
    private val suggestService: SuggestService,
) {
    @GetMapping("/posts/{postId}/suggestions")
    fun getPostSuggestion(
        @PathVariable postId: Long,
    ): List<SuggestionSummaryResponse> {
        return suggestService.getPostSuggestions(postId)
    }

    @PostMapping("/posts/{postId}/suggestions")
    fun createPostSuggestion(
        @AuthenticationPrincipal user: User,
        @PathVariable postId: Long,
        @RequestBody createSuggestionRequest: WriteSuggestionRequest,
    ) {
        val (title, description, content) = createSuggestionRequest
        suggestService.createPostSuggestion(user, postId, title, description, content)
    }

    @GetMapping("/posts/{postId}/suggestions/{suggestionId}")
    fun getSuggestionDetail(
        @AuthenticationPrincipal user: User?,
        @PathVariable postId: Long,
        @PathVariable suggestionId: Long,
    ): SuggestionDetailResponse {
        return suggestService.getSuggestionDetail(
            postId = postId,
            suggestionId = suggestionId,
            currentUserId = user?.id,
        )
    }

    @PostMapping("/posts/{postId}/suggestions/{suggestionId}/resolutions")
    fun manageSuggestion(
        @AuthenticationPrincipal user: User,
        @PathVariable postId: Long,
        @PathVariable suggestionId: Long,
        @RequestBody manageSuggestionRequest: ManageSuggestionRequest,
    ): ResponseEntity<Void> {
        suggestService.manageSuggestion(
            userId = requireNotNull(user.id),
            postId = postId,
            suggestionId = suggestionId,
            action = manageSuggestionRequest.action,
        )

        return ResponseEntity.noContent().build()
    }

    @PatchMapping("/posts/{postId}/suggestions/{suggestionId}")
    fun updateSuggestion(
        @AuthenticationPrincipal user: User,
        @PathVariable postId: Long,
        @PathVariable suggestionId: Long,
        @RequestBody updateSuggestionRequest: WriteSuggestionRequest,
    ): ResponseEntity<Void> {
        suggestService.updateSuggestion(
            userId = requireNotNull(user.id),
            postId = postId,
            suggestionId = suggestionId,
            title = updateSuggestionRequest.title,
            description = updateSuggestionRequest.description,
            content = updateSuggestionRequest.content,
        )

        return ResponseEntity.noContent().build()
    }
}
