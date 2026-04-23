package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.dto.CompleteOnboardingRequest
import io.github.kitae9999.openlog.auth.dto.MeResponse
import io.github.kitae9999.openlog.auth.exception.OAuthAuthenticationException
import io.github.kitae9999.openlog.user.entity.User
import jakarta.validation.Valid
import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.CookieValue
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.net.URI
import java.time.Duration

@RestController
@RequestMapping("auth")
class AuthController(
    private val authService: AuthService,
    private val currentUserResolver: CurrentUserResolver,
    private val jwtTokenService: JwtTokenService,
    @Value("\${auth.jwt.cookie-name:openlog_access_token}")
    private val accessTokenCookieName: String,
    @Value("\${auth.jwt.cookie-secure:false}")
    private val accessTokenCookieSecure: Boolean,
    @Value("\${auth.jwt.cookie-domain:}")
    private val accessTokenCookieDomain: String,
    @Value("\${app.frontend-home-url:http://localhost:3030}")
    private val frontendHomeUrl: String,
) {
    @GetMapping("me")
    fun getMe(
        request: HttpServletRequest
    ): MeResponse {
        val meUser = authService.getCurrentUser(currentUserResolver.resolveUserId(request))

        return meUser.toMeResponse() // 코틀린 확장 함수 (메서드 아님)
    }

    @PostMapping("onboarding")
    fun completeOnboarding(
        request: HttpServletRequest,
        @Valid @RequestBody onboardingRequest: CompleteOnboardingRequest,
    ): MeResponse {
        val currentUser = authService.completeOnboarding(
            userId = currentUserResolver.resolveUserId(request),
            request = onboardingRequest,
        )

        return currentUser.toMeResponse()
    }

    @GetMapping("google")
    fun redirectToGoogleOAuth(
    ): ResponseEntity<Void>{
        val authRequest = authService.createGoogleAuthRequest()

        val flowCookie = ResponseCookie.from("oauth_flow_id",authRequest.flowId)
            .httpOnly(true)
            .secure(accessTokenCookieSecure)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ofMinutes(5))
            .build()

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
            .secure(accessTokenCookieSecure)
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

        val currentUser = authService.findOrCreateGoogleUser(
            sub = sub,
            picture = picture,
            email = email,
        )
        val issuedJwt = jwtTokenService.createAccessToken(currentUser)
        val authCookie = withCookieDomain(ResponseCookie.from(accessTokenCookieName, issuedJwt))
            .httpOnly(true)
            .secure(accessTokenCookieSecure)
            .sameSite("Lax")
            .path("/")
            .maxAge(jwtTokenService.accessTokenTtl())
            .build()

        return ResponseEntity.status(HttpStatus.FOUND)
            .header(HttpHeaders.SET_COOKIE, deleteCookie.toString(), authCookie.toString())
            .location(
                URI.create(
                    if (currentUser.isOnboardingComplete()) {
                        frontendHomeUrl
                    } else {
                        URI.create(frontendHomeUrl).resolve("/onboarding").toString()
                    },
                )
            )
            .build()
    }

    private fun User.toMeResponse(): MeResponse {
        return MeResponse(
            id = requireNotNull(id),
            username = username,
            nickname = nickname,
            email = email,
            profileImageUrl = profileImageUrl,
            bio = bio,
            isOnboardingComplete = isOnboardingComplete(),
        )
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

//    @GetMapping("github")
//    fun redirectToGithubOAuth(){
//
//    }
}
