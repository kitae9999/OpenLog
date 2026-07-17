package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.auth.JwtTokenService
import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter
import org.springframework.web.util.UriComponentsBuilder
import tools.jackson.databind.ObjectMapper
import kotlin.jvm.optionals.getOrNull

class McpAuthorizationRequestFilter(
    private val jwtTokenService: JwtTokenService,
    private val userRepository: UserRepository,
    private val challengeService: McpOAuthChallengeService,
    private val objectMapper: ObjectMapper,
    private val properties: McpOAuthProperties,
    private val accessTokenCookieName: String,
) : OncePerRequestFilter() {
    override fun shouldNotFilter(request: HttpServletRequest): Boolean =
        request.method != "GET" || request.servletPath != "/oauth2/authorize"

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        try {
            val user = resolveUser(request)
            val approvalId = request.getParameter(McpOAuthChallengeService.APPROVAL_PARAMETER)
            if (approvalId != null) {
                val userId = user?.id ?: throw BadRequestException("MCP 연결을 승인하려면 로그인해야 합니다.")
                challengeService.consumeApproval(request, approvalId, userId)
                SecurityContextHolder.getContext().authentication = UsernamePasswordAuthenticationToken(
                    userId.toString(),
                    null,
                    emptyList(),
                )
                filterChain.doFilter(request, response)
                return
            }

            val challengeId = challengeService.createAuthorizationChallenge(request, user?.id)
            val consentUrl = UriComponentsBuilder
                .fromUriString(properties.frontendConsentUrl)
                .queryParam("challenge", challengeId)
                .build()
                .encode()
                .toUriString()
            response.sendRedirect(consentUrl)
        } catch (exception: BadRequestException) {
            response.status = HttpServletResponse.SC_BAD_REQUEST
            response.contentType = MediaType.APPLICATION_JSON_VALUE
            response.characterEncoding = Charsets.UTF_8.name()
            objectMapper.writeValue(
                response.outputStream,
                mapOf(
                    "error" to "invalid_request",
                    "error_description" to (exception.message ?: "Invalid OAuth authorization request."),
                ),
            )
        }
    }

    private fun resolveUser(request: HttpServletRequest): User? {
        val token = request.cookies
            ?.firstOrNull { it.name == accessTokenCookieName }
            ?.value
            ?: return null
        return runCatching {
            userRepository.findById(jwtTokenService.parseUserId(token)).getOrNull()
        }.getOrNull()
    }
}
