package io.github.kitae9999.openlog.auth.mcp

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockFilterChain
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import tools.jackson.databind.ObjectMapper
import java.util.Base64

class McpTokenRequestPolicyFilterTest {
    private val properties = McpOAuthProperties(
        resource = "https://api.openlog.test/mcp",
        internalApiResource = "https://api.openlog.test/api",
        serviceClientId = "openlog-mcp-service",
    )
    private val filter = McpTokenRequestPolicyFilter(properties, ObjectMapper())

    @Test
    fun `rejects authorization code requests for another resource`() {
        val response = execute(
            parameters = mapOf(
                "grant_type" to "authorization_code",
                "resource" to "https://attacker.example/mcp",
            ),
        )

        assertThat(response.status).isEqualTo(400)
        assertThat(response.contentAsString).contains("invalid_target")
    }

    @Test
    fun `rejects token exchange from a client other than the MCP service`() {
        val response = execute(
            parameters = mapOf(
                "grant_type" to "urn:ietf:params:oauth:grant-type:token-exchange",
                "resource" to properties.internalApiResource,
                "scope" to "mcp:internal",
            ),
            clientId = "dynamic-public-client",
        )

        assertThat(response.status).isEqualTo(400)
        assertThat(response.contentAsString).contains("Only the OpenLog MCP service")
    }

    @Test
    fun `allows the MCP service to exchange for the fixed internal resource`() {
        val response = execute(
            parameters = mapOf(
                "grant_type" to "urn:ietf:params:oauth:grant-type:token-exchange",
                "resource" to properties.internalApiResource,
                "audience" to properties.internalApiResource,
                "scope" to "mcp:internal",
            ),
            clientId = properties.serviceClientId,
        )

        assertThat(response.status).isEqualTo(200)
    }

    private fun execute(
        parameters: Map<String, String>,
        clientId: String? = null,
    ): MockHttpServletResponse {
        val request = MockHttpServletRequest("POST", "/oauth2/token").apply {
            servletPath = "/oauth2/token"
            parameters.forEach(::addParameter)
            if (clientId != null) {
                val credentials = Base64.getEncoder().encodeToString("$clientId:secret".toByteArray())
                addHeader("Authorization", "Basic $credentials")
            }
        }
        val response = MockHttpServletResponse()
        filter.doFilter(request, response, MockFilterChain())
        return response
    }
}
