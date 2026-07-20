package io.github.kitae9999.openlog.config

import io.github.kitae9999.openlog.user.entity.User
import io.micrometer.core.instrument.simple.SimpleMeterRegistry
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.mock.web.MockFilterChain
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import tools.jackson.databind.ObjectMapper

@ExtendWith(MockitoExtension::class)
class WorkspaceUserRateLimitFilterTest {
    @Mock private lateinit var rateLimiter: WorkspaceUserRateLimiter
    private lateinit var meterRegistry: SimpleMeterRegistry
    private lateinit var filter: WorkspaceUserRateLimitFilter

    @BeforeEach
    fun setUp() {
        meterRegistry = SimpleMeterRegistry()
        filter = WorkspaceUserRateLimitFilter(
            rateLimiter = rateLimiter,
            objectMapper = ObjectMapper(),
            meterRegistry = meterRegistry,
            enabled = true,
        )
    }

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
        meterRegistry.close()
    }

    @Test
    fun `authenticated workspace requests use the user id quota`() {
        authenticate(userId = 7L)
        given(rateLimiter.tryAcquire(7L)).willReturn(false)
        val request = workspaceRequest("/workspaces/10/dashboard")
        val response = MockHttpServletResponse()
        val chain = MockFilterChain()

        filter.doFilter(request, response, chain)

        assertThat(response.status).isEqualTo(429)
        assertThat(response.getHeader("Retry-After")).isEqualTo("1")
        assertThat(response.contentAsString).contains("RATE_LIMITED")
        assertThat(chain.request).isNull()
        verify(rateLimiter).tryAcquire(7L)
    }

    @Test
    fun `different authenticated users pass their own identity to the limiter`() {
        authenticate(userId = 8L)
        given(rateLimiter.tryAcquire(8L)).willReturn(true)
        val request = workspaceRequest("/workspaces/10/tasks")
        val response = MockHttpServletResponse()
        val chain = MockFilterChain()

        filter.doFilter(request, response, chain)

        assertThat(response.status).isEqualTo(200)
        assertThat(chain.request).isSameAs(request)
        verify(rateLimiter).tryAcquire(8L)
    }

    @Test
    fun `workspace SSE connections keep their separate connection limit`() {
        authenticate(userId = 9L)
        val request = workspaceRequest("/workspaces/10/events")
        val response = MockHttpServletResponse()
        val chain = MockFilterChain()

        filter.doFilter(request, response, chain)

        assertThat(chain.request).isSameAs(request)
        verifyNoInteractions(rateLimiter)
    }

    private fun authenticate(userId: Long) {
        val user = User(id = userId, username = "user-$userId", nickname = "User $userId")
        SecurityContextHolder.getContext().authentication =
            UsernamePasswordAuthenticationToken(user, null, emptyList())
    }

    private fun workspaceRequest(path: String): MockHttpServletRequest {
        return MockHttpServletRequest("GET", path).apply {
            servletPath = path
        }
    }
}
