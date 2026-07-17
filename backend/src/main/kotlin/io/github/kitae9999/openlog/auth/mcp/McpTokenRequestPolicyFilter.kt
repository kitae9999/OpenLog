package io.github.kitae9999.openlog.auth.mcp

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.web.filter.OncePerRequestFilter
import tools.jackson.databind.ObjectMapper
import java.nio.charset.StandardCharsets
import java.util.Base64

class McpTokenRequestPolicyFilter(
    private val properties: McpOAuthProperties,
    private val objectMapper: ObjectMapper,
) : OncePerRequestFilter() {
    override fun shouldNotFilter(request: HttpServletRequest): Boolean =
        request.method != "POST" || request.servletPath != "/oauth2/token"

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val error = validateRequest(request)
        if (error != null) {
            response.status = HttpServletResponse.SC_BAD_REQUEST
            response.contentType = MediaType.APPLICATION_JSON_VALUE
            response.characterEncoding = Charsets.UTF_8.name()
            objectMapper.writeValue(
                response.outputStream,
                mapOf("error" to "invalid_target", "error_description" to error),
            )
            return
        }
        filterChain.doFilter(request, response)
    }

    private fun validateRequest(request: HttpServletRequest): String? {
        val grantType = request.getParameter("grant_type")
        val resources = request.getParameterValues("resource")?.toList().orEmpty()
        val audiences = request.getParameterValues("audience")?.toList().orEmpty()
        if (resources.size > 1 || audiences.size > 1) {
            return "resource and audience must each contain at most one value."
        }

        if (grantType == AuthorizationGrantType.TOKEN_EXCHANGE.value) {
            if (basicClientId(request) != properties.serviceClientId) {
                return "Only the OpenLog MCP service may exchange tokens."
            }
            if (resources.singleOrNull() != properties.internalApiResource) {
                return "Token exchange must target the OpenLog internal API resource."
            }
            if (audiences.singleOrNull()?.let { it != properties.internalApiResource } == true) {
                return "Token exchange audience does not match the internal API resource."
            }
            if (request.getParameter("scope") != INTERNAL_SCOPE) {
                return "Token exchange scope must be mcp:internal."
            }
            return null
        }

        if (grantType == AuthorizationGrantType.AUTHORIZATION_CODE.value ||
            grantType == AuthorizationGrantType.REFRESH_TOKEN.value
        ) {
            if (resources.singleOrNull()?.let { it != properties.resource } == true) {
                return "resource does not match the OpenLog MCP resource."
            }
            if (audiences.singleOrNull()?.let { it != properties.resource } == true) {
                return "audience does not match the OpenLog MCP resource."
            }
        }
        return null
    }

    private fun basicClientId(request: HttpServletRequest): String? {
        val header = request.getHeader("Authorization") ?: return null
        if (!header.startsWith("Basic ", ignoreCase = true)) {
            return null
        }
        val decoded = runCatching {
            String(Base64.getDecoder().decode(header.substringAfter(' ')), StandardCharsets.UTF_8)
        }.getOrNull() ?: return null
        return decoded.substringBefore(':')
    }

    private companion object {
        private const val INTERNAL_SCOPE = "mcp:internal"
    }
}
