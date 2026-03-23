package io.github.kitae9999.openlog.auth

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
class AuthController(private val authService: AuthService) {

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

        val (sub, email, name, picture) = authService.getGoogleUserInfo(accessToken)

        authService.saveOAuthUser(sub,picture,email,name)

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
            .build()
    }

//    @GetMapping("github")
//    fun redirectToGithubOAuth(){
//
//    }
}