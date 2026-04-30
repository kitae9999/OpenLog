package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.post.command.PostWriteCommand
import io.github.kitae9999.openlog.post.dto.PostWriteResponse
import io.github.kitae9999.openlog.post.dto.PostWriteRequest
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("posts")
class PostController(
    private val postService: PostService,
    private val currentUserResolver: CurrentUserResolver,
) {
    @PostMapping()
    fun createPost(
        request: HttpServletRequest,
        @Valid @RequestBody postWriteRequest: PostWriteRequest
    ): ResponseEntity<PostWriteResponse> {
        val currentUser = currentUserResolver.resolveCurrentUser(request)
        val (title, description, content, topics) = postWriteRequest
        val createdPost = postService.createPost(currentUser, PostWriteCommand(
            title = title,
            description = description,
            content = content,
            topics = topics,
        ))

        return ResponseEntity.status(201).body(createdPost)
    }

    @DeleteMapping("{postId}")
    fun deletePost(
        @PathVariable postId: Long,
        request: HttpServletRequest,
    ): ResponseEntity<Void>{
        val currentUser = currentUserResolver.resolveCurrentUser(request)

        postService.deletePost(requireNotNull(currentUser.id), postId)

        return ResponseEntity.noContent().build()
    }


    @PutMapping("{postId}")
    fun updatePost(
        @PathVariable postId: Long,
        request: HttpServletRequest,
        @Valid @RequestBody postWriteRequest: PostWriteRequest,
    ): ResponseEntity<PostWriteResponse> {
        val currentUser = currentUserResolver.resolveCurrentUser(request)
        val (title, description, content, topics) = postWriteRequest
        val updatedPost = postService.updatePost(
            requireNotNull(currentUser.id),
            postId,
            PostWriteCommand(
                title = title,
                description = description,
                content = content,
                topics = topics,
            )
        )

        return ResponseEntity.ok(updatedPost)
    }
}
