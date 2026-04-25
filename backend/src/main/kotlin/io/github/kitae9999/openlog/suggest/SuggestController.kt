package io.github.kitae9999.openlog.suggest

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.suggest.dto.CreateSuggestionRequest
import io.github.kitae9999.openlog.suggest.dto.SuggestionSummaryResponse
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.GetMapping
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
        @RequestBody createSuggestionRequest: CreateSuggestionRequest,
        request: HttpServletRequest
    ){
        val userId = currentUserResolver.resolveUserIdFromJwt(request)
        val (title, description, content) = createSuggestionRequest
        suggestService.createPostSuggestion(userId, postId, title, description, content)
    }

//    @GetMapping("/posts/{postId}/suggestions/{suggestionId}")
//    fun getSuggestionDetail(
//        @PathVariable postId: Long,
//        @PathVariable suggestionId: Long,
//        ){
//        return suggestService.getSuggestionDetail(postId,suggestionId)
//    }
}
