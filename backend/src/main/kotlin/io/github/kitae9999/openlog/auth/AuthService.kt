package io.github.kitae9999.openlog.auth

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.util.UriComponentsBuilder
import java.util.UUID

@Service
class AuthService(
    @Value("\${oauth.google.client-id}")
    private val clientId : String,
    @Value("\${oauth.google.redirect-uri}")
    private val redirectUri : String,
) {
    /**
     * UUID State 생성
     * */
    fun generateState(): String = UUID.randomUUID().toString()


    /**
     * 구글 로그인 페이지 이동 URL 생성
     */
    fun getGoogleAuthUrl(): String = UriComponentsBuilder
            .fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
            .queryParam("client_id", clientId)
            .queryParam("redirect_uri", redirectUri)
            .queryParam("response_type", "code")
            .queryParam("scope", "openid email profile")
            .build()
            .encode()
            .toUriString()


}
