package io.github.kitae9999.openlog.suggest

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.suggest.dto.WriteSuggestionRequest
import io.github.kitae9999.openlog.suggest.dto.ManageSuggestionRequest
import io.github.kitae9999.openlog.suggest.dto.SuggestionDetailResponse
import io.github.kitae9999.openlog.suggest.dto.SuggestionSummaryResponse
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping()
class SuggestController(
    private val suggestService: SuggestService,
    private val currentUserResolver: CurrentUserResolver,
) {
    @GetMapping("/posts/{postId}/suggestions")
    fun getPostSuggestion(
        @PathVariable postId: Long
    ): List<SuggestionSummaryResponse> {
        return suggestService.getPostSuggestions(postId)
    }

    @PostMapping("/posts/{postId}/suggestions")
    fun createPostSuggestion(
        @PathVariable postId: Long,
        @RequestBody createSuggestionRequest: WriteSuggestionRequest,
        request: HttpServletRequest
    ){
        val userId = currentUserResolver.resolveUserIdFromJwt(request)
        val (title, description, content) = createSuggestionRequest
        suggestService.createPostSuggestion(userId, postId, title, description, content)
    }

    @GetMapping("/posts/{postId}/suggestions/{suggestionId}")
    fun getSuggestionDetail(
        @PathVariable postId: Long,
        @PathVariable suggestionId: Long,
    ): SuggestionDetailResponse {
        return suggestService.getSuggestionDetail(postId, suggestionId)
    }

    @PostMapping("/posts/{postId}/suggestions/{suggestionId}/resolutions")
    fun manageSuggestion(
        @PathVariable postId: Long,
        @PathVariable suggestionId: Long,
        request: HttpServletRequest,
        @RequestBody manageSuggestionRequest: ManageSuggestionRequest,
    ): ResponseEntity<Void> {
        val userId = currentUserResolver.resolveUserIdFromJwt(request)
        val action = manageSuggestionRequest.action

        suggestService.manageSuggestion(
            userId = userId,
            postId = postId,
            suggestionId = suggestionId,
            action = action
        )

        return ResponseEntity.noContent().build()
    }

    @PatchMapping("/posts/{postId}/suggestions/{suggestionId}")
    fun updateSuggestion(
        @PathVariable postId: Long,
        @PathVariable suggestionId: Long,
        request: HttpServletRequest,
        @RequestBody updateSuggestionRequest: WriteSuggestionRequest
    ): ResponseEntity<Void>{
        val userId = currentUserResolver.resolveUserIdFromJwt(request)
        suggestService.updateSuggestion(
            userId = userId,
            postId = postId,
            suggestionId = suggestionId,
            title = updateSuggestionRequest.title,
            description = updateSuggestionRequest.description,
            content = updateSuggestionRequest.content
        )

        return ResponseEntity.noContent().build()
    }
}
