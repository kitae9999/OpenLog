package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.blog.repository.BlogRepository
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.dto.CreatePostRequest
import jakarta.servlet.http.HttpServletRequest
import jakarta.transaction.Transactional
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("posts")
class PostController(
    val postService: PostService,
    val currentUserResolver: CurrentUserResolver,
    val blogRepository: BlogRepository
) {
    @Transactional
    @PostMapping()
    fun createPost(
        request: HttpServletRequest,
        @Valid @RequestBody createPostRequest: CreatePostRequest
    ) {
        val userId = currentUserResolver.resolveUserId(request)
        val blog = blogRepository.findByUserId(userId) ?: throw NotFoundException("블로그를 찾을 수 없습니다.")

        val (title, description, content) = createPostRequest

    }
}
