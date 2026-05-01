package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.exception.OAuthAuthenticationException
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import org.springframework.stereotype.Component
import java.net.URI

@Component
class GithubOAuthSuccessHandler(
    private val authService: AuthService,
    private val jwtTokenService: JwtTokenService,
    private val accessTokenCookieFactory: AccessTokenCookieFactory,
    @Value("\${app.frontend-home-url:http://localhost:3030}")
    private val frontendHomeUrl: String,
): AuthenticationSuccessHandler {
    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication
    ) {
        val oauthToken = authentication as? OAuth2AuthenticationToken
            ?: throw OAuthAuthenticationException()
        val principal = oauthToken.principal // 사용자 정보가 없으면 에러
            ?: throw OAuthAuthenticationException()

        val attributes = principal.attributes

        val providerUserId = attributes["id"]?.toString() // id가 null이면 에러
            ?: throw OAuthAuthenticationException()

        val email = attributes["email"] as? String // as로 타입캐스팅 실패하면 null반환
        val avatarUrl = attributes["avatar_url"] as? String

        val currentUser = authService.findOrCreateOAuthUser(
            provider = oauthToken.authorizedClientRegistrationId,
            providerUserId = providerUserId,
            picture = avatarUrl,
            email = email,
        )
        val issuedJwt = jwtTokenService.createAccessToken(currentUser)
        val authCookie = accessTokenCookieFactory.create(issuedJwt)

        response.addHeader(HttpHeaders.SET_COOKIE, authCookie.toString())
        response.sendRedirect(
            if (currentUser.isOnboardingComplete()) {
                frontendHomeUrl
            } else {
                URI.create(frontendHomeUrl).resolve("/onboarding").toString()
            },
        )
    }

}
