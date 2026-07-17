package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.user.entity.User
import jakarta.servlet.http.HttpServletRequest
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsent
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.util.UriComponentsBuilder
import tools.jackson.databind.ObjectMapper
import java.net.URI
import java.security.SecureRandom
import java.time.Duration
import java.util.Base64

@Service
@ConditionalOnProperty(prefix = "auth.mcp", name = ["enabled"], havingValue = "true")
class McpOAuthChallengeService(
    private val redisTemplate: StringRedisTemplate,
    private val objectMapper: ObjectMapper,
    private val registeredClientRepository: RegisteredClientRepository,
    private val authorizationConsentService: OAuth2AuthorizationConsentService,
    private val connectionService: McpConnectionService,
    private val properties: McpOAuthProperties,
) {
    fun createAuthorizationChallenge(request: HttpServletRequest, userId: Long?): String {
        val clientId = request.requiredParameter("client_id")
        val registeredClient = registeredClientRepository.findByClientId(clientId)
            ?: throw BadRequestException("등록되지 않은 OAuth 클라이언트입니다.")
        val redirectUri = request.requiredParameter("redirect_uri")
        if (redirectUri !in registeredClient.redirectUris) {
            throw BadRequestException("redirect_uri가 등록된 값과 일치하지 않습니다.")
        }
        if (request.requiredParameter("response_type") != "code") {
            throw BadRequestException("response_type은 code여야 합니다.")
        }
        val scope = request.requiredParameter("scope")
        if (scope.split(SCOPE_DELIMITER).filter(String::isNotBlank).toSet() != setOf(MCP_SCOPE)) {
            throw BadRequestException("scope는 mcp:tools여야 합니다.")
        }
        val resource = request.requiredSingleParameter("resource")
        if (resource != properties.resource) {
            throw BadRequestException("resource가 OpenLog MCP 리소스와 일치하지 않습니다.")
        }
        val audience = request.singleOptionalParameter("audience")
        if (audience != null && audience != properties.resource) {
            throw BadRequestException("audience가 OpenLog MCP 리소스와 일치하지 않습니다.")
        }
        val codeChallenge = request.requiredParameter("code_challenge")
        val challengeMethod = request.requiredParameter("code_challenge_method")
        if (challengeMethod != "S256" || !PKCE_CHALLENGE_PATTERN.matches(codeChallenge)) {
            throw BadRequestException("PKCE S256 code_challenge가 필요합니다.")
        }

        val challengeId = randomToken()
        val challenge = McpOAuthChallenge(
            userId = userId,
            registeredClientId = registeredClient.id,
            clientId = registeredClient.clientId,
            clientName = registeredClient.clientName,
            redirectUri = redirectUri,
            responseType = "code",
            scope = MCP_SCOPE,
            state = request.getParameter("state"),
            resource = resource,
            audience = audience,
            codeChallenge = codeChallenge,
            codeChallengeMethod = "S256",
        )
        redisTemplate.opsForValue().set(
            challengeKey(challengeId),
            objectMapper.writeValueAsString(challenge),
            CHALLENGE_TTL,
        )
        return challengeId
    }

    fun getAndBindChallenge(challengeId: String, userId: Long): McpConsentChallengeResponse {
        val key = challengeKey(challengeId)
        val challenge = readChallenge(redisTemplate.opsForValue().get(key))
        if (challenge.userId != null && challenge.userId != userId) {
            throw BadRequestException("다른 사용자에게 발급된 MCP 승인 요청입니다.")
        }
        if (challenge.userId == null) {
            val ttlSeconds = redisTemplate.getExpire(key)
            if (ttlSeconds <= 0) {
                throw BadRequestException("만료된 MCP 승인 요청입니다.")
            }
            redisTemplate.opsForValue().set(
                key,
                objectMapper.writeValueAsString(challenge.copy(userId = userId)),
                Duration.ofSeconds(ttlSeconds),
            )
        }
        return challenge.toResponse(challengeId)
    }

    @Transactional
    fun decide(
        challengeId: String,
        user: User,
        decision: String,
        profileValue: String?,
    ): String {
        val challenge = readChallenge(
            redisTemplate.opsForValue().getAndDelete(challengeKey(challengeId)),
        )
        val userId = requireNotNull(user.id)
        if (challenge.userId != userId) {
            throw BadRequestException("다른 사용자에게 발급되었거나 확인되지 않은 MCP 승인 요청입니다.")
        }
        if (decision == "deny") {
            return buildDeniedRedirect(challenge)
        }
        if (decision != "approve") {
            throw BadRequestException("승인 또는 거절을 선택해 주세요.")
        }

        val profile = runCatching {
            McpPermissionProfile.fromWireValue(profileValue ?: McpPermissionProfile.SAFE_WRITE.wireValue)
        }.getOrElse { throw BadRequestException(it.message) }
        connectionService.approve(
            user = user,
            registeredClientId = challenge.registeredClientId,
            clientId = challenge.clientId,
            clientName = challenge.clientName,
            callbackOrigin = callbackOrigin(challenge.redirectUri),
            permissionProfile = profile,
        )
        authorizationConsentService.save(
            OAuth2AuthorizationConsent
                .withId(challenge.registeredClientId, userId.toString())
                .scope(MCP_SCOPE)
                .build(),
        )

        val approvalId = randomToken()
        redisTemplate.opsForValue().set(
            approvalKey(approvalId),
            objectMapper.writeValueAsString(challenge),
            CHALLENGE_TTL,
        )
        return buildApprovedAuthorizationRedirect(challenge, approvalId)
    }

    fun consumeApproval(request: HttpServletRequest, approvalId: String, userId: Long) {
        val challenge = readChallenge(
            redisTemplate.opsForValue().getAndDelete(approvalKey(approvalId)),
        )
        if (challenge.userId != userId || !challenge.matches(request)) {
            throw BadRequestException("유효하지 않거나 재사용된 MCP 승인 요청입니다.")
        }
    }

    private fun readChallenge(value: String?): McpOAuthChallenge {
        if (value.isNullOrBlank()) {
            throw BadRequestException("만료되었거나 재사용된 MCP 승인 요청입니다.")
        }
        return runCatching {
            objectMapper.readValue(value, McpOAuthChallenge::class.java)
        }.getOrElse {
            throw BadRequestException("손상된 MCP 승인 요청입니다.")
        }
    }

    private fun buildApprovedAuthorizationRedirect(
        challenge: McpOAuthChallenge,
        approvalId: String,
    ): String = UriComponentsBuilder
        .fromUriString(properties.issuer)
        .path("/oauth2/authorize")
        .queryParam("response_type", challenge.responseType)
        .queryParam("client_id", challenge.clientId)
        .queryParam("redirect_uri", challenge.redirectUri)
        .queryParam("scope", challenge.scope)
        .apply { challenge.state?.let { queryParam("state", it) } }
        .queryParam("resource", challenge.resource)
        .apply { challenge.audience?.let { queryParam("audience", it) } }
        .queryParam("code_challenge", challenge.codeChallenge)
        .queryParam("code_challenge_method", challenge.codeChallengeMethod)
        .queryParam(APPROVAL_PARAMETER, approvalId)
        .build()
        .encode()
        .toUriString()

    private fun buildDeniedRedirect(challenge: McpOAuthChallenge): String = UriComponentsBuilder
        .fromUriString(challenge.redirectUri)
        .queryParam("error", "access_denied")
        .queryParam("error_description", "The user denied the OpenLog connection.")
        .apply { challenge.state?.let { queryParam("state", it) } }
        .build()
        .encode()
        .toUriString()

    private fun McpOAuthChallenge.toResponse(challengeId: String): McpConsentChallengeResponse = McpConsentChallengeResponse(
        challenge = challengeId,
        clientName = clientName,
        callbackOrigin = callbackOrigin(redirectUri),
        scope = scope,
        expiresIn = CHALLENGE_TTL.toSeconds().toInt(),
        defaultPermissionProfile = McpPermissionProfile.SAFE_WRITE.wireValue,
    )

    private fun McpOAuthChallenge.matches(request: HttpServletRequest): Boolean =
        request.getParameter("response_type") == responseType &&
            request.getParameter("client_id") == clientId &&
            request.getParameter("redirect_uri") == redirectUri &&
            request.getParameter("scope") == scope &&
            request.getParameter("state") == state &&
            request.getParameter("resource") == resource &&
            request.getParameter("audience") == audience &&
            request.getParameter("code_challenge") == codeChallenge &&
            request.getParameter("code_challenge_method") == codeChallengeMethod

    private fun callbackOrigin(redirectUri: String): String {
        val uri = URI(redirectUri)
        val port = if (uri.port == -1) "" else ":${uri.port}"
        return "${uri.scheme}://${uri.host}$port"
    }

    private fun challengeKey(id: String): String = "$CHALLENGE_KEY_PREFIX$id"

    private fun approvalKey(id: String): String = "$APPROVAL_KEY_PREFIX$id"

    private fun randomToken(): String {
        val bytes = ByteArray(RANDOM_TOKEN_BYTES)
        secureRandom.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    companion object {
        const val APPROVAL_PARAMETER = "openlog_approval"
        private const val MCP_SCOPE = "mcp:tools"
        private const val RANDOM_TOKEN_BYTES = 32
        private const val CHALLENGE_KEY_PREFIX = "auth:mcp:challenge:"
        private const val APPROVAL_KEY_PREFIX = "auth:mcp:approval:"
        private val CHALLENGE_TTL = Duration.ofMinutes(5)
        private val SCOPE_DELIMITER = Regex("\\s+")
        private val PKCE_CHALLENGE_PATTERN = Regex("^[A-Za-z0-9_-]{43}$")
        private val secureRandom = SecureRandom()
    }
}

data class McpOAuthChallenge(
    val userId: Long?,
    val registeredClientId: String,
    val clientId: String,
    val clientName: String,
    val redirectUri: String,
    val responseType: String,
    val scope: String,
    val state: String?,
    val resource: String,
    val audience: String?,
    val codeChallenge: String,
    val codeChallengeMethod: String,
)

data class McpConsentChallengeResponse(
    val challenge: String,
    val clientName: String,
    val callbackOrigin: String,
    val scope: String,
    val expiresIn: Int,
    val defaultPermissionProfile: String,
)

private fun HttpServletRequest.requiredParameter(name: String): String =
    getParameter(name)?.takeIf(String::isNotBlank)
        ?: throw BadRequestException("$name 파라미터가 필요합니다.")

private fun HttpServletRequest.requiredSingleParameter(name: String): String {
    val values = getParameterValues(name)?.toList().orEmpty()
    if (values.size != 1 || values.single().isBlank()) {
        throw BadRequestException("$name 파라미터는 정확히 하나여야 합니다.")
    }
    return values.single()
}

private fun HttpServletRequest.singleOptionalParameter(name: String): String? {
    val values = getParameterValues(name)?.toList().orEmpty()
    if (values.size > 1) {
        throw BadRequestException("$name 파라미터는 하나만 사용할 수 있습니다.")
    }
    return values.singleOrNull()?.takeIf(String::isNotBlank)
}
