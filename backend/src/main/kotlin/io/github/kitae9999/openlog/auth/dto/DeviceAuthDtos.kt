package io.github.kitae9999.openlog.auth.dto

import jakarta.validation.constraints.NotBlank

data class DeviceStartResponse(
    val deviceCode: String,
    val userCode: String,
    val verificationUri: String,
    val verificationUriComplete: String,
    val expiresIn: Int,
    val interval: Int,
)

data class DeviceApproveRequest(
    val userCode: String,
)

data class DeviceTokenRequest(
    val deviceCode: String,
)

data class DeviceTokenResponse(
    val status: DeviceTokenStatus,
    val accessToken: String? = null,
    val expiresIn: Int? = null,
    val refreshToken: String? = null,
    val refreshExpiresIn: Int? = null,
    val interval: Int? = null,
)

data class RefreshTokenRequest(
    @field:NotBlank
    val refreshToken: String,
)

data class RefreshTokenResponse(
    val accessToken: String,
    val expiresIn: Int,
    val refreshToken: String,
    val refreshExpiresIn: Int,
)

enum class DeviceTokenStatus {
    PENDING,
    APPROVED,
}
