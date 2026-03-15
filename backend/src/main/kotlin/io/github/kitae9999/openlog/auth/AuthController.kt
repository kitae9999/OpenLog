package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.common.exception.BadRequestException
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("auth")
class AuthController(val authService: AuthService) {
    @GetMapping("google")
    fun redirectToGoogleOAuth(
    ): Unit{ // Unit은 생략가능
        if (intent != "login" && intent != "register" ){
            throw BadRequestException()
        }else
    }

    @GetMapping("github")
    fun redirectToGithubOAuth(){

    }
}