package io.github.kitae9999.openlog.auth.mcp

import org.springframework.core.convert.converter.Converter
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.core.ClientAuthenticationMethod
import org.springframework.security.oauth2.core.OAuth2AuthenticationException
import org.springframework.security.oauth2.core.OAuth2Error
import org.springframework.security.oauth2.core.OAuth2ErrorCodes
import org.springframework.security.oauth2.server.authorization.OAuth2ClientRegistration
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings
import org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings
import java.net.URI
import java.time.Duration
import java.time.Instant
import java.util.UUID

class McpDynamicClientConverter(
    private val accessTokenTtl: Duration,
    private val refreshTokenTtl: Duration,
) : Converter<OAuth2ClientRegistration, RegisteredClient> {
    override fun convert(source: OAuth2ClientRegistration): RegisteredClient {
        val redirectUris = source.redirectUris.orEmpty().distinct()
        if (redirectUris.isEmpty() || redirectUris.any { !isAllowedRedirectUri(it) }) {
            invalidClientMetadata(
                "redirect_uris must contain only HTTPS, loopback HTTP, or an approved native app callback URI.",
            )
        }

        val authenticationMethod = source.tokenEndpointAuthenticationMethod
        if (authenticationMethod != null && authenticationMethod != ClientAuthenticationMethod.NONE.value) {
            invalidClientMetadata("Only public clients using token_endpoint_auth_method=none are allowed.")
        }

        val grantTypes = source.grantTypes.orEmpty().ifEmpty {
            listOf(AuthorizationGrantType.AUTHORIZATION_CODE.value)
        }.toSet()
        val allowedGrantTypes = setOf(
            AuthorizationGrantType.AUTHORIZATION_CODE.value,
            AuthorizationGrantType.REFRESH_TOKEN.value,
        )
        if (
            AuthorizationGrantType.AUTHORIZATION_CODE.value !in grantTypes ||
            grantTypes.any { it !in allowedGrantTypes }
        ) {
            invalidClientMetadata("grant_types must use authorization_code and may include refresh_token.")
        }

        val responseTypes = source.responseTypes.orEmpty()
        if (responseTypes.any { it != "code" }) {
            invalidClientMetadata("Only response_type=code is allowed.")
        }

        val requestedScopes = source.scopes.orEmpty().toSet()
        if (requestedScopes.isNotEmpty() && requestedScopes != setOf(MCP_SCOPE)) {
            invalidClientMetadata("Only the mcp:tools scope is allowed.")
        }

        val clientName = source.clientName?.trim()?.takeIf { it.isNotEmpty() }
            ?.take(MAX_CLIENT_NAME_LENGTH)
            ?: "MCP client"
        val builder = RegisteredClient.withId(UUID.randomUUID().toString())
            .clientId(UUID.randomUUID().toString())
            .clientIdIssuedAt(Instant.now())
            .clientName(clientName)
            .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .scope(MCP_SCOPE)
            .clientSettings(
                ClientSettings.builder()
                    .requireProofKey(true)
                    .requireAuthorizationConsent(true)
                    .build(),
            )
            .tokenSettings(
                TokenSettings.builder()
                    .accessTokenFormat(OAuth2TokenFormat.REFERENCE)
                    .accessTokenTimeToLive(accessTokenTtl)
                    .refreshTokenTimeToLive(refreshTokenTtl)
                    .reuseRefreshTokens(false)
                    .build(),
            )

        if (AuthorizationGrantType.REFRESH_TOKEN.value in grantTypes) {
            builder.authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
        }
        redirectUris.forEach(builder::redirectUri)
        return builder.build()
    }

    private fun isAllowedRedirectUri(value: String): Boolean {
        val uri = runCatching { URI(value) }.getOrNull() ?: return false
        if (!uri.isAbsolute || uri.fragment != null || uri.userInfo != null || uri.host.isNullOrBlank()) {
            return false
        }
        if (uri.scheme.equals("https", ignoreCase = true)) {
            return true
        }
        if (uri.scheme.equals("http", ignoreCase = true) && uri.host.lowercase() in LOOPBACK_HOSTS) {
            return true
        }
        return value == CURSOR_REDIRECT_URI
    }

    private fun invalidClientMetadata(description: String): Nothing {
        throw OAuth2AuthenticationException(
            OAuth2Error(OAuth2ErrorCodes.INVALID_REQUEST, description, null),
        )
    }

    private companion object {
        private const val MCP_SCOPE = "mcp:tools"
        private const val MAX_CLIENT_NAME_LENGTH = 200
        private const val CURSOR_REDIRECT_URI = "cursor://anysphere.cursor-mcp/oauth/callback"
        private val LOOPBACK_HOSTS = setOf("localhost", "127.0.0.1", "::1")
    }
}
