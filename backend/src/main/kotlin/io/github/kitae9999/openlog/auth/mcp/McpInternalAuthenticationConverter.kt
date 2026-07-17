package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.user.repository.UserRepository
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.core.OAuth2AuthenticatedPrincipal
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException
import org.springframework.security.oauth2.server.resource.introspection.OpaqueTokenAuthenticationConverter

class McpInternalAuthenticationConverter(
    private val userRepository: UserRepository,
) : OpaqueTokenAuthenticationConverter {
    override fun convert(
        introspectedToken: String,
        authenticatedPrincipal: OAuth2AuthenticatedPrincipal,
    ): Authentication {
        val userId = authenticatedPrincipal.name.toLongOrNull()
            ?: throw InvalidBearerTokenException("Internal token subject is invalid.")
        val user = userRepository.findById(userId).orElseThrow {
            InvalidBearerTokenException("Internal token user no longer exists.")
        }
        return UsernamePasswordAuthenticationToken(
            user,
            introspectedToken,
            authenticatedPrincipal.authorities,
        )
    }
}
