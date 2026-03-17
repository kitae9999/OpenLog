package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.exception.InvalidOAuthStateException
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Service
import org.springframework.web.util.UriComponentsBuilder
import java.time.Duration
import java.util.UUID

@Service
class AuthService(
    @Value("\${oauth.google.client-id}")
    private val clientId : String,
    @Value("\${oauth.google.redirect-uri}")
    private val redirectUri : String,
    private val redisTemplate: StringRedisTemplate,
) {
    companion object {
        private  val OAUTH_STATE_TTL: Duration = Duration.ofMinutes(5)
        private const val GOOGLE_STATE_KEY_PREFIX = "oauth:google:state"
    }

    data class GoogleAuthRequest(
        val flowId: String,
        val authUrl: String,
    )

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
