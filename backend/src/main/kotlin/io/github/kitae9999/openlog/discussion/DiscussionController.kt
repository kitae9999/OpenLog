package io.github.kitae9999.openlog.discussion

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.discussion.dto.WriteDiscussionRequest
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/posts/{postId}/suggestions/{suggestionId}/discussions")
class DiscussionController(
    private val discussionService: DiscussionService,
    private val currentUserResolver: CurrentUserResolver
) {

    @PostMapping()
    fun createDiscussion(
        request: HttpServletRequest,
        @RequestBody createDiscussionRequest: WriteDiscussionRequest,
        @PathVariable postId: Long,
        @PathVariable suggestionId: Long,
    ){
        val currentUser = currentUserResolver.resolveCurrentUser(request)

        discussionService.createDiscussion(
            currentUser = currentUser,
            postId = postId,
            suggestionId = suggestionId,
            content = createDiscussionRequest.content
        )
    }
}
