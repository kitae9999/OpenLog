package io.github.kitae9999.openlog.config

import io.github.kitae9999.openlog.auth.GithubOAuthSuccessHandler
import io.github.kitae9999.openlog.auth.JwtAuthenticationFilter
import io.github.kitae9999.openlog.auth.JwtTokenService
import io.github.kitae9999.openlog.auth.mcp.McpInternalTokenIntrospector
import io.github.kitae9999.openlog.auth.mcp.McpOAuthPropertiesConfig
import io.github.kitae9999.openlog.auth.mcp.McpProtectedResourceMetadataController
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.test.context.TestPropertySource
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(McpProtectedResourceMetadataController::class)
@Import(SecurityConfig::class, JwtAuthenticationFilter::class, McpOAuthPropertiesConfig::class)
@TestPropertySource(
    properties = [
        "auth.mcp.enabled=true",
        "auth.mcp.issuer=https://api.openlog.test",
        "auth.mcp.resource=https://api.openlog.test/mcp",
    ],
)
class McpProtectedResourceMetadataSecurityTest @Autowired constructor(
    private val mockMvc: MockMvc,
) {
    @MockitoBean
    private lateinit var jwtTokenService: JwtTokenService

    @MockitoBean
    private lateinit var userRepository: UserRepository

    @MockitoBean
    private lateinit var githubOAuthSuccessHandler: GithubOAuthSuccessHandler

    @MockitoBean
    private lateinit var clientRegistrationRepository: ClientRegistrationRepository

    @MockitoBean
    private lateinit var introspector: McpInternalTokenIntrospector

    @Test
    fun `protected resource metadata describes the public MCP endpoint`() {
        mockMvc.perform(get("/.well-known/oauth-protected-resource/mcp"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.resource").value("https://api.openlog.test/mcp"))
            .andExpect(jsonPath("$.authorization_servers[0]").value("https://api.openlog.test"))
            .andExpect(jsonPath("$.scopes_supported[0]").value("mcp:tools"))
            .andExpect(jsonPath("$.bearer_methods_supported[0]").value("header"))
            .andExpect(jsonPath("$.resource_name").value("OpenLog Remote MCP"))
            .andExpect(jsonPath("$.tls_client_certificate_bound_access_tokens").doesNotExist())
    }
}
