package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.post.dto.CreatePostRequest
import io.github.kitae9999.openlog.post.dto.PostDetailResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.net.URI

@RestController
@RequestMapping("posts")
class PostController(
    private val postService: PostService,
    private val currentUserResolver: CurrentUserResolver,
) {
    @GetMapping("{id}")
    fun getPost(
        @PathVariable id: Long,
    ): PostDetailResponse {
        return postService.getPostDetail(id)
    }

    @PostMapping()
    fun createPost(
        request: HttpServletRequest,
        @Valid @RequestBody createPostRequest: CreatePostRequest
    ): ResponseEntity<Void> {
        val userId = currentUserResolver.resolveUserId(request)
        val savedPost = postService.createPost(userId, createPostRequest)

        return ResponseEntity.created(URI.create("/posts/${requireNotNull(savedPost.id)}")).build()
    }
}
