package io.github.kitae9999.openlog.auth.dto

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
    val interval: Int? = null,
)

enum class DeviceTokenStatus {
    PENDING,
    APPROVED,
}

