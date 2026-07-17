package io.github.kitae9999.openlog.auth.mcp

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.core.OAuth2AuthenticationException
import org.springframework.security.oauth2.core.OAuth2Error
import org.springframework.security.oauth2.core.OAuth2ErrorCodes
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenClaimsContext
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer
import org.springframework.stereotype.Component
import java.util.UUID

@Component
@ConditionalOnProperty(prefix = "auth.mcp", name = ["enabled"], havingValue = "true")
class McpOAuthTokenCustomizer(
    private val connectionService: McpConnectionService,
    private val properties: McpOAuthProperties,
) : OAuth2TokenCustomizer<OAuth2TokenClaimsContext> {
    override fun customize(context: OAuth2TokenClaimsContext) {
        if (context.authorizationGrantType == AuthorizationGrantType.TOKEN_EXCHANGE) {
            customizeInternalApiToken(context)
            return
        }
        if (context.registeredClient.clientId == properties.serviceClientId) {
            invalidGrant()
        }

        val userId = context.authorization?.principalName?.toLongOrNull() ?: invalidGrant()
        val connection = connectionService.findActive(userId, context.registeredClient.id) ?: invalidGrant()
        context.claims
            .subject(userId.toString())
            .audience(listOf(properties.resource))
            .claim("resource", properties.resource)
            .claim("user_id", userId.toString())
            .claim("connection_id", connection.id.toString())
            .claim("permission_profile", connection.permissionProfile.wireValue)
            .claim("capabilities", connection.permissionProfile.capabilities())
            .claim("token_use", MCP_TOKEN_USE)
    }

    private fun customizeInternalApiToken(context: OAuth2TokenClaimsContext) {
        if (context.registeredClient.clientId != properties.serviceClientId) {
            invalidGrant()
        }
        val subjectClaims = context.authorization?.accessToken?.claims ?: invalidGrant()
        val userId = (subjectClaims["user_id"] as? Number)?.toLong()
            ?: subjectClaims["user_id"]?.toString()?.toLongOrNull()
            ?: invalidGrant()
        val connectionId = subjectClaims["connection_id"]?.toString()
            ?.let { value -> runCatching { UUID.fromString(value) }.getOrNull() }
            ?: invalidGrant()
        val connection = connectionService.findActive(connectionId)
            ?.takeIf { it.user.id == userId }
            ?: invalidGrant()

        context.claims
            .subject(userId.toString())
            .audience(listOf(properties.internalApiResource))
            .claim("resource", properties.internalApiResource)
            .claim("user_id", userId.toString())
            .claim("connection_id", connection.id.toString())
            .claim("permission_profile", connection.permissionProfile.wireValue)
            .claim("capabilities", connection.permissionProfile.capabilities())
            .claim("token_use", INTERNAL_TOKEN_USE)
    }

    private fun invalidGrant(): Nothing {
        throw OAuth2AuthenticationException(
            OAuth2Error(OAuth2ErrorCodes.INVALID_GRANT, "The MCP connection is no longer active.", null),
        )
    }

    private companion object {
        private const val MCP_TOKEN_USE = "mcp_access"
        private const val INTERNAL_TOKEN_USE = "internal_api"
    }
}

fun McpPermissionProfile.capabilities(): List<String> = when (this) {
    McpPermissionProfile.READ_ONLY -> listOf("read")
    McpPermissionProfile.SAFE_WRITE -> listOf("read", "write", "publish")
    McpPermissionProfile.FULL -> listOf("read", "write", "publish", "delete")
}
