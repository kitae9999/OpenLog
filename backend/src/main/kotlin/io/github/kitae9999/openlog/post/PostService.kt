package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.blog.repository.BlogRepository
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.dto.CreatePostRequest
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.user.repository.UserRepository
import jakarta.transaction.Transactional
import org.springframework.stereotype.Service
import kotlin.jvm.optionals.getOrNull

@Service
class PostService(
    private val blogRepository: BlogRepository,
    private val postRepository: PostRepository,
    private val userRepository: UserRepository,
) {
    @Transactional
    fun createPost(userId: Long, createPostRequest: CreatePostRequest): Post {
        val user = userRepository.findById(userId).getOrNull() ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        val blog = blogRepository.findByUserId(userId) ?: throw NotFoundException("블로그를 찾을 수 없습니다.")
        val (title, description, content) = createPostRequest

        return postRepository.save(
            Post(
                blog = blog,
                author = user,
                title = title,
                description = description,
                content = content,
            )
        )
    }
}
