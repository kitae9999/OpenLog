package io.github.kitae9999.openlog.postlike

import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.postlike.entity.PostLike
import io.github.kitae9999.openlog.user.repository.UserRepository
import jakarta.transaction.Transactional
import org.springframework.stereotype.Service

@Service
class PostLikeService(
    private val postLikeRepository: PostLikeRepository,
    private val postRepository: PostRepository,
    private val userRepository: UserRepository
) {

    @Transactional
    fun toggleLike(userId: Long, postId: Long): Boolean {
        val postLike = postLikeRepository.findByPostIdAndUserId(postId, userId)

        if (postLike != null) {
            postLikeRepository.delete(postLike)
            return false
        } else {
            if (!postRepository.existsById(postId)) {
                throw NotFoundException("포스트를 찾을 수 없습니다.")
            }

            val post = postRepository.getReferenceById(postId)
            val user = userRepository.getReferenceById(userId)

            postLikeRepository.save(
                PostLike(
                    user = user,
                    post = post
                )
            )
            return true
        }
    }
}
