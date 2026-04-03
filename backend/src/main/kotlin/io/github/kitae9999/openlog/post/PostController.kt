package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.blog.repository.BlogRepository
import io.github.kitae9999.openlog.post.dto.CreatePostRequest
import io.github.kitae9999.openlog.user.repository.UserRepository
import jakarta.servlet.http.HttpServletRequest
import jakarta.transaction.Transactional
import jakarta.validation.Valid
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import kotlin.jvm.optionals.getOrNull

@RestController
@RequestMapping("posts")
class PostController(
    val postService: PostService,
    @Value("\${auth.jwt.cookie-name:openlog_access_token}")
    private val accessTokenCookieName: String,
    val currentUserResolver: CurrentUserResolver,
    val userRepository: UserRepository,
    val blogRepository: BlogRepository
) {
    @Transactional
    @PostMapping()
    fun createPost(
        request: HttpServletRequest,
        @Valid @RequestBody createPostRequest: CreatePostRequest
    ) {
        val userId = currentUserResolver.resolveUserId(request)
        val author = userRepository.findById(userId).getOrNull()
        val blog = blogRepository.findByUser(author);
        val (title, description, content) = createPostRequest

    }
}