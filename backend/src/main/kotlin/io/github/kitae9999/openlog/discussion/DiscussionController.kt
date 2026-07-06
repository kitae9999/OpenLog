package io.github.kitae9999.openlog.discussion

import io.github.kitae9999.openlog.discussion.dto.DiscussionResponse
import io.github.kitae9999.openlog.discussion.dto.WriteDiscussionRequest
import io.github.kitae9999.openlog.user.entity.User
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
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
) {
    @PostMapping
    fun createDiscussion(
        @AuthenticationPrincipal user: User,
        @Valid @RequestBody createDiscussionRequest: WriteDiscussionRequest,
        @PathVariable postId: Long,
        @PathVariable suggestionId: Long,
    ): ResponseEntity<DiscussionResponse> {
        val discussion = discussionService.createDiscussion(
            currentUser = user,
            postId = postId,
            suggestionId = suggestionId,
            content = createDiscussionRequest.content,
        )

        return ResponseEntity.status(201).body(discussion)
    }

    @DeleteMapping("{discussionId}")
    fun deleteDiscussion(
        @AuthenticationPrincipal user: User,
        @PathVariable postId: Long,
        @PathVariable suggestionId: Long,
        @PathVariable discussionId: Long,
    ): ResponseEntity<Void> {
        discussionService.deleteDiscussion(
            userId = requireNotNull(user.id),
            postId = postId,
            suggestionId = suggestionId,
            discussionId = discussionId,
        )

        return ResponseEntity.noContent().build()
    }

    @PatchMapping("{discussionId}")
    fun updateDiscussion(
        @AuthenticationPrincipal user: User,
        @Valid @RequestBody updateDiscussionRequest: WriteDiscussionRequest,
        @PathVariable postId: Long,
        @PathVariable suggestionId: Long,
        @PathVariable discussionId: Long,
    ): ResponseEntity<DiscussionResponse> {
        val updatedDiscussion = discussionService.updateDiscussion(
            userId = requireNotNull(user.id),
            postId = postId,
            suggestionId = suggestionId,
            discussionId = discussionId,
            content = updateDiscussionRequest.content,
        )

        return ResponseEntity.ok(updatedDiscussion)
    }
}
