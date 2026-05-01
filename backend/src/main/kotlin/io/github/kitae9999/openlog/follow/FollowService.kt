package io.github.kitae9999.openlog.follow

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.follow.dto.FollowUserResponse
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
        val (targetUser, followId) = resolveTargetUserAndFollowId(targetUsername, currentUser)

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

    @Transactional
    fun unfollowUser(
        targetUsername: String,
        currentUser: User
    ) {
        val (_, followId) = resolveTargetUserAndFollowId(targetUsername, currentUser)

        if (!followRepository.existsById(followId)) {
            return
        }

        followRepository.deleteById(followId)
    }


    @Transactional
    fun getFollowers(
        username: String
    ): List<FollowUserResponse> {
        val user = findUserByUsername(username)
        val userId = requireNotNull(user.id)

        return followRepository.findAllByFollowedUser_IdOrderByCreatedAtDesc(userId)
            .map { it.followingUser.toFollowUserResponse() }
    }

    @Transactional
    fun getFollowing(
        username: String
    ): List<FollowUserResponse> {
        val user = findUserByUsername(username)
        val userId = requireNotNull(user.id)

        return followRepository.findAllByFollowingUser_IdOrderByCreatedAtDesc(userId)
            .map { it.followedUser.toFollowUserResponse() }
    }

    private fun resolveTargetUserAndFollowId(
        targetUsername: String,
        currentUser: User,
    ): Pair<User, FollowId> {
        val targetUser = findUserByUsername(targetUsername)

        val currentUserId = requireNotNull(currentUser.id)
        val targetUserId = requireNotNull(targetUser.id)

        if (currentUserId == targetUserId) {
            throw BadRequestException("자기 자신은 팔로우할 수 없습니다.")
        }

        return targetUser to FollowId( // User, FollowId 타입의 pair 생성
            followingUserId = currentUserId,
            followedUserId = targetUserId,
        )
    }

    private fun findUserByUsername(username: String): User {
        return userRepository.findByUsername(username) ?: throw NotFoundException("사용자를 찾을 수 없습니다.")
    }

    private fun User.toFollowUserResponse(): FollowUserResponse {
        return FollowUserResponse(
            username = requireNotNull(username),
            nickname = nickname,
            profileImageUrl = profileImageUrl,
        )
    }
}
