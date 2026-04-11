package io.github.kitae9999.openlog.comment

import io.github.kitae9999.openlog.comment.dto.CommentResponse
import io.github.kitae9999.openlog.comment.entity.Comment
import io.github.kitae9999.openlog.comment.repository.CommentRepository
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.optionals.getOrNull

@Service
class CommentService(
    private val commentRepository: CommentRepository,
    private val postRepository: PostRepository,
    private val userRepository: UserRepository
) {
    @Transactional
    fun createComment(userId: Long, postId: Long, content: String) {
        val author = userRepository.findById(userId).getOrNull() ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
        val post = postRepository.findById(postId).getOrNull() ?: throw NotFoundException("포스트를 찾을 수 없습니다.")

        commentRepository.save(
            Comment(
                user = author,
                post = post,
                content = content,
            )
        )
    }

    /**
     * 포스트에는 댓글이 없을 수도 있음
     */
    @Transactional(readOnly = true)
    fun getPostComments(postId: Long): List<CommentResponse> {
        if (!postRepository.existsById(postId)) {
            throw NotFoundException("포스트를 찾을 수 없습니다.")
        }

        return commentRepository.findAllByPostIdWithUser(postId)
            .map(::toCommentResponse) // 함수 참조 전달
    }

    private fun toCommentResponse(comment: Comment): CommentResponse {
        val author = comment.user

        return CommentResponse(
            id = requireNotNull(comment.id),
            authorName = resolveAuthorName(author),
            authorProfileImageUrl = author.profileImageUrl,
            content = comment.content,
            createdAt = comment.createdAt.toString(),
        )
    }

    private fun resolveAuthorName(user: User): String {
        return when {
            !user.nickname.isNullOrBlank() -> user.nickname.orEmpty()
            !user.username.isNullOrBlank() -> user.username.orEmpty()
            !user.email.isNullOrBlank() -> user.email.orEmpty()
            else -> "OpenLog member"
        }
    }
}
