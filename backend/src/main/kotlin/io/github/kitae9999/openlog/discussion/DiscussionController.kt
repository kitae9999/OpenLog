package io.github.kitae9999.openlog.discussion

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.discussion.dto.DiscussionResponse
import io.github.kitae9999.openlog.discussion.dto.WriteDiscussionRequest
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PatchMapping
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
        @Valid @RequestBody createDiscussionRequest: WriteDiscussionRequest,
        @PathVariable postId: Long,
        @PathVariable suggestionId: Long,
    ): ResponseEntity<DiscussionResponse> {
        val currentUser = currentUserResolver.resolveCurrentUser(request)

        val discussion = discussionService.createDiscussion(
            currentUser = currentUser,
            postId = postId,
            suggestionId = suggestionId,
            content = createDiscussionRequest.content
        )

        return ResponseEntity.status(201).body(discussion)
    }

    @DeleteMapping("{discussionId}")
    fun deleteDiscussion(
        request: HttpServletRequest,
        @PathVariable postId: Long,
        @PathVariable suggestionId: Long,
        @PathVariable discussionId: Long,
    ): ResponseEntity<Void> {
        val currentUser = currentUserResolver.resolveCurrentUser(request)

        discussionService.deleteDiscussion(
            userId = requireNotNull(currentUser.id),
            postId = postId,
            suggestionId = suggestionId,
            discussionId = discussionId
        )

        return ResponseEntity.noContent().build()
    }

    @PatchMapping("{discussionId}")
    fun updateDiscussion(
        request: HttpServletRequest,
        @Valid @RequestBody updateDiscussionRequest: WriteDiscussionRequest,
        @PathVariable postId: Long,
        @PathVariable suggestionId: Long,
        @PathVariable discussionId: Long,
    ): ResponseEntity<DiscussionResponse> {
        val currentUser = currentUserResolver.resolveCurrentUser(request)
        val updatedDiscussion = discussionService.updateDiscussion(
            userId = requireNotNull(currentUser.id),
            postId = postId,
            suggestionId = suggestionId,
            discussionId = discussionId,
            content = updateDiscussionRequest.content,
        )

        return ResponseEntity.ok(updatedDiscussion)
    }
}
