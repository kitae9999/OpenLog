package io.github.kitae9999.openlog.comment

import io.github.kitae9999.openlog.comment.entity.Comment
import io.github.kitae9999.openlog.comment.repository.CommentRepository
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.springframework.stereotype.Service
import kotlin.jvm.optionals.getOrNull

@Service
class CommentService (
    private val commentRepository: CommentRepository,
    private val postRepository: PostRepository,
    private val userRepository: UserRepository
){
    fun createComment(userId: Long, postId: Long, content: String){
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
    fun getPostComments(postId: Long): List<Comment>{
        if (!commentRepository.existsById(postId)) {
            throw NotFoundException("포스트를 찾을 수 없습니다.")
        }
        return commentRepository.findAllByPostId(postId)
    }
}