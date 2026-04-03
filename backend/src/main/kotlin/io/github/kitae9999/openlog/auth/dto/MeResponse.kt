package io.github.kitae9999.openlog.auth.dto

data class MeResponse(
    val id : Long,
    val username: String?,
    val nickname: String?,
    val profileImageUrl: String?,
    val email: String?,
    val bio: String?,
    val isOnboardingComplete: Boolean,
)
