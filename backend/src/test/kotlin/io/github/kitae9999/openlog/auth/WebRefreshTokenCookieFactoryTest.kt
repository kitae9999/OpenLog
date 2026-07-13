package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.repository.WebRefreshSessionRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock

class WebRefreshTokenCookieFactoryTest {
    private lateinit var factory: WebRefreshTokenCookieFactory

    @BeforeEach
    fun setUp() {
        val jwtTokenService = JwtTokenService(
            secret = "openlog-local-jwt-secret-openlog-local-jwt-secret",
            issuer = "openlog",
            accessTokenExpirationSeconds = 3600,
        )
        val webTokenService = WebTokenService(
            jwtTokenService = jwtTokenService,
            refreshSessionRepository = mock(WebRefreshSessionRepository::class.java),
            refreshTokenExpirationSeconds = 2592000,
        )
        factory = WebRefreshTokenCookieFactory(
            webTokenService = webTokenService,
            refreshCookieName = "openlog_refresh_token",
            refreshMarkerCookieName = "openlog_refresh_session",
            cookieSecure = true,
            cookieDomain = ".openlog.kr",
        )
    }

    @Test
    fun `refresh cookie is restricted to auth routes`() {
        val cookie = factory.create("refresh-token")

        assertThat(cookie.name).isEqualTo("openlog_refresh_token")
        assertThat(cookie.value).isEqualTo("refresh-token")
        assertThat(cookie.path).isEqualTo("/auth")
        assertThat(cookie.domain).isEqualTo(".openlog.kr")
        assertThat(cookie.isHttpOnly).isTrue()
        assertThat(cookie.isSecure).isTrue()
        assertThat(cookie.sameSite).isEqualTo("Lax")
        assertThat(cookie.maxAge.seconds).isEqualTo(2592000)
    }

    @Test
    fun `marker cookie is available to navigation requests without exposing the secret`() {
        val cookie = factory.createMarker()

        assertThat(cookie.name).isEqualTo("openlog_refresh_session")
        assertThat(cookie.value).isEqualTo("1")
        assertThat(cookie.path).isEqualTo("/")
        assertThat(cookie.isHttpOnly).isTrue()
    }
}
