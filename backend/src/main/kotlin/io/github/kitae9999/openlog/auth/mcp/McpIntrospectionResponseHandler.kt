package io.github.kitae9999.openlog.auth.mcp

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2TokenIntrospectionAuthenticationToken
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import tools.jackson.databind.ObjectMapper
import java.util.UUID

class McpIntrospectionResponseHandler(
    private val connectionService: McpConnectionService,
    private val objectMapper: ObjectMapper,
    private val properties: McpOAuthProperties,
) : AuthenticationSuccessHandler {
    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication,
    ) {
        val introspection = authentication as OAuth2TokenIntrospectionAuthenticationToken
        val claims = introspection.tokenClaims.claims.toMutableMap()
        if (claims["active"] != true || !isCurrentConnection(claims)) {
            write(response, mapOf("active" to false))
            return
        }

        val connectionId = UUID.fromString(claims["connection_id"].toString())
        val connection = requireNotNull(connectionService.findActive(connectionId))
        claims["permission_profile"] = connection.permissionProfile.wireValue
        claims["capabilities"] = connection.permissionProfile.capabilities()
        write(response, claims)
    }

    private fun isCurrentConnection(claims: Map<String, Any>): Boolean {
        val connectionId = claims["connection_id"]?.toString()
            ?.let { value -> runCatching { UUID.fromString(value) }.getOrNull() }
            ?: return false
        val userId = (claims["user_id"] as? Number)?.toLong()
            ?: claims["user_id"]?.toString()?.toLongOrNull()
            ?: return false
        val connection = connectionService.findActive(connectionId) ?: return false
        if (connection.user.id != userId) {
            return false
        }
        val expectedAudience = when (claims["token_use"]) {
            "mcp_access" -> properties.resource
            "internal_api" -> properties.internalApiResource
            else -> return false
        }
        return hasAudience(claims["aud"], expectedAudience)
    }

    private fun hasAudience(value: Any?, expected: String): Boolean = when (value) {
        is Collection<*> -> value.any { it == expected }
        is String -> value == expected
        else -> false
    }

    private fun write(response: HttpServletResponse, body: Map<String, Any>) {
        response.status = HttpServletResponse.SC_OK
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.characterEncoding = Charsets.UTF_8.name()
        objectMapper.writeValue(response.outputStream, body)
    }
}
