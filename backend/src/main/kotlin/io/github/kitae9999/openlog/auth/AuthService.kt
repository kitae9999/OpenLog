package io.github.kitae9999.openlog.auth

import com.fasterxml.jackson.annotation.JsonProperty
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import io.github.kitae9999.openlog.auth.entity.OauthAccount
import io.github.kitae9999.openlog.auth.dto.CompleteOnboardingRequest
import io.github.kitae9999.openlog.auth.exception.InvalidOAuthStateException
import io.github.kitae9999.openlog.auth.exception.OAuthAuthenticationException
import io.github.kitae9999.openlog.auth.repository.OauthAccountRepository
import io.github.kitae9999.openlog.common.exception.UsernameAlreadyTakenException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import io.github.kitae9999.openlog.worklog.entity.Workspace
import io.github.kitae9999.openlog.worklog.repository.WorkspaceRepository
import jakarta.transaction.Transactional
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.http.HttpHeaders
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

    private val redisTemplate: StringRedisTemplate, // todo: non-blocking redis로 수정 (Reactive Redis Template)
    restClientBuilder: RestClient.Builder,
    private val userRepository: UserRepository,
    private val oauthAccountRepository: OauthAccountRepository,
    private val workspaceRepository: WorkspaceRepository,
) {
    companion object {
        private  val OAUTH_STATE_TTL: Duration = Duration.ofMinutes(5)
        private const val GOOGLE_STATE_KEY_PREFIX = "oauth:google:state"
        private const val GOOGLE_STATE_VALUE_SEPARATOR = "\n"
        private const val DEFAULT_WORKSPACE_SLUG = "default"
    }

    data class GoogleAuthRequest(
        val flowId: String,
        val authUrl: String,
    )

    data class GoogleOAuthState(
        val state: String,
        val returnTo: String?,
    )

    data class GoogleUserInfoResponse(
        val sub: String,
        val email: String? = null,
        val picture: String? = null,
    )

    val restClient = restClientBuilder
        .baseUrl("https://oauth2.googleapis.com")
        .build()

    val googleApiClient = restClientBuilder
        .baseUrl("https://openidconnect.googleapis.com")
        .build()


    private val idTokenVerifier = GoogleIdTokenVerifier.Builder(
        NetHttpTransport(),
        GsonFactory.getDefaultInstance(),
    )
        .setAudience(listOf(clientId))
        .build()


    data class  GoogleTokenResponse(
        @JsonProperty("access_token")
        val accessToken: String,
        val scope: String,
        @JsonProperty("id_token")
        val idToken: String,
    )

    @Transactional
    fun getCurrentUser(userId: Long): User {
        val currentUser = userRepository.findById(userId).orElseThrow { OAuthAuthenticationException() }
        return currentUser
    }
    fun verifyGoogleIdToken(idToken: String): GoogleIdToken {
        val verified = idTokenVerifier.verify(idToken)
            ?: throw OAuthAuthenticationException()

        return verified
    }

    fun getGoogleUserInfo(accessToken: String): GoogleUserInfoResponse{
        return googleApiClient.get()
            .uri("/v1/userinfo")
            .header(HttpHeaders.AUTHORIZATION, "Bearer $accessToken")
            .retrieve()
            .body<GoogleUserInfoResponse>()
            ?: throw OAuthAuthenticationException()
    }

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
    fun createGoogleAuthRequest(returnTo: String? = null): GoogleAuthRequest {
        val flowId = UUID.randomUUID().toString()
        val state = UUID.randomUUID().toString()
        val normalizedReturnTo = normalizeFrontendReturnTo(returnTo)

        redisTemplate.opsForValue().set(
            buildStateKey(flowId),
            listOf(state, normalizedReturnTo.orEmpty()).joinToString(GOOGLE_STATE_VALUE_SEPARATOR),
            OAUTH_STATE_TTL
        )

        return GoogleAuthRequest(
            flowId = flowId,
            authUrl = getGoogleAuthUrl(state),
        )

    }


    fun validateGoogleState(flowId: String?, state: String) {
        consumeGoogleState(flowId, state)
    }

    fun consumeGoogleState(flowId: String?, state: String): GoogleOAuthState {
        if (flowId.isNullOrBlank()){
            throw InvalidOAuthStateException()
        }

        val savedValue = redisTemplate.opsForValue().getAndDelete(buildStateKey(flowId))
        val savedOAuthState = savedValue?.toGoogleOAuthState()
        if (savedOAuthState == null || savedOAuthState.state != state ){
            throw InvalidOAuthStateException()
        }

        return savedOAuthState
    }

    @Transactional
    fun findOrCreateGoogleUser(
        sub: String,
        picture: String?,
        email: String?,
    ): User {
        return findOrCreateOAuthUser(
            provider = "google",
            providerUserId = sub,
            picture = picture,
            email = email,
        )
    }

    @Transactional
    fun findOrCreateOAuthUser(
        provider: String,
        providerUserId: String,
        picture: String?,
        email: String?,
    ): User {
        val existingAccount = oauthAccountRepository
            .findByProviderAndProviderUserId(provider, providerUserId)

        if (existingAccount != null) {
            return existingAccount.user
        }

        val user = userRepository.save(
            User(
                profileImageUrl = picture,
                email = email,
            )
        )
        ensureDefaultWorkspace(user)

        oauthAccountRepository.save(
            OauthAccount(
                user = user,
                provider = provider,
                providerUserId = providerUserId,
            )
        )

        return user
    }

    private fun ensureDefaultWorkspace(user: User) {
        val userId = requireNotNull(user.id)
        if (workspaceRepository.existsByOwnerIdAndSlug(userId, DEFAULT_WORKSPACE_SLUG)) {
            return
        }

        workspaceRepository.save(
            Workspace(
                owner = user,
                slug = DEFAULT_WORKSPACE_SLUG,
                name = user.nickname?.takeIf { it.isNotBlank() } ?: "My Workspace",
            )
        )
    }

    @Transactional
    fun completeOnboarding(
        userId: Long,
        request: CompleteOnboardingRequest,
    ): User {
        val user = getCurrentUser(userId)
        val normalizedNickname = request.nickname.trim()
        val normalizedUsername = request.username.trim()
        val normalizedBio = request.bio?.trim()?.takeIf { it.isNotEmpty() }

        if (user.username != normalizedUsername && userRepository.existsByUsername(normalizedUsername)) {
            throw UsernameAlreadyTakenException()
        }

        user.completeOnboarding(
            nickname = normalizedNickname,
            username = normalizedUsername,
            bio = normalizedBio,
        )

        return user
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

    private fun String.toGoogleOAuthState(): GoogleOAuthState {
        val parts = split(GOOGLE_STATE_VALUE_SEPARATOR, limit = 2)

        return GoogleOAuthState(
            state = parts[0],
            returnTo = parts.getOrNull(1)?.takeIf { it.isNotBlank() },
        )
    }

    private fun normalizeFrontendReturnTo(returnTo: String?): String? {
        val trimmedReturnTo = returnTo?.trim()?.takeIf { it.isNotBlank() }
            ?: return null

        return if (
            trimmedReturnTo.startsWith("/") &&
            !trimmedReturnTo.startsWith("//") &&
            !trimmedReturnTo.contains("\r") &&
            !trimmedReturnTo.contains("\n")
        ) {
            trimmedReturnTo
        } else {
            null
        }
    }
}
