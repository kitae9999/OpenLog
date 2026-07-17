package io.github.kitae9999.openlog.auth.mcp

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.web.filter.OncePerRequestFilter
import java.nio.charset.StandardCharsets
import java.util.Base64

class McpIntrospectionClientFilter(
    private val properties: McpOAuthProperties,
) : OncePerRequestFilter() {
    override fun shouldNotFilter(request: HttpServletRequest): Boolean =
        request.method != "POST" || request.servletPath != "/oauth2/introspect"

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        if (basicClientId(request) != properties.serviceClientId) {
            response.status = HttpServletResponse.SC_UNAUTHORIZED
            response.setHeader("WWW-Authenticate", "Basic realm=\"OpenLog MCP introspection\"")
            return
        }
        filterChain.doFilter(request, response)
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
}
