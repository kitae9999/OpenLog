package io.github.kitae9999.openlog.user.dto

data class PublicUserProfileResponse(
    val username: String,
    val nickname: String?,
    val profileImageUrl: String?,
    val isOpenLogOfficial: Boolean,
    val bio: String?,
    val location: String?,
    val websiteUrl: String?,
    val joinedAt: String,
    val following: Boolean,
    val followersCount: Long,
    val followingCount: Long,
)
