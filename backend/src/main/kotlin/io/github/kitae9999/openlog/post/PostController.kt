package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.post.dto.CreatePostRequest
import io.github.kitae9999.openlog.post.dto.CreatePostResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
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
        @Valid @RequestBody createPostRequest: CreatePostRequest
    ): ResponseEntity<CreatePostResponse> {
        val userId = currentUserResolver.resolveUserId(request)
        val createdPost = postService.createPost(userId, createPostRequest)

        return ResponseEntity.status(201).body(createdPost)
    }
}
