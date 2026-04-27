package io.github.kitae9999.openlog.comment

import io.github.kitae9999.openlog.comment.dto.CommentResponse
import io.github.kitae9999.openlog.comment.entity.Comment
import io.github.kitae9999.openlog.comment.repository.CommentRepository
import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.optionals.getOrNull

@Service
class CommentService(
    private val commentRepository: CommentRepository,
    private val postRepository: PostRepository,
) {
    @Transactional
    fun createComment(author: User, postId: Long, content: String): CommentResponse {
        val post = postRepository.findById(postId).getOrNull() ?: throw NotFoundException("포스트를 찾을 수 없습니다.")

        val savedComment = commentRepository.save(
            Comment(
                user = author,
                post = post,
                content = content,
            )
        )

        return toCommentResponse(savedComment, userId = requireNotNull(author.id))
    }

    /**
     * 포스트에는 댓글이 없을 수도 있음
     */
    @Transactional(readOnly = true)
    fun getPostComments(postId: Long, userId: Long?): List<CommentResponse> {
        if (!postRepository.existsById(postId)) {
            throw NotFoundException("포스트를 찾을 수 없습니다.")
        }

        return commentRepository.findAllWithUserByPostId(postId)
            .map { comment -> toCommentResponse(comment, userId) }
    }

    private fun toCommentResponse(comment: Comment, userId: Long?): CommentResponse {
        val author = comment.user
        val authorId = requireNotNull(author.id)

        return CommentResponse(
            id = requireNotNull(comment.id),
            authorName = resolveAuthorName(author),
            authorProfileImageUrl = author.profileImageUrl,
            content = comment.content,
            createdAt = comment.createdAt.toString(),
            canManage = userId == authorId,
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

    @Transactional
    fun deleteComment(userId: Long, postId: Long, commentId: Long) {
        val comment = getManageableComment(userId, postId, commentId)
        commentRepository.delete(comment)
    }

    @Transactional
    fun updateComment(userId: Long, postId: Long, commentId: Long, content: String): CommentResponse {
        val comment = getManageableComment(userId, postId, commentId)
        comment.updateComment(content)

        return toCommentResponse(comment, userId = userId)
    }

    private fun getManageableComment(userId: Long, postId: Long, commentId: Long): Comment {
        val comment = commentRepository.findById(commentId).getOrNull()
            ?: throw NotFoundException("댓글을 찾을 수 없습니다.")

        if (comment.post.id != postId) {
            throw BadRequestException("잘못된 접근입니다.")
        }

        if (comment.user.id != userId) {
            throw ForbiddenException()
        }

        return comment
    }
}
