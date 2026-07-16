package io.github.kitae9999.openlog.postlike

import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.post.entity.PostStatus
import io.github.kitae9999.openlog.user.entity.User
import jakarta.transaction.Transactional
import org.springframework.stereotype.Service

@Service
class PostLikeService(
    private val postLikeRepository: PostLikeRepository,
    private val postRepository: PostRepository,
) {

    @Transactional
    fun toggleLike(user: User, postId: Long): Boolean {
        val userId = requireNotNull(user.id)
        if (!postRepository.existsByIdAndStatus(postId, PostStatus.PUBLISHED)) {
            throw NotFoundException("포스트를 찾을 수 없습니다.")
        }
        val postLike = postLikeRepository.findByPostIdAndUserId(postId, userId)

        if (postLike != null) {
            postLikeRepository.deleteByPostIdAndUserId(postId, userId)
            return false
        } else {
            postLikeRepository.insertIgnoringDuplicate(postId, userId)
            return true
        }
    }
}
