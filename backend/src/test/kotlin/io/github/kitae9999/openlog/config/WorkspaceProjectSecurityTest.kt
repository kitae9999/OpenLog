package io.github.kitae9999.openlog.config

import io.github.kitae9999.openlog.auth.GithubOAuthSuccessHandler
import io.github.kitae9999.openlog.auth.JwtAuthenticationFilter
import io.github.kitae9999.openlog.auth.JwtTokenService
import io.github.kitae9999.openlog.auth.exception.OAuthAuthenticationException
import io.github.kitae9999.openlog.user.repository.UserRepository
import io.github.kitae9999.openlog.workspace.WorkspaceProjectController
import io.github.kitae9999.openlog.workspace.WorkspaceProjectService
import io.micrometer.core.instrument.MeterRegistry
import jakarta.servlet.http.Cookie
import org.junit.jupiter.api.Test
import org.mockito.BDDMockito.given
import org.mockito.Mockito.verifyNoInteractions
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(WorkspaceProjectController::class)
@Import(SecurityConfig::class, JwtAuthenticationFilter::class)
class WorkspaceProjectSecurityTest @Autowired constructor(
    private val mockMvc: MockMvc,
) {
    @MockitoBean
    private lateinit var projectService: WorkspaceProjectService

    @MockitoBean
    private lateinit var jwtTokenService: JwtTokenService

    @MockitoBean
    private lateinit var userRepository: UserRepository

    @MockitoBean
    private lateinit var githubOAuthSuccessHandler: GithubOAuthSuccessHandler

    @MockitoBean
    private lateinit var clientRegistrationRepository: ClientRegistrationRepository

    @MockitoBean
    private lateinit var workspaceUserRateLimiter: WorkspaceUserRateLimiter

    @MockitoBean
    private lateinit var meterRegistry: MeterRegistry

    @Test
    fun `expired token returns unauthorized before agent context controller`() {
        given(jwtTokenService.parseUserId("expired-access-token"))
            .willThrow(OAuthAuthenticationException())

        mockMvc.perform(
            get("/workspace-projects/1/agent-context")
                .cookie(Cookie("openlog_access_token", "expired-access-token"))
        )
            .andExpect(status().isUnauthorized)
            .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))

        verifyNoInteractions(projectService)
    }
}
