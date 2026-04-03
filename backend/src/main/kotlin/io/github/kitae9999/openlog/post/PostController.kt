package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.post.dto.CreatePostRequest
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("posts")
class PostController(
    val postService: PostService,
    @Value("\${auth.jwt.cookie-name:openlog_access_token}")
    private val accessTokenCookieName: String,
) {

    @PostMapping()
    fun createPost(
        @Valid @RequestBody createPostRequest: CreatePostRequest
    ) {

    }
}