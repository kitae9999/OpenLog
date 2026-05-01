package io.github.kitae9999.openlog.follow

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.follow.entity.Follow
import io.github.kitae9999.openlog.follow.entity.FollowId
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class FollowService(
    private val followRepository: FollowRepository,
    private val userRepository: UserRepository
) {
    @Transactional
    fun followUser(
        targetUsername: String,
        currentUser: User
    ) {
        val targetUser = userRepository.findByUsername(targetUsername) ?: throw NotFoundException("사용자를 찾을 수 없습니다.")

        val currentUserId = requireNotNull(currentUser.id)
        val targetUserId = requireNotNull(targetUser.id)

        if (currentUserId == targetUserId) {
            throw BadRequestException("자기 자신은 팔로우할 수 없습니다.")
        }

        val followId = FollowId(
            followingUserId = currentUserId,
            followedUserId = targetUserId,
        )

        if (followRepository.existsById(followId)) {
            return
        }

        followRepository.save(
            Follow(
                followingUser = currentUser,
                followedUser = targetUser,
            )
        )
    }

}
