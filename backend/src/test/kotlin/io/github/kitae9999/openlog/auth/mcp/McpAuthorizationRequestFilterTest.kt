package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.auth.JwtTokenService
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.Cookie
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationCodeRequestAuthenticationToken
import tools.jackson.databind.ObjectMapper
import java.util.Optional

@ExtendWith(MockitoExtension::class)
class McpAuthorizationRequestFilterTest {
    @Mock
    private lateinit var jwtTokenService: JwtTokenService

    @Mock
    private lateinit var userRepository: UserRepository

    @Mock
    private lateinit var challengeService: McpOAuthChallengeService

    @Mock
    private lateinit var objectMapper: ObjectMapper

    @AfterEach
    fun clearSecurityContext() {
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `rebuilds an approved authorization request with the authenticated user`() {
        val user = User(id = 10, username = "user", nickname = "User")
        given(jwtTokenService.parseUserId("access-token")).willReturn(10)
        given(userRepository.findById(10)).willReturn(Optional.of(user))
        val filter = McpAuthorizationRequestFilter(
            jwtTokenService = jwtTokenService,
            userRepository = userRepository,
            challengeService = challengeService,
            objectMapper = objectMapper,
            properties = McpOAuthProperties(),
            accessTokenCookieName = "openlog_access_token",
        )
        val request = MockHttpServletRequest("GET", "/oauth2/authorize").apply {
            servletPath = "/oauth2/authorize"
            setCookies(Cookie("openlog_access_token", "access-token"))
            addParameter(McpOAuthChallengeService.APPROVAL_PARAMETER, "approval-id")
            setAttribute(OAuth2AuthorizationCodeRequestAuthenticationToken::class.java.name, Any())
        }
        val response = MockHttpServletResponse()
        var chainInvoked = false
        val chain = FilterChain { servletRequest, _ ->
            chainInvoked = true
            assertThat(
                servletRequest.getAttribute(OAuth2AuthorizationCodeRequestAuthenticationToken::class.java.name),
            ).isNull()
            val authentication = requireNotNull(SecurityContextHolder.getContext().authentication)
            assertThat(authentication.name).isEqualTo("10")
            assertThat(authentication.isAuthenticated).isTrue()
        }

        filter.doFilter(request, response, chain)

        assertThat(chainInvoked).isTrue()
        verify(challengeService).consumeApproval(request, "approval-id", 10)
    }
}
