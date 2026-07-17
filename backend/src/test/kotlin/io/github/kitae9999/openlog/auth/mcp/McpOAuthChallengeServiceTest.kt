package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.user.entity.User
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.redis.core.ValueOperations
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository
import tools.jackson.databind.ObjectMapper

@ExtendWith(MockitoExtension::class)
class McpOAuthChallengeServiceTest {
    @Mock
    private lateinit var redisTemplate: StringRedisTemplate

    @Mock
    private lateinit var valueOperations: ValueOperations<String, String>

    @Mock
    private lateinit var objectMapper: ObjectMapper

    @Mock
    private lateinit var registeredClientRepository: RegisteredClientRepository

    @Mock
    private lateinit var authorizationConsentService: OAuth2AuthorizationConsentService

    @Mock
    private lateinit var connectionService: McpConnectionService

    private lateinit var service: McpOAuthChallengeService
    private val challenge = McpOAuthChallenge(
        userId = 10,
        registeredClientId = "registered-client",
        clientId = "public-client",
        clientName = "Codex",
        redirectUri = "http://127.0.0.1:1455/callback",
        responseType = "code",
        scope = "mcp:tools",
        state = "state",
        resource = "https://api.openlog.test/mcp",
        audience = "https://api.openlog.test/mcp",
        codeChallenge = "a".repeat(43),
        codeChallengeMethod = "S256",
    )

    @BeforeEach
    fun setUp() {
        service = McpOAuthChallengeService(
            redisTemplate,
            objectMapper,
            registeredClientRepository,
            authorizationConsentService,
            connectionService,
            McpOAuthProperties(
                issuer = "https://api.openlog.test",
                resource = "https://api.openlog.test/mcp",
            ),
        )
    }

    @Test
    fun `rejects a challenge already bound to another user`() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations)
        given(valueOperations.get("auth:mcp:challenge:challenge-id")).willReturn("challenge-json")
        given(objectMapper.readValue("challenge-json", McpOAuthChallenge::class.java)).willReturn(challenge)

        assertThatThrownBy {
            service.getAndBindChallenge("challenge-id", 20)
        }.isInstanceOf(BadRequestException::class.java)
    }

    @Test
    fun `requires an exact S256 PKCE challenge`() {
        val registeredClient = RegisteredClient.withId("registered-client")
            .clientId("public-client")
            .clientName("Codex")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri("http://127.0.0.1:1455/callback")
            .scope("mcp:tools")
            .build()
        given(registeredClientRepository.findByClientId("public-client")).willReturn(registeredClient)
        val request = MockHttpServletRequest("GET", "/oauth2/authorize").apply {
            addParameter("client_id", "public-client")
            addParameter("redirect_uri", "http://127.0.0.1:1455/callback")
            addParameter("response_type", "code")
            addParameter("scope", "mcp:tools")
            addParameter("resource", "https://api.openlog.test/mcp")
            addParameter("code_challenge", "a".repeat(44))
            addParameter("code_challenge_method", "S256")
        }

        assertThatThrownBy {
            service.createAuthorizationChallenge(request, 10)
        }.isInstanceOf(BadRequestException::class.java)
    }

    @Test
    fun `consumes a denied challenge exactly once`() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations)
        given(valueOperations.getAndDelete("auth:mcp:challenge:challenge-id"))
            .willReturn("challenge-json", null)
        given(objectMapper.readValue("challenge-json", McpOAuthChallenge::class.java)).willReturn(challenge)

        val redirect = service.decide(
            challengeId = "challenge-id",
            user = User(id = 10, username = "user", nickname = "User"),
            decision = "deny",
            profileValue = null,
        )

        assertThat(redirect).startsWith("http://127.0.0.1:1455/callback?")
        assertThat(redirect).contains("error=access_denied", "state=state")
        assertThatThrownBy {
            service.decide(
                challengeId = "challenge-id",
                user = User(id = 10, username = "user", nickname = "User"),
                decision = "deny",
                profileValue = null,
            )
        }.isInstanceOf(BadRequestException::class.java)
    }
}
