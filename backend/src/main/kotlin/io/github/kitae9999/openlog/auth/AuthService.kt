package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.exception.InvalidOAuthStateException
import io.github.kitae9999.openlog.auth.exception.OAuthAuthenticationException
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.client.RestClient
import org.springframework.web.client.body
import org.springframework.web.util.UriComponentsBuilder
import java.time.Duration
import java.util.UUID

@Service
class AuthService(
    @Value("\${oauth.google.client-id}")
    private val clientId : String,
    @Value("\${oauth.google.redirect-uri}")
    private val redirectUri : String,
    @Value("\${oauth.google.client-secret}")
    private val clientSecret: String,

    private val redisTemplate: StringRedisTemplate,
    restClientBuilder: RestClient.Builder,
) {
    companion object {
        private  val OAUTH_STATE_TTL: Duration = Duration.ofMinutes(5)
        private const val GOOGLE_STATE_KEY_PREFIX = "oauth:google:state"
    }

    data class GoogleAuthRequest(
        val flowId: String,
        val authUrl: String,
    )

    val restClient = restClientBuilder
        .baseUrl("https://oauth2.googleapis.com")
        .build()
//
    data class  GoogleTokenResponse(
        val access_token: String,
        val scope: String,
        val id_token: String? = null,
    )
//
//    data class GoogleUserInfoResponse(
//
//    )

    fun exchangeGoogleCode(code: String): GoogleTokenResponse {
        val form = LinkedMultiValueMap<String, String>().apply {
            add("code", code)
            add("client_id", clientId)
            add("client_secret",clientSecret)
            add("redirect_uri",redirectUri)
            add("grant_type", "authorization_code")
        }

        return restClient.post()
            .uri("/token")
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .body<GoogleTokenResponse>() // HTTP 응답은 항상 body를 가진다고 보장할 수 없
            ?: throw OAuthAuthenticationException()
    }
    /**
     * auth 이벤트 발생 시 state 발행 및 레디스 저장
     */
    fun createGoogleAuthRequest(): GoogleAuthRequest {
        val flowId = UUID.randomUUID().toString()
        val state = UUID.randomUUID().toString()

        redisTemplate.opsForValue().set(
            buildStateKey(flowId),
            state,
            OAUTH_STATE_TTL
        )

        return GoogleAuthRequest(
            flowId = flowId,
            authUrl = getGoogleAuthUrl(state),
        )

    }


    fun validateGoogleState(flowId: String?, state: String){
        if (flowId.isNullOrBlank()){
            throw InvalidOAuthStateException()
        }

        val savedState = redisTemplate.opsForValue().getAndDelete(buildStateKey(flowId))
        if (savedState == null || savedState != state ){
            throw InvalidOAuthStateException()
        }
    }

    /**
     * 구글 로그인 페이지 이동 URL 생성
     */
    private fun getGoogleAuthUrl(state: String): String = UriComponentsBuilder
            .fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
            .queryParam("client_id", clientId)
            .queryParam("redirect_uri", redirectUri)
            .queryParam("response_type", "code")
            .queryParam("scope", "openid email profile")
            .queryParam("state",state)
            .build()
            .encode()
            .toUriString()

    private fun buildStateKey(flowId: String): String =
        "$GOOGLE_STATE_KEY_PREFIX$flowId"
}
