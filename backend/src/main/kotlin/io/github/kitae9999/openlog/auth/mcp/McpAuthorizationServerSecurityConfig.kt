package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.auth.JwtTokenService
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configurers.oauth2.server.authorization.OAuth2AuthorizationServerConfigurer
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2ClientRegistrationAuthenticationProvider
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.access.intercept.AuthorizationFilter
import tools.jackson.databind.ObjectMapper

@Configuration
@ConditionalOnProperty(prefix = "auth.mcp", name = ["enabled"], havingValue = "true")
class McpAuthorizationServerSecurityConfig(
    private val properties: McpOAuthProperties,
) {
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    fun mcpAuthorizationServerSecurityFilterChain(
        http: HttpSecurity,
        registeredClientRepository: RegisteredClientRepository,
        authorizationService: OAuth2AuthorizationService,
        authorizationConsentService: OAuth2AuthorizationConsentService,
        authorizationServerSettings: AuthorizationServerSettings,
        connectionService: McpConnectionService,
        challengeService: McpOAuthChallengeService,
        jwtTokenService: JwtTokenService,
        userRepository: UserRepository,
        objectMapper: ObjectMapper,
        @Value("\${auth.jwt.cookie-name:openlog_access_token}") accessTokenCookieName: String,
    ): SecurityFilterChain {
        val authorizationServer = OAuth2AuthorizationServerConfigurer()
        val dynamicClientConverter = McpDynamicClientConverter(
            accessTokenTtl = properties.accessTokenTtl,
            refreshTokenTtl = properties.refreshTokenTtl,
        )

        http
            .securityMatcher(authorizationServer.endpointsMatcher)
            .with(authorizationServer) { server ->
                server
                    .registeredClientRepository(registeredClientRepository)
                    .authorizationService(authorizationService)
                    .authorizationConsentService(authorizationConsentService)
                    .authorizationServerSettings(authorizationServerSettings)
                    .clientRegistrationEndpoint { endpoint ->
                        endpoint
                            .openRegistrationAllowed(true)
                            .authenticationProviders { providers ->
                                providers
                                    .filterIsInstance<OAuth2ClientRegistrationAuthenticationProvider>()
                                    .forEach { provider ->
                                        provider.setOpenRegistrationAllowed(true)
                                        provider.setRegisteredClientConverter(dynamicClientConverter)
                                    }
                            }
                    }
                    .tokenIntrospectionEndpoint { endpoint ->
                        endpoint.introspectionResponseHandler(
                            McpIntrospectionResponseHandler(
                                connectionService = connectionService,
                                objectMapper = objectMapper,
                                properties = properties,
                            ),
                        )
                    }
            }
            .authorizeHttpRequests { requests -> requests.anyRequest().permitAll() }
            .csrf { csrf -> csrf.ignoringRequestMatchers(authorizationServer.endpointsMatcher) }
            .addFilterAfter(
                McpAuthorizationRequestFilter(
                    jwtTokenService = jwtTokenService,
                    userRepository = userRepository,
                    challengeService = challengeService,
                    objectMapper = objectMapper,
                    properties = properties,
                    accessTokenCookieName = accessTokenCookieName,
                ),
                AuthorizationFilter::class.java,
            )
            .addFilterAfter(
                McpTokenRequestPolicyFilter(properties, objectMapper),
                AuthorizationFilter::class.java,
            )
            .addFilterAfter(
                McpIntrospectionClientFilter(properties),
                AuthorizationFilter::class.java,
            )

        return http.build()
    }
}
