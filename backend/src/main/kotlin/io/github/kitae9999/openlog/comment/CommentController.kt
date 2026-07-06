package io.github.kitae9999.openlog.comment

import io.github.kitae9999.openlog.comment.dto.CommentResponse
import io.github.kitae9999.openlog.comment.dto.CreateCommentRequest
import io.github.kitae9999.openlog.comment.dto.UpdateCommentRequest
import io.github.kitae9999.openlog.user.entity.User
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

//todo: commentsid가 전역 pk니까 posts/postId/comments/commentsid 구조는 변경해야될듯

@RestController
@RequestMapping("/posts/{postId}/comments")
class CommentController(
    private val commentService: CommentService,
) {
    @PostMapping
    fun createComment(
        @AuthenticationPrincipal user: User,
        @PathVariable postId: Long, // @PathVariable("postId") postId: Long 축약형
        @Valid @RequestBody createCommentRequest: CreateCommentRequest,
    ): ResponseEntity<CommentResponse> {
        val createdComment = commentService.createComment(user, postId, createCommentRequest.content)

        return ResponseEntity.status(201).body(createdComment)
    }

    @GetMapping
    fun getPostComments(
        @AuthenticationPrincipal user: User?,
        @PathVariable postId: Long,
    ): List<CommentResponse> {
        return commentService.getPostComments(postId, user?.id)
    }

    @DeleteMapping("/{commentId}")
    fun deleteComment(
        @AuthenticationPrincipal user: User,
        @PathVariable postId: Long,
        @PathVariable commentId: Long,
    ): ResponseEntity<Void> {
        commentService.deleteComment(requireNotNull(user.id), postId, commentId)
        return ResponseEntity.noContent().build()
    }

    @PatchMapping("/{commentId}")
    fun updateComment(
        @AuthenticationPrincipal user: User,
        @PathVariable postId: Long,
        @PathVariable commentId: Long,
        @Valid @RequestBody updateCommentRequest: UpdateCommentRequest,
    ): ResponseEntity<CommentResponse> {
        val updatedComment = commentService.updateComment(
            requireNotNull(user.id),
            postId,
            commentId,
            updateCommentRequest.content,
        )

        return ResponseEntity.ok(updatedComment)
    }
}
