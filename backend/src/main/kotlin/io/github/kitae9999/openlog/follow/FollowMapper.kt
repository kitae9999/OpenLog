package io.github.kitae9999.openlog.follow

import io.github.kitae9999.openlog.follow.dto.FollowUserResponse
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.stereotype.Component

@Component
class FollowMapper {
    fun toUserResponse(user: User): FollowUserResponse {
        return FollowUserResponse(
            username = requireNotNull(user.username),
            nickname = user.nickname,
            profileImageUrl = user.profileImageUrl,
            isOpenLogOfficial = user.isOpenLogOfficial,
        )
    }
}
