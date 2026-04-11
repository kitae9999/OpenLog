package io.github.kitae9999.openlog.comment

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.comment.dto.CommentResponse
import io.github.kitae9999.openlog.comment.dto.CreateCommentRequest
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/posts/{postId}/comments")
class CommentController(
    private val currentUserResolver: CurrentUserResolver,
    private val commentService: CommentService,
) {
    @PostMapping()
    fun createComment(
        @PathVariable postId: Long, // @PathVariable("postId") postId: Long 축약형
        @Valid @RequestBody createCommentRequest: CreateCommentRequest,
        request: HttpServletRequest,
    ): ResponseEntity<CommentResponse> {
        val currentUserId = currentUserResolver.resolveUserId(request)
        val content = createCommentRequest.content
        val createdComment = commentService.createComment(currentUserId, postId, content)

        return ResponseEntity.status(201).body(createdComment)
    }

    @GetMapping()
    fun getPostComments(
        @PathVariable postId: Long,
    ): List<CommentResponse> {
        return commentService.getPostComments(postId)
    }
}
