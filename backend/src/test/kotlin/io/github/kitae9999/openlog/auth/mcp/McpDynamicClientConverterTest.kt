package io.github.kitae9999.openlog.auth.mcp

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.core.ClientAuthenticationMethod
import org.springframework.security.oauth2.core.OAuth2AuthenticationException
import org.springframework.security.oauth2.server.authorization.OAuth2ClientRegistration
import org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat
import java.time.Duration

class McpDynamicClientConverterTest {
    private val converter = McpDynamicClientConverter(
        accessTokenTtl = Duration.ofMinutes(10),
        refreshTokenTtl = Duration.ofDays(30),
    )

    @Test
    fun `registers only a public PKCE client with rotating reference tokens`() {
        val client = converter.convert(
            registration(
                redirectUri = "http://127.0.0.1:49152/oauth/callback",
                authenticationMethod = "none",
            ),
        )

        assertThat(client.clientSecret).isNull()
        assertThat(client.clientAuthenticationMethods)
            .containsExactly(ClientAuthenticationMethod.NONE)
        assertThat(client.authorizationGrantTypes)
            .containsExactlyInAnyOrder(
                AuthorizationGrantType.AUTHORIZATION_CODE,
                AuthorizationGrantType.REFRESH_TOKEN,
            )
        assertThat(client.clientSettings.isRequireProofKey).isTrue()
        assertThat(client.clientSettings.isRequireAuthorizationConsent).isTrue()
        assertThat(client.tokenSettings.accessTokenFormat).isEqualTo(OAuth2TokenFormat.REFERENCE)
        assertThat(client.tokenSettings.isReuseRefreshTokens).isFalse()
        assertThat(client.scopes).containsExactly("mcp:tools")
    }

    @Test
    fun `rejects non loopback HTTP redirect URIs`() {
        assertThatThrownBy {
            converter.convert(
                registration(
                    redirectUri = "http://agent.example.com/callback",
                    authenticationMethod = "none",
                ),
            )
        }.isInstanceOf(OAuth2AuthenticationException::class.java)
    }

    @Test
    fun `registers Cursor native app and web callback URIs`() {
        val redirectUris = listOf(
            "cursor://anysphere.cursor-mcp/oauth/callback",
            "https://www.cursor.com/agents/mcp/oauth/callback",
            "http://localhost:8787/callback",
        )

        val client = converter.convert(
            registration(
                redirectUris = redirectUris,
                authenticationMethod = "none",
            ),
        )

        assertThat(client.redirectUris).containsExactlyInAnyOrderElementsOf(redirectUris)
    }

    @Test
    fun `rejects unapproved native app redirect URIs`() {
        assertThatThrownBy {
            converter.convert(
                registration(
                    redirectUri = "cursor://attacker.example/oauth/callback",
                    authenticationMethod = "none",
                ),
            )
        }.isInstanceOf(OAuth2AuthenticationException::class.java)
    }

    @Test
    fun `rejects confidential dynamic clients`() {
        assertThatThrownBy {
            converter.convert(
                registration(
                    redirectUri = "https://agent.example.com/callback",
                    authenticationMethod = "client_secret_basic",
                ),
            )
        }.isInstanceOf(OAuth2AuthenticationException::class.java)
    }

    private fun registration(
        redirectUri: String,
        authenticationMethod: String,
    ): OAuth2ClientRegistration = registration(listOf(redirectUri), authenticationMethod)

    private fun registration(
        redirectUris: List<String>,
        authenticationMethod: String,
    ): OAuth2ClientRegistration = OAuth2ClientRegistration.withClaims(
        mapOf(
            "client_name" to "Codex",
            "redirect_uris" to redirectUris,
            "token_endpoint_auth_method" to authenticationMethod,
            "grant_types" to listOf("authorization_code", "refresh_token"),
            "response_types" to listOf("code"),
            "scope" to listOf("mcp:tools"),
        ),
    ).build()
}
