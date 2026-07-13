package io.github.kitae9999.openlog.auth

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseCookie
import org.springframework.stereotype.Component
import java.time.Duration

@Component
class WebRefreshTokenCookieFactory(
    private val webTokenService: WebTokenService,
    @Value("\${auth.web.refresh-cookie-name:openlog_refresh_token}")
    private val refreshCookieName: String,
    @Value("\${auth.web.refresh-marker-cookie-name:openlog_refresh_session}")
    private val refreshMarkerCookieName: String,
    @Value("\${auth.jwt.cookie-secure:false}")
    private val cookieSecure: Boolean,
    @Value("\${auth.jwt.cookie-domain:}")
    private val cookieDomain: String,
) {
    fun create(refreshToken: String): ResponseCookie =
        cookie(refreshCookieName, refreshToken)
            .path(AUTH_ROUTE_PATH)
            .maxAge(webTokenService.refreshTokenTtl())
            .build()

    fun createMarker(): ResponseCookie =
        cookie(refreshMarkerCookieName, "1")
            .path("/")
            .maxAge(webTokenService.refreshTokenTtl())
            .build()

    fun expire(): ResponseCookie =
        cookie(refreshCookieName, "")
            .path(AUTH_ROUTE_PATH)
            .maxAge(Duration.ZERO)
            .build()

    fun expireMarker(): ResponseCookie =
        cookie(refreshMarkerCookieName, "")
            .path("/")
            .maxAge(Duration.ZERO)
            .build()

    private fun cookie(
        name: String,
        value: String,
    ): ResponseCookie.ResponseCookieBuilder {
        val builder = ResponseCookie.from(name, value)
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Lax")

        return if (cookieDomain.isBlank()) builder else builder.domain(cookieDomain)
    }

    companion object {
        const val AUTH_ROUTE_PATH = "/auth"
    }
}
