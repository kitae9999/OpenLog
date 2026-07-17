package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.user.entity.User
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.core.OAuth2AccessToken
import org.springframework.security.oauth2.server.authorization.JdbcOAuth2AuthorizationService
import org.springframework.security.oauth2.server.authorization.OAuth2Authorization
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType
import org.springframework.security.oauth2.server.authorization.client.JdbcRegisteredClientRepository
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenClaimsContext
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenClaimsSet
import java.time.Instant
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class McpOAuthTokenCustomizerTest {
    @Mock
    private lateinit var connectionService: McpConnectionService

    private lateinit var customizer: McpOAuthTokenCustomizer
    private val properties = McpOAuthProperties(
        resource = "https://api.openlog.test/mcp",
        internalApiResource = "https://api.openlog.test/api",
        serviceClientId = "openlog-mcp-service",
    )

    @BeforeEach
    fun setUp() {
        customizer = McpOAuthTokenCustomizer(connectionService, properties)
    }

    @Test
    fun `stores user id as a string in public access token claims`() {
        val client = registeredClient("public-client", "cursor", AuthorizationGrantType.AUTHORIZATION_CODE)
        val authorization = OAuth2Authorization.withRegisteredClient(client)
            .principalName("10")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .build()
        given(connectionService.findActive(10, client.id)).willReturn(connection(client.id))

        val claims = customize(client, authorization, AuthorizationGrantType.AUTHORIZATION_CODE)

        assertThat(claims["user_id"]).isEqualTo("10")
        assertJdbcRoundTrip(client, claims)
    }

    @Test
    fun `stores user id as a string in internal access token claims`() {
        val client = registeredClient(
            "service-client",
            properties.serviceClientId,
            AuthorizationGrantType.TOKEN_EXCHANGE,
        )
        val connection = connection("public-client")
        val accessToken = OAuth2AccessToken(
            OAuth2AccessToken.TokenType.BEARER,
            "public-token",
            Instant.now().minusSeconds(1),
            Instant.now().plusSeconds(60),
        )
        val authorization = OAuth2Authorization.withRegisteredClient(client)
            .principalName("10")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .token(accessToken) { metadata ->
                metadata[OAuth2Authorization.Token.CLAIMS_METADATA_NAME] = mapOf(
                    "user_id" to "10",
                    "connection_id" to connection.id.toString(),
                )
            }
            .build()
        given(connectionService.findActive(connection.id)).willReturn(connection)

        val claims = customize(client, authorization, AuthorizationGrantType.TOKEN_EXCHANGE)

        assertThat(claims["user_id"]).isEqualTo("10")
    }

    private fun customize(
        client: RegisteredClient,
        authorization: OAuth2Authorization,
        grantType: AuthorizationGrantType,
    ): Map<String, Any> {
        val claimsBuilder = OAuth2TokenClaimsSet.builder()
        val context = OAuth2TokenClaimsContext.with(claimsBuilder)
            .registeredClient(client)
            .authorization(authorization)
            .authorizationGrantType(grantType)
            .build()

        customizer.customize(context)

        return claimsBuilder.build().claims
    }

    private fun registeredClient(
        id: String,
        clientId: String,
        grantType: AuthorizationGrantType,
    ): RegisteredClient {
        val builder = RegisteredClient.withId(id)
            .clientId(clientId)
            .authorizationGrantType(grantType)
        if (grantType == AuthorizationGrantType.AUTHORIZATION_CODE) {
            builder.redirectUri("http://localhost:8787/callback")
        }
        return builder.build()
    }

    private fun assertJdbcRoundTrip(client: RegisteredClient, claims: Map<String, Any>) {
        val database = EmbeddedDatabaseBuilder()
            .generateUniqueName(true)
            .setType(EmbeddedDatabaseType.H2)
            .addScript(
                "classpath:org/springframework/security/oauth2/server/authorization/client/" +
                    "oauth2-registered-client-schema.sql",
            )
            .addScript(
                "classpath:org/springframework/security/oauth2/server/authorization/" +
                    "oauth2-authorization-schema.sql",
            )
            .build()
        try {
            val jdbcTemplate = JdbcTemplate(database)
            val clientRepository = JdbcRegisteredClientRepository(jdbcTemplate)
            clientRepository.save(client)
            val authorizationService = JdbcOAuth2AuthorizationService(jdbcTemplate, clientRepository)
            val accessToken = OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "persisted-token",
                Instant.now().minusSeconds(1),
                Instant.now().plusSeconds(60),
            )
            val persisted = OAuth2Authorization.withRegisteredClient(client)
                .principalName("10")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .token(accessToken) { metadata ->
                    metadata[OAuth2Authorization.Token.CLAIMS_METADATA_NAME] = claims
                }
                .build()

            authorizationService.save(persisted)

            assertThat(authorizationService.findByToken("persisted-token", OAuth2TokenType.ACCESS_TOKEN))
                .isNotNull
        } finally {
            database.shutdown()
        }
    }

    private fun connection(registeredClientId: String) = McpConnection(
        id = UUID.randomUUID(),
        user = User(id = 10, username = "user", nickname = "User"),
        registeredClientId = registeredClientId,
        clientId = "cursor",
        clientName = "Cursor",
        callbackOrigin = "http://localhost:8787",
    )
}
