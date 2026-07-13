package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.entity.CliRefreshSession
import io.github.kitae9999.openlog.auth.exception.InvalidRefreshTokenException
import io.github.kitae9999.openlog.auth.repository.CliRefreshSessionRepository
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
class CliTokenService(
    private val jwtTokenService: JwtTokenService,
    private val refreshSessionRepository: CliRefreshSessionRepository,
    @Value("\${auth.cli.refresh-token-expiration-seconds:2592000}")
    private val refreshTokenExpirationSeconds: Long,
) {
    @Transactional
    fun issue(user: User): CliTokenPair {
        val now = LocalDateTime.now(ZoneOffset.UTC)
        val refreshToken = generateRefreshToken()
        refreshSessionRepository.save(
            CliRefreshSession(
                user = user,
                tokenHash = hash(refreshToken),
                expiresAt = now.plusSeconds(refreshTokenExpirationSeconds),
                createdAt = now,
            ),
        )

        return tokenPair(user, refreshToken, refreshTokenExpirationSeconds)
    }

    @Transactional
    fun refresh(refreshToken: String): CliTokenPair {
        val session = refreshSessionRepository.findByTokenHashForUpdate(hash(refreshToken))
            ?: throw InvalidRefreshTokenException()
        val now = LocalDateTime.now(ZoneOffset.UTC)

        if (session.isExpired(now)) {
            refreshSessionRepository.delete(session)
            throw InvalidRefreshTokenException()
        }

        val nextRefreshToken = generateRefreshToken()
        session.rotate(hash(nextRefreshToken), now)
        val refreshExpiresIn = Duration.between(now, session.expiresAt).seconds

        return tokenPair(session.user, nextRefreshToken, refreshExpiresIn)
    }

    @Transactional
    fun revoke(refreshToken: String) {
        refreshSessionRepository.findByTokenHashForUpdate(hash(refreshToken))
            ?.let(refreshSessionRepository::delete)
    }

    private fun tokenPair(
        user: User,
        refreshToken: String,
        refreshExpiresIn: Long,
    ): CliTokenPair = CliTokenPair(
        accessToken = jwtTokenService.createAccessToken(user),
        accessExpiresIn = jwtTokenService.accessTokenTtl().toSeconds().toInt(),
        refreshToken = refreshToken,
        refreshExpiresIn = refreshExpiresIn.coerceAtLeast(0).toInt(),
    )

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

    private companion object {
        private const val REFRESH_TOKEN_BYTES = 32
        private val secureRandom = SecureRandom()
    }
}

data class CliTokenPair(
    val accessToken: String,
    val accessExpiresIn: Int,
    val refreshToken: String,
    val refreshExpiresIn: Int,
)
