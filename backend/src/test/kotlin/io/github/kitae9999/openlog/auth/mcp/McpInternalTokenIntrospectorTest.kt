package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.user.entity.User
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.core.OAuth2AccessToken
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException
import java.time.Instant
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class McpInternalTokenIntrospectorTest {
    @Mock
    private lateinit var authorizationService: OAuth2AuthorizationService

    @Mock
    private lateinit var connectionService: McpConnectionService

    private lateinit var introspector: McpInternalTokenIntrospector
    private val internalResource = "https://api.openlog.test/api"
    private val connectionId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        introspector = McpInternalTokenIntrospector(
            authorizationService,
            connectionService,
            McpOAuthProperties(internalApiResource = internalResource),
        )
    }

    @Test
    fun `returns the current connection profile rather than the token snapshot`() {
        given(authorizationService.findByToken("internal-token", OAuth2TokenType.ACCESS_TOKEN))
            .willReturn(authorization(permissionProfile = "safe-write"))
        val connection = connection(McpPermissionProfile.FULL)
        given(connectionService.findActive(connectionId)).willReturn(connection)

        val principal = introspector.introspect("internal-token")

        assertThat(principal.name).isEqualTo("10")
        assertThat(principal.getAttribute<String>("permission_profile")).isEqualTo("full")
        assertThat(principal.getAttribute<List<String>>("capabilities"))
            .containsExactly("read", "write", "publish", "delete")
    }

    @Test
    fun `rejects a token as soon as its connection is revoked`() {
        given(authorizationService.findByToken("internal-token", OAuth2TokenType.ACCESS_TOKEN))
            .willReturn(authorization(permissionProfile = "safe-write"))
        given(connectionService.findActive(connectionId)).willReturn(null)

        assertThatThrownBy { introspector.introspect("internal-token") }
            .isInstanceOf(InvalidBearerTokenException::class.java)
    }

    @Test
    fun `rejects an internal token with another audience`() {
        given(authorizationService.findByToken("internal-token", OAuth2TokenType.ACCESS_TOKEN))
            .willReturn(authorization(audience = "https://attacker.example/api"))

        assertThatThrownBy { introspector.introspect("internal-token") }
            .isInstanceOf(InvalidBearerTokenException::class.java)
    }

    private fun authorization(
        permissionProfile: String = "safe-write",
        audience: String = internalResource,
    ): OAuth2Authorization {
        val registeredClient = RegisteredClient.withId("service-client")
            .clientId("openlog-mcp-service")
            .authorizationGrantType(AuthorizationGrantType.TOKEN_EXCHANGE)
            .build()
        val accessToken = OAuth2AccessToken(
            OAuth2AccessToken.TokenType.BEARER,
            "internal-token",
            Instant.now().minusSeconds(1),
            Instant.now().plusSeconds(60),
            setOf("mcp:internal"),
        )
        return OAuth2Authorization.withRegisteredClient(registeredClient)
            .principalName("10")
            .authorizationGrantType(AuthorizationGrantType.TOKEN_EXCHANGE)
            .token(accessToken) { metadata ->
                metadata[OAuth2Authorization.Token.CLAIMS_METADATA_NAME] = mapOf(
                    "sub" to "10",
                    "user_id" to 10,
                    "connection_id" to connectionId.toString(),
                    "permission_profile" to permissionProfile,
                    "capabilities" to listOf("read", "write", "publish"),
                    "token_use" to "internal_api",
                    "aud" to listOf(audience),
                )
            }
            .build()
    }

    private fun connection(profile: McpPermissionProfile) = McpConnection(
        id = connectionId,
        user = User(id = 10, username = "user", nickname = "User"),
        registeredClientId = "registered-client",
        clientId = "public-client",
        clientName = "Codex",
        callbackOrigin = "http://127.0.0.1:1455",
        permissionProfile = profile,
    )
}
