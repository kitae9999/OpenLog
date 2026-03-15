package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.common.exception.BadRequestException
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("auth")
class AuthController(private val authService: AuthService) {
    @GetMapping("google")
    fun redirectToGoogleOAuth(
    ): Unit{ // Unit은 생략가능
        this.authService.getGoogleAuthUrl()
    }

    @GetMapping("github")
    fun redirectToGithubOAuth(){

    }
}