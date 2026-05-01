package io.github.kitae9999.openlog.auth

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseCookie
import org.springframework.stereotype.Component

@Component
class AccessTokenCookieFactory(
    private val jwtTokenService: JwtTokenService,
    @Value("\${auth.jwt.cookie-name:openlog_access_token}")
    private val accessTokenCookieName: String,
    @Value("\${auth.jwt.cookie-secure:false}")
    private val accessTokenCookieSecure: Boolean,
    @Value("\${auth.jwt.cookie-domain:}")
    private val accessTokenCookieDomain: String,
) {
    /**
     * JWT을 받아서 응답 Cookie 인스턴스 생성
     */
    fun create(accessToken: String): ResponseCookie {
        return withCookieDomain(ResponseCookie.from(accessTokenCookieName, accessToken))
            .httpOnly(true)
            .secure(accessTokenCookieSecure)
            .sameSite("Lax")
            .path("/")
            .maxAge(jwtTokenService.accessTokenTtl())
            .build()
    }

    private fun withCookieDomain(
        builder: ResponseCookie.ResponseCookieBuilder
    ): ResponseCookie.ResponseCookieBuilder {
        return if (accessTokenCookieDomain.isBlank()) {
            builder
        } else {
            builder.domain(accessTokenCookieDomain)
        }
    }
}
