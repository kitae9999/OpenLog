package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.exception.OAuthAuthenticationException
import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component

@Component
class CurrentUserResolver(
    private val jwtTokenService: JwtTokenService,
    @Value("\${auth.jwt.cookie-name:openlog_access_token}")
    private val accessTokenCookieName: String,
) {
    fun resolveUserIdFromJwt(request: HttpServletRequest): Long {
        val accessToken = request.cookies
            ?.firstOrNull { it.name == accessTokenCookieName }
            ?.value
            ?: throw OAuthAuthenticationException()

        return jwtTokenService.parseUserId(accessToken)
    }


}
