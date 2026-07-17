package io.github.kitae9999.openlog.auth.mcp

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.core.DefaultOAuth2AuthenticatedPrincipal
import org.springframework.security.oauth2.core.OAuth2AuthenticatedPrincipal
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException
import org.springframework.security.oauth2.server.resource.introspection.OpaqueTokenIntrospector
import org.springframework.stereotype.Component
import java.util.UUID

@Component
@ConditionalOnProperty(prefix = "auth.mcp", name = ["enabled"], havingValue = "true")
class McpInternalTokenIntrospector(
    private val authorizationService: OAuth2AuthorizationService,
    private val connectionService: McpConnectionService,
    private val properties: McpOAuthProperties,
) : OpaqueTokenIntrospector {
    override fun introspect(token: String): OAuth2AuthenticatedPrincipal {
        val authorization = authorizationService.findByToken(token, OAuth2TokenType.ACCESS_TOKEN)
            ?: invalidToken()
        val accessToken = authorization.accessToken
        if (!accessToken.isActive) {
            invalidToken()
        }
        val claims = accessToken.claims?.toMutableMap() ?: invalidToken()
        if (claims["token_use"] != "internal_api" || !hasAudience(claims["aud"])) {
            invalidToken()
        }
        val userId = (claims["user_id"] as? Number)?.toLong()
            ?: claims["user_id"]?.toString()?.toLongOrNull()
            ?: invalidToken()
        val connectionId = claims["connection_id"]?.toString()
            ?.let { value -> runCatching { UUID.fromString(value) }.getOrNull() }
            ?: invalidToken()
        val connection = connectionService.findActive(connectionId)
            ?.takeIf { it.user.id == userId }
            ?: invalidToken()
        claims["permission_profile"] = connection.permissionProfile.wireValue
        claims["capabilities"] = connection.permissionProfile.capabilities()
        return DefaultOAuth2AuthenticatedPrincipal(
            userId.toString(),
            claims,
            listOf(SimpleGrantedAuthority("SCOPE_mcp:internal")),
        )
    }

    private fun hasAudience(value: Any?): Boolean = when (value) {
        is Collection<*> -> value.any { it == properties.internalApiResource }
        is String -> value == properties.internalApiResource
        else -> false
    }

    private fun invalidToken(): Nothing = throw InvalidBearerTokenException("Invalid internal MCP API token.")
}
