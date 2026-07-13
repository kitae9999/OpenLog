package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.entity.CliRefreshSession
import io.github.kitae9999.openlog.auth.exception.InvalidRefreshTokenException
import io.github.kitae9999.openlog.auth.repository.CliRefreshSessionRepository
import io.github.kitae9999.openlog.user.entity.User
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.HexFormat

@ExtendWith(MockitoExtension::class)
class CliTokenServiceTest {
    @Mock
    private lateinit var refreshSessionRepository: CliRefreshSessionRepository

    private lateinit var jwtTokenService: JwtTokenService
    private lateinit var cliTokenService: CliTokenService
    private lateinit var user: User

    @BeforeEach
    fun setUp() {
        jwtTokenService = JwtTokenService(
            secret = "openlog-local-jwt-secret-openlog-local-jwt-secret",
            issuer = "openlog",
            accessTokenExpirationSeconds = 3600,
        )
        cliTokenService = CliTokenService(
            jwtTokenService = jwtTokenService,
            refreshSessionRepository = refreshSessionRepository,
            refreshTokenExpirationSeconds = 2592000,
        )
        user = User(id = 7L, username = "kitae9999", nickname = "ASH")
    }

    @Test
    fun `issue stores only a refresh token hash`() {
        given(refreshSessionRepository.save(any(CliRefreshSession::class.java)))
            .willAnswer { it.getArgument(0) }

        val pair = cliTokenService.issue(user)

        assertThat(pair.refreshToken).isNotBlank()
        assertThat(pair.refreshExpiresIn).isEqualTo(2592000)
        assertThat(jwtTokenService.parseUserId(pair.accessToken)).isEqualTo(7L)

        val savedSession = org.mockito.ArgumentCaptor
            .forClass(CliRefreshSession::class.java)
        verify(refreshSessionRepository).save(savedSession.capture())
        assertThat(savedSession.value.tokenHash).isEqualTo(hash(pair.refreshToken))
        assertThat(savedSession.value.tokenHash).isNotEqualTo(pair.refreshToken)
    }

    @Test
    fun `refresh rotates the refresh token and issues a new access token`() {
        val currentRefreshToken = "current-refresh-token"
        val session = CliRefreshSession(
            id = 10L,
            user = user,
            tokenHash = hash(currentRefreshToken),
            expiresAt = LocalDateTime.now(ZoneOffset.UTC).plusDays(1),
        )
        given(refreshSessionRepository.findByTokenHashForUpdate(hash(currentRefreshToken)))
            .willReturn(session)

        val pair = cliTokenService.refresh(currentRefreshToken)

        assertThat(pair.refreshToken).isNotEqualTo(currentRefreshToken)
        assertThat(session.tokenHash).isEqualTo(hash(pair.refreshToken))
        assertThat(session.lastRotatedAt).isNotNull()
        assertThat(jwtTokenService.parseUserId(pair.accessToken)).isEqualTo(7L)
    }

    @Test
    fun `refresh rejects and removes an expired session`() {
        val currentRefreshToken = "expired-refresh-token"
        val session = CliRefreshSession(
            id = 10L,
            user = user,
            tokenHash = hash(currentRefreshToken),
            expiresAt = LocalDateTime.now(ZoneOffset.UTC).minusSeconds(1),
        )
        given(refreshSessionRepository.findByTokenHashForUpdate(hash(currentRefreshToken)))
            .willReturn(session)

        assertThatThrownBy { cliTokenService.refresh(currentRefreshToken) }
            .isInstanceOf(InvalidRefreshTokenException::class.java)
        verify(refreshSessionRepository).delete(session)
    }

    private fun hash(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(token.toByteArray(StandardCharsets.UTF_8))
        return HexFormat.of().formatHex(digest)
    }
}
