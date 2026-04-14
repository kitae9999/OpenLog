package io.github.kitae9999.openlog.user.dto

data class PublicUserProfileResponse(
    val username: String,
    val nickname: String?,
    val profileImageUrl: String?,
    val bio: String?,
    val location: String?,
    val websiteUrl: String?,
    val joinedAt: String,
)
