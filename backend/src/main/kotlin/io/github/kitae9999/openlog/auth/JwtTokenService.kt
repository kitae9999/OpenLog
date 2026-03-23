package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.user.entity.User
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.nio.charset.StandardCharsets
import java.time.Duration
import java.time.Instant
import java.util.Date
import javax.crypto.SecretKey

@Service
class JwtTokenService(
    @Value("\${auth.jwt.secret:openlog-local-jwt-secret-openlog-local-jwt-secret}")
    secret: String,
    @Value("\${auth.jwt.issuer:openlog}")
    private val issuer: String,
    @Value("\${auth.jwt.access-token-expiration-seconds:3600}")
    private val accessTokenExpirationSeconds: Long,
) {
    private val signingKey: SecretKey = Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))

    fun createAccessToken(user: User): String {
        val userId = requireNotNull(user.id) { "JWT 발급 대상 사용자는 영속화되어 있어야 합니다." }
        val now = Instant.now()

        var builder = Jwts.builder()
            .subject(userId.toString())
            .issuer(issuer)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(accessTokenExpirationSeconds)))

        if (user.email != null) {
            builder = builder.claim("email", user.email)
        }

        return builder
            .signWith(signingKey)
            .compact()
    }

    fun accessTokenTtl(): Duration = Duration.ofSeconds(accessTokenExpirationSeconds)
}
