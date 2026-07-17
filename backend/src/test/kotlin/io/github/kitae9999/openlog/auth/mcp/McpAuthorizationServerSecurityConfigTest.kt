package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.auth.JwtTokenService
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest
import org.springframework.context.ApplicationContext
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings
import org.springframework.security.oauth2.server.authorization.web.OAuth2AuthorizationEndpointFilter
import org.springframework.security.oauth2.server.authorization.web.OAuth2TokenEndpointFilter
import org.springframework.security.oauth2.server.authorization.web.OAuth2TokenIntrospectionEndpointFilter
import org.springframework.security.web.SecurityFilterChain
import org.springframework.test.context.TestPropertySource
import org.springframework.test.context.bean.override.mockito.MockitoBean
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

@WebMvcTest(McpProtectedResourceMetadataController::class)
@Import(
    McpAuthorizationServerSecurityConfig::class,
    McpOAuthPropertiesConfig::class,
    McpAuthorizationServerSecurityConfigTest.AuthorizationServerTestConfig::class,
)
@TestPropertySource(properties = ["auth.mcp.enabled=true"])
class McpAuthorizationServerSecurityConfigTest {
    @MockitoBean
    private lateinit var registeredClientRepository: RegisteredClientRepository

    @MockitoBean
    private lateinit var authorizationService: OAuth2AuthorizationService

    @MockitoBean
    private lateinit var authorizationConsentService: OAuth2AuthorizationConsentService

    @MockitoBean
    private lateinit var connectionService: McpConnectionService

    @MockitoBean
    private lateinit var challengeService: McpOAuthChallengeService

    @MockitoBean
    private lateinit var jwtTokenService: JwtTokenService

    @MockitoBean
    private lateinit var userRepository: UserRepository

    @MockitoBean
    private lateinit var jwtDecoder: JwtDecoder

    @Test
    fun `authorization server filter chain starts and applies request policies before endpoints`(
        context: ApplicationContext,
    ) {
        val filterChain = context.getBean(SecurityFilterChain::class.java)
        assertNotNull(filterChain)
        assertComesBefore(
            filterChain,
            McpAuthorizationRequestFilter::class.java,
            OAuth2AuthorizationEndpointFilter::class.java,
        )
        assertComesBefore(filterChain, McpTokenRequestPolicyFilter::class.java, OAuth2TokenEndpointFilter::class.java)
        assertComesBefore(
            filterChain,
            McpIntrospectionClientFilter::class.java,
            OAuth2TokenIntrospectionEndpointFilter::class.java,
        )
    }

    private fun assertComesBefore(
        filterChain: SecurityFilterChain,
        policyFilter: Class<*>,
        endpointFilter: Class<*>,
    ) {
        val policyIndex = filterChain.filters.indexOfFirst(policyFilter::isInstance)
        val endpointIndex = filterChain.filters.indexOfFirst(endpointFilter::isInstance)
        assertTrue(policyIndex >= 0, "${policyFilter.simpleName} is missing")
        assertTrue(endpointIndex >= 0, "${endpointFilter.simpleName} is missing")
        assertTrue(policyIndex < endpointIndex, "${policyFilter.simpleName} must run before ${endpointFilter.simpleName}")
    }

    @TestConfiguration
    @EnableWebSecurity
    class AuthorizationServerTestConfig {
        @Bean
        fun authorizationServerSettings(): AuthorizationServerSettings = AuthorizationServerSettings
            .builder()
            .issuer("http://localhost:8080/api")
            .authorizationEndpoint("/oauth2/authorize")
            .tokenEndpoint("/oauth2/token")
            .tokenIntrospectionEndpoint("/oauth2/introspect")
            .tokenRevocationEndpoint("/oauth2/revoke")
            .clientRegistrationEndpoint("/oauth2/register")
            .build()
    }
}
