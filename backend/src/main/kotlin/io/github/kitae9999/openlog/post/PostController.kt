package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.post.command.PostLinkWriteCommand
import io.github.kitae9999.openlog.post.command.PostWriteCommand
import io.github.kitae9999.openlog.post.dto.PostWriteRequest
import io.github.kitae9999.openlog.post.dto.PostWriteResponse
import io.github.kitae9999.openlog.post.dto.RecentPostCursorResponse
import io.github.kitae9999.openlog.user.entity.User
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/posts")
class PostController(
    private val postService: PostService,
) {
    @GetMapping
    fun getRecentPosts(
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "10") size: Int,
    ): RecentPostCursorResponse {
        return postService.getRecentPosts(cursor, size)
    }

    @PostMapping
    fun createPost(
        @AuthenticationPrincipal user: User,
        @Valid @RequestBody postWriteRequest: PostWriteRequest,
    ): ResponseEntity<PostWriteResponse> {
        val (title, description, content, topics, links) = postWriteRequest
        val createdPost = postService.createPost(
            user,
            PostWriteCommand(
                title = title,
                description = description,
                content = content,
                topics = topics,
                links = links.map { PostLinkWriteCommand(label = it.label, targetSlug = it.targetSlug) },
            ),
        )

        return ResponseEntity.status(201).body(createdPost)
    }

    @DeleteMapping("/{postId}")
    fun deletePost(
        @AuthenticationPrincipal user: User,
        @PathVariable postId: Long,
    ): ResponseEntity<Void> {
        postService.deletePost(requireNotNull(user.id), postId)

        return ResponseEntity.noContent().build()
    }

    @PutMapping("/{postId}")
    fun updatePost(
        @AuthenticationPrincipal user: User,
        @PathVariable postId: Long,
        @Valid @RequestBody postWriteRequest: PostWriteRequest,
    ): ResponseEntity<PostWriteResponse> {
        val (title, description, content, topics, links) = postWriteRequest
        val updatedPost = postService.updatePost(
            requireNotNull(user.id),
            postId,
            PostWriteCommand(
                title = title,
                description = description,
                content = content,
                topics = topics,
                links = links.map { PostLinkWriteCommand(label = it.label, targetSlug = it.targetSlug) },
            ),
        )

        return ResponseEntity.ok(updatedPost)
    }
}
