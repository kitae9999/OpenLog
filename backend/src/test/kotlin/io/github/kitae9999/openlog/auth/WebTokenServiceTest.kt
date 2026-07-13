package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.entity.WebRefreshSession
import io.github.kitae9999.openlog.auth.exception.InvalidRefreshTokenException
import io.github.kitae9999.openlog.auth.repository.WebRefreshSessionRepository
import io.github.kitae9999.openlog.user.entity.User
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentCaptor
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
class WebTokenServiceTest {
    @Mock
    private lateinit var refreshSessionRepository: WebRefreshSessionRepository

    private lateinit var jwtTokenService: JwtTokenService
    private lateinit var webTokenService: WebTokenService
    private lateinit var user: User

    @BeforeEach
    fun setUp() {
        jwtTokenService = JwtTokenService(
            secret = "openlog-local-jwt-secret-openlog-local-jwt-secret",
            issuer = "openlog",
            accessTokenExpirationSeconds = 3600,
        )
        webTokenService = WebTokenService(
            jwtTokenService = jwtTokenService,
            refreshSessionRepository = refreshSessionRepository,
            refreshTokenExpirationSeconds = 2592000,
        )
        user = User(id = 7L, username = "kitae9999", nickname = "ASH")
    }

    @Test
    fun `issue stores only a web refresh token hash`() {
        given(refreshSessionRepository.save(any(WebRefreshSession::class.java)))
            .willAnswer { it.getArgument(0) }

        val pair = webTokenService.issue(user)

        assertThat(jwtTokenService.parseUserId(pair.accessToken)).isEqualTo(7L)
        assertThat(pair.refreshToken).isNotBlank()
        assertThat(pair.refreshExpiresIn).isEqualTo(2592000)

        val sessionCaptor = ArgumentCaptor.forClass(WebRefreshSession::class.java)
        verify(refreshSessionRepository).save(sessionCaptor.capture())
        assertThat(sessionCaptor.value.tokenHash).isEqualTo(hash(pair.refreshToken))
        assertThat(sessionCaptor.value.tokenHash).isNotEqualTo(pair.refreshToken)
    }

    @Test
    fun `refresh keeps the web session stable and issues a new access token`() {
        val refreshToken = "web-refresh-token"
        val session = WebRefreshSession(
            id = 10L,
            user = user,
            tokenHash = hash(refreshToken),
            expiresAt = LocalDateTime.now(ZoneOffset.UTC).plusDays(1),
        )
        given(refreshSessionRepository.findByTokenHashForUpdate(hash(refreshToken)))
            .willReturn(session)

        val accessToken = webTokenService.refresh(refreshToken)

        assertThat(jwtTokenService.parseUserId(accessToken)).isEqualTo(7L)
        assertThat(session.tokenHash).isEqualTo(hash(refreshToken))
        assertThat(session.lastUsedAt).isNotNull()
    }

    @Test
    fun `refresh rejects and removes an expired web session`() {
        val refreshToken = "expired-web-refresh-token"
        val session = WebRefreshSession(
            id = 10L,
            user = user,
            tokenHash = hash(refreshToken),
            expiresAt = LocalDateTime.now(ZoneOffset.UTC).minusSeconds(1),
        )
        given(refreshSessionRepository.findByTokenHashForUpdate(hash(refreshToken)))
            .willReturn(session)

        assertThatThrownBy { webTokenService.refresh(refreshToken) }
            .isInstanceOf(InvalidRefreshTokenException::class.java)
        verify(refreshSessionRepository).delete(session)
    }

    private fun hash(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(token.toByteArray(StandardCharsets.UTF_8))
        return HexFormat.of().formatHex(digest)
    }
}
