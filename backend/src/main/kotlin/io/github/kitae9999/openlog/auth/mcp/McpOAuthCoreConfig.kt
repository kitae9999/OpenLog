package io.github.kitae9999.openlog.auth.mcp

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.crypto.factory.PasswordEncoderFactories
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.core.ClientAuthenticationMethod
import org.springframework.security.oauth2.server.authorization.JdbcOAuth2AuthorizationConsentService
import org.springframework.security.oauth2.server.authorization.JdbcOAuth2AuthorizationService
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService
import org.springframework.security.oauth2.server.authorization.client.JdbcRegisteredClientRepository
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings
import org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings
import java.util.UUID

@Configuration
@ConditionalOnProperty(prefix = "auth.mcp", name = ["enabled"], havingValue = "true")
class McpOAuthCoreConfig {
    @Bean
    fun mcpPasswordEncoder(): PasswordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder()

    @Bean
    fun registeredClientRepository(
        jdbcTemplate: JdbcTemplate,
        properties: McpOAuthProperties,
        passwordEncoder: PasswordEncoder,
    ): RegisteredClientRepository {
        require(
            properties.serviceClientId.isNotBlank() &&
                properties.serviceClientSecret.isNotBlank() &&
                properties.serviceClientSecret != "change-me",
        ) {
            "MCP_SERVICE_CLIENT_SECRET must be configured when remote MCP is enabled."
        }
        val repository = JdbcRegisteredClientRepository(jdbcTemplate)
        if (repository.findByClientId(properties.serviceClientId) == null) {
            repository.save(
                RegisteredClient.withId(UUID.randomUUID().toString())
                    .clientId(properties.serviceClientId)
                    .clientSecret(passwordEncoder.encode(properties.serviceClientSecret))
                    .clientName("OpenLog Remote MCP Service")
                    .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                    .authorizationGrantType(AuthorizationGrantType.TOKEN_EXCHANGE)
                    .scope(INTERNAL_SCOPE)
                    .clientSettings(ClientSettings.builder().requireAuthorizationConsent(false).build())
                    .tokenSettings(
                        TokenSettings.builder()
                            .accessTokenFormat(OAuth2TokenFormat.REFERENCE)
                            .accessTokenTimeToLive(properties.internalTokenTtl)
                            .reuseRefreshTokens(false)
                            .build(),
                    )
                    .build(),
            )
        }
        return repository
    }

    @Bean
    fun oauth2AuthorizationService(
        jdbcTemplate: JdbcTemplate,
        registeredClientRepository: RegisteredClientRepository,
    ): OAuth2AuthorizationService = JdbcOAuth2AuthorizationService(
        jdbcTemplate,
        registeredClientRepository,
    )

    @Bean
    fun oauth2AuthorizationConsentService(
        jdbcTemplate: JdbcTemplate,
        registeredClientRepository: RegisteredClientRepository,
    ): OAuth2AuthorizationConsentService = JdbcOAuth2AuthorizationConsentService(
        jdbcTemplate,
        registeredClientRepository,
    )

    @Bean
    fun authorizationServerSettings(properties: McpOAuthProperties) =
        org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings
            .builder()
            .issuer(properties.issuer)
            .authorizationEndpoint("/oauth2/authorize")
            .tokenEndpoint("/oauth2/token")
            .tokenIntrospectionEndpoint("/oauth2/introspect")
            .tokenRevocationEndpoint("/oauth2/revoke")
            .clientRegistrationEndpoint("/oauth2/register")
            .build()

    private companion object {
        private const val INTERNAL_SCOPE = "mcp:internal"
    }
}
