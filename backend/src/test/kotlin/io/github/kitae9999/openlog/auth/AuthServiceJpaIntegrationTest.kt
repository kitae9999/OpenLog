package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.repository.OauthAccountRepository
import io.github.kitae9999.openlog.user.repository.UserRepository
import io.github.kitae9999.openlog.workspace.DefaultWorkspaceAgentGuide
import io.github.kitae9999.openlog.workspace.repository.WorkspaceAgentGuideRepository
import io.github.kitae9999.openlog.workspace.repository.WorkspaceRepository
import jakarta.persistence.EntityManager
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.mockito.Mockito.mock
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.web.client.RestClient

@DataJpaTest(
    properties = [
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
    ],
)
class AuthServiceJpaIntegrationTest @Autowired constructor(
    private val userRepository: UserRepository,
    private val oauthAccountRepository: OauthAccountRepository,
    private val workspaceRepository: WorkspaceRepository,
    private val workspaceAgentGuideRepository: WorkspaceAgentGuideRepository,
    private val entityManager: EntityManager,
) {
    private lateinit var authService: AuthService

    @BeforeEach
    fun setUp() {
        authService = AuthService(
            clientId = "test-client-id",
            redirectUri = "http://localhost/test-callback",
            clientSecret = "test-client-secret",
            redisTemplate = mock(StringRedisTemplate::class.java),
            restClientBuilder = RestClient.builder(),
            userRepository = userRepository,
            oauthAccountRepository = oauthAccountRepository,
            workspaceRepository = workspaceRepository,
            workspaceAgentGuideRepository = workspaceAgentGuideRepository,
        )
    }

    @ParameterizedTest
    @ValueSource(strings = ["google", "github"])
    fun `new oauth user persists account default workspace and agent guide`(provider: String) {
        val user = authService.findOrCreateOAuthUser(
            provider = provider,
            providerUserId = "$provider-user-id",
            picture = null,
            email = "$provider@example.com",
        )

        entityManager.flush()
        entityManager.clear()

        val userId = requireNotNull(user.id)
        val oauthAccount = oauthAccountRepository.findByProviderAndProviderUserId(
            provider,
            "$provider-user-id",
        )
        val workspace = workspaceRepository.findByOwnerIdAndSlug(userId, "default")
        val workspaceId = requireNotNull(workspace?.id)
        val guide = workspaceAgentGuideRepository.findById(workspaceId).orElseThrow()

        assertThat(userRepository.findById(userId)).isPresent
        assertThat(oauthAccount?.user?.id).isEqualTo(userId)
        assertThat(guide.workspaceId).isEqualTo(workspaceId)
        assertThat(guide.content).isEqualTo(DefaultWorkspaceAgentGuide.CONTENT)
    }

    @Test
    fun `existing oauth account does not create duplicate user workspace or guide`() {
        val firstUser = authService.findOrCreateOAuthUser(
            provider = "google",
            providerUserId = "existing-user-id",
            picture = null,
            email = "existing@example.com",
        )
        entityManager.flush()
        entityManager.clear()

        val secondUser = authService.findOrCreateOAuthUser(
            provider = "google",
            providerUserId = "existing-user-id",
            picture = "https://example.com/changed.png",
            email = "changed@example.com",
        )
        entityManager.flush()

        assertThat(secondUser.id).isEqualTo(firstUser.id)
        assertThat(userRepository.count()).isEqualTo(1)
        assertThat(oauthAccountRepository.count()).isEqualTo(1)
        assertThat(workspaceRepository.count()).isEqualTo(1)
        assertThat(workspaceAgentGuideRepository.count()).isEqualTo(1)
    }
}
