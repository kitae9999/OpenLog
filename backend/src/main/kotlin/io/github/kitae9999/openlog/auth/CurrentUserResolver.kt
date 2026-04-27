package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.exception.OAuthAuthenticationException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import kotlin.jvm.optionals.getOrNull

@Component
class CurrentUserResolver(
    private val jwtTokenService: JwtTokenService,
    private val userRepository: UserRepository,
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

    fun resolveCurrentUser(request: HttpServletRequest): User {
        val userId = resolveUserIdFromJwt(request)
        return userRepository.findById(userId).getOrNull()
            ?: throw OAuthAuthenticationException()
    }
}
