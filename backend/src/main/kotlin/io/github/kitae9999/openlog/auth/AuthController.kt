package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.dto.MeResponse
import io.github.kitae9999.openlog.auth.exception.OAuthAuthenticationException
import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.CookieValue
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.net.URI
import java.time.Duration

@RestController
@RequestMapping("auth")
class AuthController(
    private val authService: AuthService,
    private val jwtTokenService: JwtTokenService,
    @Value("\${auth.jwt.cookie-name:openlog_access_token}")
    private val accessTokenCookieName: String,
    @Value("\${auth.jwt.cookie-secure:false}")
    private val accessTokenCookieSecure: Boolean,
    @Value("\${app.frontend-home-url:http://localhost:3030}")
    private val frontendHomeUrl: String,
) {
    @GetMapping("me")
    fun getMe(
        request: HttpServletRequest
    ): MeResponse {
        val accessToken = request.cookies
            ?. firstOrNull { it. name == accessTokenCookieName }
            ?. value
            ?: throw OAuthAuthenticationException() // 체인 전체를 보고 처리

        val userId = jwtTokenService.parseUserId(accessToken)

        val meUser = authService.getCurrentUser(userId)

        return MeResponse(
            id = requireNotNull(meUser.id),
            nickname = meUser.nickname,
            email = meUser.email,
            profileImageUrl = meUser.profileImageUrl
        )
    }

    @GetMapping("google")
    fun redirectToGoogleOAuth(
    ): ResponseEntity<Void>{
        val authRequest = authService.createGoogleAuthRequest()

        val flowCookie = ResponseCookie.from("oauth_flow_id",authRequest.flowId)
            .httpOnly(true)
            .secure(false) // TODO:HTTPS 환경에서는 true로
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ofMinutes(5))
            .build() // 최종 ResponseCookie 객체 생성

        return ResponseEntity.status(HttpStatus.FOUND)
            .header(HttpHeaders.SET_COOKIE, flowCookie.toString())
            .location(URI.create(authRequest.authUrl))
            .build()
    }

    @GetMapping("google/callback")
    fun hangleGoogleCallback(
        @RequestParam code: String,
        @RequestParam state: String,
        @CookieValue("oauth_flow_id") flowId: String
    ): ResponseEntity<Void> {
        authService.validateGoogleState(flowId, state)

        val deleteCookie = ResponseCookie.from("oauth_flow_id", "")
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ZERO)
            .build()

        val (accessToken, _, idToken) = authService.exchangeGoogleCode(code) //

        val verified = authService.verifyGoogleIdToken(idToken)

        val (sub, email, picture) = authService.getGoogleUserInfo(accessToken)

        if (verified.payload.subject != sub) {
            throw OAuthAuthenticationException()
        }

        val currentUser = authService.findOrCreateGoogleUser(sub,picture,email)
        val issuedJwt = jwtTokenService.createAccessToken(currentUser)
        val authCookie = ResponseCookie.from(accessTokenCookieName, issuedJwt)
            .httpOnly(true)
            .secure(accessTokenCookieSecure)
            .sameSite("Lax")
            .path("/")
            .maxAge(jwtTokenService.accessTokenTtl())
            .build()

        return ResponseEntity.status(HttpStatus.FOUND)
            .header(HttpHeaders.SET_COOKIE, deleteCookie.toString(), authCookie.toString())
            .location(URI.create(frontendHomeUrl))
            .build()
    }

//    @GetMapping("github")
//    fun redirectToGithubOAuth(){
//
//    }
}
