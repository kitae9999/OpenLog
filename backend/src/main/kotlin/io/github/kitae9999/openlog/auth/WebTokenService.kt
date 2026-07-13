package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.entity.WebRefreshSession
import io.github.kitae9999.openlog.auth.exception.InvalidRefreshTokenException
import io.github.kitae9999.openlog.auth.repository.WebRefreshSessionRepository
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Duration
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.Base64
import java.util.HexFormat

@Service
class WebTokenService(
    private val jwtTokenService: JwtTokenService,
    private val refreshSessionRepository: WebRefreshSessionRepository,
    @Value("\${auth.web.refresh-token-expiration-seconds:2592000}")
    private val refreshTokenExpirationSeconds: Long,
) {
    @Transactional
    fun issue(user: User): WebTokenPair {
        val now = LocalDateTime.now(ZoneOffset.UTC)
        val refreshToken = generateRefreshToken()
        refreshSessionRepository.save(
            WebRefreshSession(
                user = user,
                tokenHash = hash(refreshToken),
                expiresAt = now.plusSeconds(refreshTokenExpirationSeconds),
                createdAt = now,
            ),
        )

        return WebTokenPair(
            accessToken = jwtTokenService.createAccessToken(user),
            refreshToken = refreshToken,
            refreshExpiresIn = refreshTokenExpirationSeconds,
        )
    }

    @Transactional
    fun refresh(refreshToken: String): String {
        val session = refreshSessionRepository.findByTokenHashForUpdate(hash(refreshToken))
            ?: throw InvalidRefreshTokenException()
        val now = LocalDateTime.now(ZoneOffset.UTC)

        if (session.isExpired(now)) {
            refreshSessionRepository.delete(session)
            throw InvalidRefreshTokenException()
        }

        session.markUsed(now)
        return jwtTokenService.createAccessToken(session.user)
    }

    @Transactional
    fun revoke(refreshToken: String) {
        refreshSessionRepository.findByTokenHashForUpdate(hash(refreshToken))
            ?.let(refreshSessionRepository::delete)
    }

    private fun generateRefreshToken(): String {
        val bytes = ByteArray(REFRESH_TOKEN_BYTES)
        secureRandom.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private fun hash(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(token.toByteArray(StandardCharsets.UTF_8))
        return HexFormat.of().formatHex(digest)
    }

    fun refreshTokenTtl(): Duration = Duration.ofSeconds(refreshTokenExpirationSeconds)

    private companion object {
        private const val REFRESH_TOKEN_BYTES = 32
        private val secureRandom = SecureRandom()
    }
}

data class WebTokenPair(
    val accessToken: String,
    val refreshToken: String,
    val refreshExpiresIn: Long,
)
