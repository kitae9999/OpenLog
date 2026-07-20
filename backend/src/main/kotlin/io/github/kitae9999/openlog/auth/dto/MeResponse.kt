package io.github.kitae9999.openlog.auth.dto

import io.github.kitae9999.openlog.user.entity.User

data class MeResponse(
    val id : Long,
    val username: String?,
    val nickname: String?,
    val profileImageUrl: String?,
    val email: String?,
    val bio: String?,
    val isOnboardingComplete: Boolean,
)

fun User.toMeResponse(): MeResponse {
    return MeResponse(
        id = requireNotNull(id),
        username = username,
        nickname = nickname,
        email = email,
        profileImageUrl = profileImageUrl,
        bio = bio,
        isOnboardingComplete = isOnboardingComplete(),
    )
}
