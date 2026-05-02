package io.github.kitae9999.openlog.auth

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class AccessTokenCookieFactoryTest {
    private val jwtTokenService = JwtTokenService(
        secret = "openlog-local-jwt-secret-openlog-local-jwt-secret",
        issuer = "openlog",
        accessTokenExpirationSeconds = 3600,
    )

    @Test
    fun `expire creates a local development delete cookie`() {
        val factory = AccessTokenCookieFactory(
            jwtTokenService = jwtTokenService,
            accessTokenCookieName = "openlog_access_token",
            accessTokenCookieSecure = false,
            accessTokenCookieDomain = "",
        )

        val cookie = factory.expire().toString()

        assertThat(cookie).startsWith("openlog_access_token=")
        assertThat(cookie).contains("Path=/")
        assertThat(cookie).contains("Max-Age=0")
        assertThat(cookie).contains("HttpOnly")
        assertThat(cookie).contains("SameSite=Lax")
        assertThat(cookie).doesNotContain("Secure")
        assertThat(cookie).doesNotContain("Domain=")
    }

    @Test
    fun `expire preserves configured secure and domain settings`() {
        val factory = AccessTokenCookieFactory(
            jwtTokenService = jwtTokenService,
            accessTokenCookieName = "openlog_access_token",
            accessTokenCookieSecure = true,
            accessTokenCookieDomain = ".openlog.dev",
        )

        val cookie = factory.expire().toString()

        assertThat(cookie).contains("Domain=.openlog.dev")
        assertThat(cookie).contains("Secure")
        assertThat(cookie).contains("SameSite=Lax")
    }
}
