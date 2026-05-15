package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.dto.DeviceStartResponse
import io.github.kitae9999.openlog.auth.dto.DeviceTokenResponse
import io.github.kitae9999.openlog.auth.dto.DeviceTokenStatus
import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Service
import org.springframework.web.util.UriComponentsBuilder
import java.security.SecureRandom
import java.time.Duration
import java.util.Locale
import java.util.UUID

@Service
class DeviceAuthService(
    private val redisTemplate: StringRedisTemplate,
    private val jwtTokenService: JwtTokenService,
    @Value("\${app.frontend-home-url:http://localhost:3030}")
    private val frontendHomeUrl: String,
) {
    fun start(): DeviceStartResponse {
        val deviceCode = UUID.randomUUID().toString()
        val userCode = generateUserCode()
        val verificationUri = UriComponentsBuilder
            .fromUriString(frontendHomeUrl)
            .path("/cli-login")
            .build()
            .toUriString()
        val verificationUriComplete = UriComponentsBuilder
            .fromUriString(verificationUri)
            .queryParam("code", userCode)
            .build()
            .toUriString()

        redisTemplate.opsForValue().set(
            deviceKey(deviceCode),
            PENDING_VALUE,
            DEVICE_CODE_TTL,
        )
        redisTemplate.opsForValue().set(
            userKey(userCode),
            deviceCode,
            DEVICE_CODE_TTL,
        )

        return DeviceStartResponse(
            deviceCode = deviceCode,
            userCode = userCode,
            verificationUri = verificationUri,
            verificationUriComplete = verificationUriComplete,
            expiresIn = DEVICE_CODE_TTL.toSeconds().toInt(),
            interval = POLLING_INTERVAL_SECONDS,
        )
    }

    fun approve(userCode: String, currentUser: User) {
        val normalizedUserCode = normalizeUserCode(userCode)
        val deviceCode = redisTemplate.opsForValue().get(userKey(normalizedUserCode))
            ?: throw BadRequestException("만료되었거나 잘못된 CLI 로그인 코드입니다.")
        val key = deviceKey(deviceCode)
        val currentValue = redisTemplate.opsForValue().get(key)
            ?: throw BadRequestException("만료되었거나 잘못된 CLI 로그인 코드입니다.")

        if (currentValue != PENDING_VALUE) {
            throw BadRequestException("이미 승인된 CLI 로그인 코드입니다.")
        }

        val remainingSeconds = redisTemplate.getExpire(key)
        if (remainingSeconds <= 0) {
            throw BadRequestException("만료되었거나 잘못된 CLI 로그인 코드입니다.")
        }

        redisTemplate.opsForValue().set(
            key,
            "$APPROVED_VALUE:${jwtTokenService.createAccessToken(currentUser)}",
            Duration.ofSeconds(remainingSeconds),
        )
        redisTemplate.delete(userKey(normalizedUserCode))
    }

    fun token(deviceCode: String): DeviceTokenResponse {
        val key = deviceKey(deviceCode)
        val currentValue = redisTemplate.opsForValue().get(key)
            ?: throw BadRequestException("만료되었거나 잘못된 device code입니다.")

        if (currentValue == PENDING_VALUE) {
            return DeviceTokenResponse(
                status = DeviceTokenStatus.PENDING,
                interval = POLLING_INTERVAL_SECONDS,
            )
        }

        if (!currentValue.startsWith("$APPROVED_VALUE:")) {
            throw BadRequestException("잘못된 device code 상태입니다.")
        }

        redisTemplate.delete(key)

        return DeviceTokenResponse(
            status = DeviceTokenStatus.APPROVED,
            accessToken = currentValue.removePrefix("$APPROVED_VALUE:"),
            expiresIn = jwtTokenService.accessTokenTtl().toSeconds().toInt(),
        )
    }

    private fun generateUserCode(): String {
        val code = (1..USER_CODE_LENGTH).map {
            USER_CODE_ALPHABET[random.nextInt(USER_CODE_ALPHABET.length)]
        }.joinToString("")

        return "${code.substring(0, 4)}-${code.substring(4)}"
    }

    private fun normalizeUserCode(userCode: String): String =
        userCode.trim().uppercase(Locale.US)

    private fun deviceKey(deviceCode: String): String =
        "$DEVICE_CODE_KEY_PREFIX$deviceCode"

    private fun userKey(userCode: String): String =
        "$USER_CODE_KEY_PREFIX${normalizeUserCode(userCode)}"

    private companion object {
        private val DEVICE_CODE_TTL: Duration = Duration.ofMinutes(10)
        private const val POLLING_INTERVAL_SECONDS = 2
        private const val DEVICE_CODE_KEY_PREFIX = "auth:device:code:"
        private const val USER_CODE_KEY_PREFIX = "auth:device:user:"
        private const val PENDING_VALUE = "PENDING"
        private const val APPROVED_VALUE = "APPROVED"
        private const val USER_CODE_LENGTH = 8
        private const val USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        private val random = SecureRandom()
    }
}

